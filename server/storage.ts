import {
  users,
  categories,
  listings,
  chats,
  messages,
  savedItems,
  reports,
  authTokens,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Listing,
  type InsertListing,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type SavedItem,
  type InsertSavedItem,
  type Report,
  type InsertReport,
  type AuthToken,
  type InsertAuthToken
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, gte, lte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Listing operations
  getListings(options?: {
    categoryId?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ listings: Listing[]; total: number }>;
  getListing(id: string): Promise<Listing | undefined>;
  getListingWithDetails(id: string): Promise<any>;
  getUserListings(userId: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<InsertListing>): Promise<Listing>;
  deleteListing(id: string): Promise<void>;
  incrementListingViews(id: string): Promise<void>;
  
  // Chat operations
  getChats(userId: string): Promise<Chat[]>;
  getChat(id: string): Promise<Chat | undefined>;
  getChatByParticipants(buyerId: string, sellerId: string, listingId: string): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChatLastMessage(chatId: string): Promise<void>;
  
  // Message operations
  getChatMessages(chatId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;
  
  // Saved items operations
  getSavedItems(userId: string): Promise<SavedItem[]>;
  createSavedItem(savedItem: InsertSavedItem): Promise<SavedItem>;
  deleteSavedItem(userId: string, listingId: string): Promise<void>;
  
  // Report operations
  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, status: string): Promise<Report>;
  
  // Auth token operations
  createAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  getAuthToken(refreshToken: string): Promise<AuthToken | undefined>;
  deleteAuthToken(refreshToken: string): Promise<void>;
  deleteUserTokens(userId: string): Promise<void>;
  
  // Admin operations
  getUserStats(): Promise<any>;
  getListingStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  // Listing operations
  async getListings(options: {
    categoryId?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ listings: Listing[]; total: number }> {
    let query = db.select().from(listings);
    let countQuery = db.select({ count: count() }).from(listings);

    const conditions = [];
    
    if (options.categoryId) {
      conditions.push(eq(listings.categoryId, options.categoryId));
    }
    
    if (options.location) {
      conditions.push(like(listings.location, `%${options.location}%`));
    }
    
    if (options.minPrice) {
      conditions.push(gte(listings.price, options.minPrice.toString()));
    }
    
    if (options.maxPrice) {
      conditions.push(lte(listings.price, options.maxPrice.toString()));
    }
    
    if (options.search) {
      conditions.push(like(listings.title, `%${options.search}%`));
    }
    
    if (options.status) {
      conditions.push(eq(listings.status, options.status as any));
    }

    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    query = query.orderBy(desc(listings.createdAt));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const [listingsResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    return {
      listings: listingsResult,
      total: countResult[0].count
    };
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getListingWithDetails(id: string): Promise<any> {
    const [result] = await db
      .select({
        listing: listings,
        user: users,
        category: categories
      })
      .from(listings)
      .leftJoin(users, eq(listings.userId, users.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .where(eq(listings.id, id));
    
    return result;
  }

  async getUserListings(userId: string): Promise<Listing[]> {
    return await db
      .select()
      .from(listings)
      .where(eq(listings.userId, userId))
      .orderBy(desc(listings.createdAt));
  }

  async createListing(listingData: InsertListing): Promise<Listing> {
    const [listing] = await db.insert(listings).values(listingData).returning();
    return listing;
  }

  async updateListing(id: string, listingData: Partial<InsertListing>): Promise<Listing> {
    const [listing] = await db
      .update(listings)
      .set({ ...listingData, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return listing;
  }

  async deleteListing(id: string): Promise<void> {
    await db.delete(listings).where(eq(listings.id, id));
  }

  async incrementListingViews(id: string): Promise<void> {
    await db
      .update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, id));
  }

  // Chat operations
  async getChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(
        sql`${chats.buyerId} = ${userId} OR ${chats.sellerId} = ${userId}`
      )
      .orderBy(desc(chats.lastMessageAt));
  }

  async getChat(id: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async getChatByParticipants(buyerId: string, sellerId: string, listingId: string): Promise<Chat | undefined> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.buyerId, buyerId),
          eq(chats.sellerId, sellerId),
          eq(chats.listingId, listingId)
        )
      );
    return chat;
  }

  async createChat(chatData: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats).values(chatData).returning();
    return chat;
  }

  async updateChatLastMessage(chatId: string): Promise<void> {
    await db
      .update(chats)
      .set({ lastMessageAt: new Date() })
      .where(eq(chats.id, chatId));
  }

  // Message operations
  async getChatMessages(chatId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.senderId, userId)
        )
      );
  }

  // Saved items operations
  async getSavedItems(userId: string): Promise<SavedItem[]> {
    return await db
      .select()
      .from(savedItems)
      .where(eq(savedItems.userId, userId))
      .orderBy(desc(savedItems.createdAt));
  }

  async createSavedItem(savedItemData: InsertSavedItem): Promise<SavedItem> {
    const [savedItem] = await db.insert(savedItems).values(savedItemData).returning();
    return savedItem;
  }

  async deleteSavedItem(userId: string, listingId: string): Promise<void> {
    await db
      .delete(savedItems)
      .where(
        and(
          eq(savedItems.userId, userId),
          eq(savedItems.listingId, listingId)
        )
      );
  }

  // Report operations
  async getReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.createdAt));
  }

  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(reportData).returning();
    return report;
  }

  async updateReport(id: string, status: string): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  // Auth token operations
  async createAuthToken(tokenData: InsertAuthToken): Promise<AuthToken> {
    const [token] = await db.insert(authTokens).values(tokenData).returning();
    return token;
  }

  async getAuthToken(refreshToken: string): Promise<AuthToken | undefined> {
    const [token] = await db
      .select()
      .from(authTokens)
      .where(eq(authTokens.refreshToken, refreshToken));
    return token;
  }

  async deleteAuthToken(refreshToken: string): Promise<void> {
    await db.delete(authTokens).where(eq(authTokens.refreshToken, refreshToken));
  }

  async deleteUserTokens(userId: string): Promise<void> {
    await db.delete(authTokens).where(eq(authTokens.userId, userId));
  }

  // Admin operations
  async getUserStats(): Promise<any> {
    const [stats] = await db
      .select({
        totalUsers: count(),
        verifiedUsers: sql<number>`count(*) filter (where kyc_status = 'verified')`,
        pendingKyc: sql<number>`count(*) filter (where kyc_status = 'pending')`
      })
      .from(users);
    
    return stats;
  }

  async getListingStats(): Promise<any> {
    const [stats] = await db
      .select({
        totalListings: count(),
        activeListings: sql<number>`count(*) filter (where status = 'active')`,
        pendingApproval: sql<number>`count(*) filter (where status = 'pending_approval')`
      })
      .from(listings);
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
