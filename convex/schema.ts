
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(), // Pour la démo, en production on utilise Clerk/Auth0
    role: v.union(v.literal("user"), v.literal("super_admin"), v.literal("agency_admin"), v.literal("station_manager")),
    avatar: v.optional(v.string()),
    agencyId: v.optional(v.id("agencies")),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  agencies: defineTable({
    name: v.string(),
    email: v.string(),
    logo: v.string(),
    color: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    revenue: v.number(),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  cities: defineTable({
    name: v.string(),
    region: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  bookings: defineTable({
    userId: v.id("users"),
    passengerName: v.string(),
    agencyName: v.string(),
    totalPrice: v.number(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
