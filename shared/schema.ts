import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text,
  varchar, 
  serial,
  timestamp, 
  integer, 
  decimal, 
  boolean, 
  jsonb,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";




// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'seller', 'buyer']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'verified', 'rejected']);
export const listingStatusEnum = pgEnum('listing_status', ['active', 'inactive', 'sold', 'pending_approval']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'resolved', 'dismissed']);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone").unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: userRoleEnum("role").default('buyer').notNull(),
  kycStatus: kycStatusEnum("kyc_status").default('pending').notNull(),
  kycData: jsonb("kyc_data"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Listings table
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  location: varchar("location").notNull(),
  images: jsonb("images").default([]).notNull(),
  status: listingStatusEnum("status").default('pending_approval').notNull(),
  isBoosted: boolean("is_boosted").default(false).notNull(),
  boostedUntil: timestamp("boosted_until"),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Chats table
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: 'cascade' }),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Saved items (wishlist)
export const savedItems = pgTable("saved_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Reports table
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetType: varchar("target_type").notNull(), // 'user' or 'listing'
  targetId: varchar("target_id").notNull(),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: reportStatusEnum("status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Auth tokens table for JWT refresh tokens
export const authTokens = pgTable("auth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  buyerChats: many(chats, { relationName: 'buyer' }),
  sellerChats: many(chats, { relationName: 'seller' }),
  messages: many(messages),
  savedItems: many(savedItems),
  reports: many(reports),
  authTokens: many(authTokens)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  listings: many(listings)
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(users, {
    fields: [listings.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id]
  }),
  chats: many(chats),
  savedItems: many(savedItems)
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  buyer: one(users, {
    fields: [chats.buyerId],
    references: [users.id],
    relationName: 'buyer'
  }),
  seller: one(users, {
    fields: [chats.sellerId],
    references: [users.id],
    relationName: 'seller'
  }),
  listing: one(listings, {
    fields: [chats.listingId],
    references: [listings.id]
  }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  })
}));

export const savedItemsRelations = relations(savedItems, ({ one }) => ({
  user: one(users, {
    fields: [savedItems.userId],
    references: [users.id]
  }),
  listing: one(listings, {
    fields: [savedItems.listingId],
    references: [listings.id]
  })
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id]
  })
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, {
    fields: [authTokens.userId],
    references: [users.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

export const insertSavedItemSchema = createInsertSchema(savedItems).omit({
  id: true,
  createdAt: true
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type SavedItem = typeof savedItems.$inferSelect;
export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
