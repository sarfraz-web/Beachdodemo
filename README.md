# Beachdo - Marketplace Platform

A comprehensive marketplace platform that connects buyers and sellers in local communities with secure user verification, real-time communication, and robust admin operations.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js + Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with refresh mechanism
- **Real-time**: WebSocket for chat functionality
- **File Upload**: Multer for image handling

### Project Structure
```
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Shadcn UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── layout/        # Layout components (navbar, footer)
│   │   │   ├── products/      # Product-related components
│   │   │   ├── chat/          # Chat system components
│   │   │   └── admin/         # Admin panel components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions and configurations
│   │   └── App.tsx            # Main application component
│   └── index.html
├── server/                     # Backend Express application
│   ├── middleware/            # Express middleware functions
│   ├── services/              # Business logic services
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API route definitions
│   ├── storage.ts             # Database operations interface
│   ├── db.ts                  # Database connection setup
│   └── vite.ts                # Vite development server integration
├── shared/                     # Shared types and schemas
│   └── schema.ts              # Drizzle database schema
├── uploads/                    # File upload directory
└── package.json               # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon serverless recommended)

### Installation & Setup
```bash
# Clone the repository
git clone <repository-url>
cd beachdo

# Install dependencies
npm install

# Set up environment variables
# DATABASE_URL will be automatically configured in Replit

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔐 Authentication System

### Test Accounts
**Buyer Account:**
- Email: `test@example.com`
- Password: `password123`
- Role: Buyer

**Seller Account:**
- Email: `admin@example.com`
- Password: `admin123`
- Role: Seller

### Authentication Flow
1. **Registration**: Users register with email, phone, password, and role selection
2. **Login**: Email/phone + password authentication
3. **JWT Tokens**: Access tokens (15min) + refresh tokens (7 days)
4. **Auto-refresh**: Automatic token renewal on API requests
5. **KYC Integration**: Ready for DigiLocker integration (currently simulated)

## 📊 Database Schema

### Core Tables
- **users**: User profiles, authentication, KYC status
- **categories**: Product categories for marketplace organization
- **listings**: Product listings with images, pricing, and status
- **chats**: Chat conversations between users
- **messages**: Individual chat messages with timestamps
- **saved_items**: User wishlists and saved products
- **reports**: User reporting system for content moderation
- **auth_tokens**: Refresh token management

### Key Relationships
- Users can create multiple listings (seller role)
- Users can participate in multiple chats
- Listings belong to categories and users
- Messages belong to chats and users
- Reports can reference users or listings

## 🎯 Core Features

### 1. User Management
- **Registration & Login**: Email/phone-based authentication
- **KYC Verification**: DigiLocker integration (simulated)
- **Role Management**: Buyer, Seller, Admin roles
- **Profile Management**: User profiles with verification status

### 2. Product Marketplace
- **Product Listings**: Create, edit, delete product listings
- **Image Upload**: Multiple image support (5 images, 5MB each)
- **Categories**: Organized product categorization
- **Search & Filter**: Advanced filtering by category, price, location
- **Boosted Listings**: Premium listing visibility (planned)

### 3. Communication System
- **Real-time Chat**: WebSocket-based messaging
- **Chat Management**: Create, manage, and archive conversations
- **Message History**: Persistent chat history
- **Online Status**: Real-time user presence indicators

### 4. Admin Operations
- **User Management**: View, moderate, and manage user accounts
- **Content Moderation**: Review and manage reported content
- **Analytics Dashboard**: User statistics and platform metrics
- **Listing Approval**: Review and approve/reject listings

### 5. Security Features
- **Rate Limiting**: API endpoint protection (1000 requests/15min)
- **Input Validation**: Comprehensive request validation with Zod
- **File Upload Security**: Type and size restrictions
- **CORS Protection**: Properly configured cross-origin requests
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Token refresh
GET  /api/auth/me           # Current user info
```

### User Management
```
GET    /api/users           # List users (admin)
GET    /api/users/:id       # Get user details
PUT    /api/users/:id       # Update user profile
DELETE /api/users/:id       # Delete user (admin)
```

### KYC Verification
```
POST /api/kyc/submit        # Submit KYC documents
GET  /api/kyc/status        # Get KYC status
```

### Product Listings
```
GET    /api/listings        # List products with filters
GET    /api/listings/:id    # Get product details
POST   /api/listings        # Create new listing
PUT    /api/listings/:id    # Update listing
DELETE /api/listings/:id    # Delete listing
```

### Categories
```
GET  /api/categories        # List all categories
POST /api/categories        # Create category (admin)
PUT  /api/categories/:id    # Update category (admin)
```

### Chat System
```
GET    /api/chats           # List user's chats
POST   /api/chats           # Create new chat
GET    /api/chats/:id       # Get chat details
POST   /api/chats/:id/messages  # Send message
GET    /api/chats/:id/messages  # Get messages
```

### Reports & Moderation
```
POST /api/reports           # Submit report
GET  /api/reports           # List reports (admin)
PUT  /api/reports/:id       # Update report status
```

## 🎨 Frontend Components

### Pages
- **Landing**: Marketing page for non-authenticated users
- **Home**: Dashboard for authenticated users
- **Products**: Product listing and search page
- **Product Detail**: Individual product view
- **Dashboard**: User dashboard with listings and activities
- **Chat**: Real-time messaging interface
- **Admin**: Administrative panel for user and content management

### Key Components
- **AuthModal**: Login/registration modal
- **Navbar**: Main navigation with user menu
- **ProductCard**: Product display component
- **ProductForm**: Product creation/editing form
- **ChatWidget**: Real-time chat interface
- **UserManagement**: Admin user management interface

## 🔧 Development Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run db:push     # Push schema changes to database
npm run db:generate # Generate migration files
npm run db:studio   # Open database studio
```

## 🌍 Environment Variables

```bash
DATABASE_URL=postgresql://...     # PostgreSQL connection string
NODE_ENV=development             # Environment mode
PORT=5000                       # Server port (optional)
```

## 🔒 Security Considerations

### Implemented Security Measures
1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: Bcrypt with salt rounds of 12
3. **Rate Limiting**: Prevents API abuse and brute force attacks
4. **Input Validation**: All inputs validated with Zod schemas
5. **File Upload Security**: Type and size restrictions
6. **CORS Configuration**: Properly configured cross-origin requests
7. **SQL Injection Prevention**: Parameterized queries via ORM

### Security Best Practices
- Never store passwords in plain text
- Always validate user inputs
- Use HTTPS in production
- Implement proper session management
- Regular security audits and updates
- Monitor for suspicious activities

## 📱 Features Roadmap

### Phase 1 (Current)
- ✅ User registration and authentication
- ✅ Product listings and categories
- ✅ Real-time chat system
- ✅ Basic admin operations
- ✅ File upload handling

### Phase 2 (Planned)
- 🔄 DigiLocker KYC integration
- 🔄 Payment gateway integration
- 🔄 Advanced search and recommendations
- 🔄 Mobile app development
- 🔄 Advanced analytics dashboard

### Phase 3 (Future)
- 📋 Social features (forums, reviews)
- 📋 Delivery and logistics integration
- 📋 Multi-language support
- 📋 Advanced reporting and moderation tools
- 📋 Third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write descriptive commit messages
- Add comments for complex logic
- Ensure all tests pass before submitting

## 📞 Support

For technical support or questions:
- Check the documentation in this README
- Review the code comments and type definitions
- Test with the provided test credentials
- Check the browser console and server logs for errors

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

