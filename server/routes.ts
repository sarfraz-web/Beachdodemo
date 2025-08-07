import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  authenticateToken, 
  requireRole, 
  hashPassword, 
  comparePassword, 
  generateTokens, 
  verifyRefreshToken,
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  type AuthenticatedRequest,
  type LoginRequest,
  type RegisterRequest,
  type RefreshTokenRequest
} from "./middleware/auth";
import { upload, handleUploadError } from "./middleware/upload";
import { kycService } from "./services/kycService";
import { insertListingSchema, insertReportSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";
import express from "express";
import path from "path";

// Rate limiting - more lenient for development
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { message: "Too many requests from this IP" }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 auth requests per windowMs
  message: { message: "Too many authentication attempts" }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set trust proxy for rate limiting in hosted environments
  app.set('trust proxy', 1);
  
  // Apply rate limiting
  app.use('/api', apiLimiter);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AUTH ROUTES
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const data = registerSchema.parse(req.body) as RegisterRequest;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const existingPhone = await storage.getUserByPhone(data.phone);
      if (existingPhone) {
        return res.status(400).json({ message: 'User already exists with this phone number' });
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user
      const user = await storage.createUser({
        ...data,
        password: hashedPassword
      });

      // Generate tokens
      const tokens = await generateTokens(user.id, user.role);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          kycStatus: user.kycStatus
        },
        ...tokens
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body) as LoginRequest;
      
      // Find user by email or phone
      let user = await storage.getUserByEmail(data.identifier);
      if (!user) {
        user = await storage.getUserByPhone(data.identifier);
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Verify password
      const isValidPassword = await comparePassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate tokens
      const tokens = await generateTokens(user.id, user.role);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          kycStatus: user.kycStatus
        },
        ...tokens
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ message: error.message || 'Login failed' });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const data = refreshTokenSchema.parse(req.body) as RefreshTokenRequest;
      
      // Verify refresh token
      const payload = verifyRefreshToken(data.refreshToken);
      if (!payload) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Check if token exists in database
      const tokenRecord = await storage.getAuthToken(data.refreshToken);
      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        await storage.deleteAuthToken(data.refreshToken);
        return res.status(401).json({ message: 'Refresh token expired' });
      }

      // Get user
      const user = await storage.getUser(payload.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      // Delete old refresh token
      await storage.deleteAuthToken(data.refreshToken);

      // Generate new tokens
      const tokens = await generateTokens(user.id, user.role);

      res.json(tokens);
    } catch (error: any) {
      console.error('Refresh token error:', error);
      res.status(400).json({ message: error.message || 'Token refresh failed' });
    }
  });

  app.post('/api/auth/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await storage.deleteAuthToken(refreshToken);
      } else {
        // Delete all user tokens
        await storage.deleteUserTokens(req.user!.id);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        kycStatus: user.kycStatus,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // KYC ROUTES
  app.post('/api/kyc/submit', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await kycService.submitKycVerification(req.user!.id, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('KYC submission error:', error);
      res.status(400).json({ message: error.message || 'KYC submission failed' });
    }
  });

  app.get('/api/kyc/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await kycService.getKycStatus(req.user!.id);
      res.json(result);
    } catch (error: any) {
      console.error('KYC status error:', error);
      res.status(500).json({ message: 'Failed to get KYC status' });
    }
  });

  // CATEGORY ROUTES
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Failed to get categories' });
    }
  });

  // LISTING ROUTES
  app.get('/api/listings', async (req, res) => {
    try {
      const {
        categoryId,
        location,
        minPrice,
        maxPrice,
        search,
        status = 'active',
        page = '1',
        limit = '12'
      } = req.query;

      const options = {
        categoryId: categoryId as string,
        location: location as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        search: search as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string)
      };

      const result = await storage.getListings(options);
      res.json(result);
    } catch (error: any) {
      console.error('Get listings error:', error);
      res.status(500).json({ message: 'Failed to get listings' });
    }
  });

  app.get('/api/listings/:id', async (req, res) => {
    try {
      const listing = await storage.getListingWithDetails(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Increment view count
      await storage.incrementListingViews(req.params.id);

      res.json(listing);
    } catch (error: any) {
      console.error('Get listing error:', error);
      res.status(500).json({ message: 'Failed to get listing' });
    }
  });

  app.post('/api/listings', authenticateToken, upload.array('images', 5), handleUploadError, async (req: AuthenticatedRequest, res) => {
    try {
      const listingData = insertListingSchema.parse({
        ...req.body,
        userId: req.user!.id,
        images: (req.files as Express.Multer.File[])?.map(file => `/uploads/${file.filename}`) || []
      });

      const listing = await storage.createListing(listingData);
      res.status(201).json(listing);
    } catch (error: any) {
      console.error('Create listing error:', error);
      res.status(400).json({ message: error.message || 'Failed to create listing' });
    }
  });

  app.put('/api/listings/:id', authenticateToken, upload.array('images', 5), handleUploadError, async (req: AuthenticatedRequest, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Check ownership or admin role
      if (listing.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this listing' });
      }

      const updateData = {
        ...req.body,
        images: (req.files as Express.Multer.File[])?.map(file => `/uploads/${file.filename}`) || listing.images
      };

      const updatedListing = await storage.updateListing(req.params.id, updateData);
      res.json(updatedListing);
    } catch (error: any) {
      console.error('Update listing error:', error);
      res.status(400).json({ message: error.message || 'Failed to update listing' });
    }
  });

  app.delete('/api/listings/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const listing = await storage.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Check ownership or admin role
      if (listing.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this listing' });
      }

      await storage.deleteListing(req.params.id);
      res.json({ message: 'Listing deleted successfully' });
    } catch (error: any) {
      console.error('Delete listing error:', error);
      res.status(500).json({ message: 'Failed to delete listing' });
    }
  });

  // User's listings
  app.get('/api/my-listings', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const listings = await storage.getUserListings(req.user!.id);
      res.json(listings);
    } catch (error: any) {
      console.error('Get user listings error:', error);
      res.status(500).json({ message: 'Failed to get your listings' });
    }
  });

  // CHAT ROUTES
  app.get('/api/chats', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const chats = await storage.getChats(req.user!.id);
      res.json(chats);
    } catch (error: any) {
      console.error('Get chats error:', error);
      res.status(500).json({ message: 'Failed to get chats' });
    }
  });

  app.post('/api/chats', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { sellerId, listingId } = req.body;
      
      // Check if chat already exists
      const existingChat = await storage.getChatByParticipants(
        req.user!.id,
        sellerId,
        listingId
      );
      
      if (existingChat) {
        return res.json(existingChat);
      }

      const chat = await storage.createChat({
        buyerId: req.user!.id,
        sellerId,
        listingId
      });

      res.status(201).json(chat);
    } catch (error: any) {
      console.error('Create chat error:', error);
      res.status(400).json({ message: error.message || 'Failed to create chat' });
    }
  });

  app.get('/api/chats/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const chat = await storage.getChat(req.params.id);
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is participant
      if (chat.buyerId !== req.user!.id && chat.sellerId !== req.user!.id) {
        return res.status(403).json({ message: 'Not authorized to view this chat' });
      }

      const messages = await storage.getChatMessages(req.params.id);
      res.json(messages);
    } catch (error: any) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  // SAVED ITEMS ROUTES
  app.get('/api/saved-items', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const savedItems = await storage.getSavedItems(req.user!.id);
      res.json(savedItems);
    } catch (error: any) {
      console.error('Get saved items error:', error);
      res.status(500).json({ message: 'Failed to get saved items' });
    }
  });

  app.post('/api/saved-items', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { listingId } = req.body;
      const savedItem = await storage.createSavedItem({
        userId: req.user!.id,
        listingId
      });
      res.status(201).json(savedItem);
    } catch (error: any) {
      console.error('Save item error:', error);
      res.status(400).json({ message: error.message || 'Failed to save item' });
    }
  });

  app.delete('/api/saved-items/:listingId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteSavedItem(req.user!.id, req.params.listingId);
      res.json({ message: 'Item removed from saved items' });
    } catch (error: any) {
      console.error('Remove saved item error:', error);
      res.status(500).json({ message: 'Failed to remove saved item' });
    }
  });

  // REPORTS ROUTES
  app.post('/api/reports', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: req.user!.id
      });

      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error: any) {
      console.error('Create report error:', error);
      res.status(400).json({ message: error.message || 'Failed to create report' });
    }
  });

  // ADMIN ROUTES
  app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Get admin user stats error:', error);
      res.status(500).json({ message: 'Failed to get user statistics' });
    }
  });

  app.get('/api/admin/listings', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getListingStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Get admin listing stats error:', error);
      res.status(500).json({ message: 'Failed to get listing statistics' });
    }
  });

  app.get('/api/admin/reports', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error: any) {
      console.error('Get reports error:', error);
      res.status(500).json({ message: 'Failed to get reports' });
    }
  });

  app.put('/api/admin/reports/:id', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const report = await storage.updateReport(req.params.id, status);
      res.json(report);
    } catch (error: any) {
      console.error('Update report error:', error);
      res.status(400).json({ message: error.message || 'Failed to update report' });
    }
  });

  app.put('/api/admin/kyc/:userId/approve', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const result = await kycService.approveKycManually(req.params.userId, req.user!.id);
      res.json(result);
    } catch (error: any) {
      console.error('Approve KYC error:', error);
      res.status(400).json({ message: error.message || 'Failed to approve KYC' });
    }
  });

  app.put('/api/admin/kyc/:userId/reject', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res) => {
    try {
      const { reason } = req.body;
      const result = await kycService.rejectKycManually(req.params.userId, req.user!.id, reason);
      res.json(result);
    } catch (error: any) {
      console.error('Reject KYC error:', error);
      res.status(400).json({ message: error.message || 'Failed to reject KYC' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  interface ChatConnection {
    userId: string;
    ws: WebSocket;
  }

  const connections: Map<string, ChatConnection> = new Map();

  wss.on('connection', (ws: WebSocket, req) => {
    let userId: string | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth') {
          // Authenticate WebSocket connection
          const payload = verifyRefreshToken(message.token);
          if (payload) {
            userId = payload.userId;
            connections.set(userId, { userId, ws });
            ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
          } else {
            ws.send(JSON.stringify({ type: 'auth', status: 'failed' }));
            ws.close();
          }
        }
        
        if (message.type === 'chat_message' && userId) {
          // Handle new chat message
          const { chatId, content } = message;
          
          // Verify user is participant in chat
          const chat = await storage.getChat(chatId);
          if (chat && (chat.buyerId === userId || chat.sellerId === userId)) {
            // Store message
            const newMessage = await storage.createMessage({
              chatId,
              senderId: userId,
              message: content
            });
            
            // Update chat last message timestamp
            await storage.updateChatLastMessage(chatId);
            
            // Send to other participant
            const otherUserId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;
            const otherConnection = connections.get(otherUserId);
            
            if (otherConnection && otherConnection.ws.readyState === WebSocket.OPEN) {
              otherConnection.ws.send(JSON.stringify({
                type: 'new_message',
                message: newMessage,
                chatId
              }));
            }
            
            // Confirm to sender
            ws.send(JSON.stringify({
              type: 'message_sent',
              message: newMessage
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        connections.delete(userId);
      }
    });
  });

  return httpServer;
}
