import { sql } from "drizzle-orm";
import { boolean, decimal, text } from "drizzle-orm/pg-core";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

/* ENUM */
export const providerEnum = pgEnum("provider", ["google", "facebook"]);

/* USERS */
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  isEmailValid: boolean("is_email_valid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* SESSION */
export const sessionTable = pgTable("session_table", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  valid: boolean("valid").default(true).notNull(),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* SUBSCRIPTION */
export const subscriptionTable = pgTable("subscription_table", {
  id: serial("id").primaryKey(),
  month: varchar("month", { length: 255 }),
  days: integer("days"),
  price: decimal("price", { precision: 10, scale: 2 }),
});

/* MEMBERSHIP */
export const membershipTable = pgTable("membership_table", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  month: varchar("month", { length: 255 }).notNull(),
  days: integer("days").notNull(),
  startDate: date("start_date"),
  expiryDate: date("expiry_date"),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* PERSONAL DETAILS */
export const personalDetailsTable = pgTable("personal_details_table", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 10 }).notNull(),
  address: varchar("address", { length: 1024 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  pinCode: varchar("pin_code", { length: 100 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* PAYMENT */
export const paymentTable = pgTable("payment_table", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  paymentId: varchar("stripe_id", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* OAUTH */
export const oauthAccountsTable = pgTable("oauth_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  provider: providerEnum("provider").notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* CONTACT */
export const contactTable = pgTable("contact_table", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: varchar("message", { length: 1024 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* PASSWORD RESET */
export const passwordResetTokenTables = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at")
    .default(sql`CURRENT_TIMESTAMP + INTERVAL '1 hour'`)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
