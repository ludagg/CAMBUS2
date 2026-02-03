
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- QUERIES ---

export const getAllAgencies = query({
  handler: async (ctx) => {
    return await ctx.db.query("agencies").order("desc").collect();
  },
});

export const getAllCities = query({
  handler: async (ctx) => {
    return await ctx.db.query("cities").order("asc").collect();
  },
});

export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});

export const getLatestBookings = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db.query("bookings").order("desc").take(args.limit);
  },
});

// --- MUTATIONS ---

export const createAgency = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    color: v.string(),
    logo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agencies", {
      ...args,
      status: "active",
      revenue: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateAgencyStatus = mutation({
  args: { id: v.id("agencies"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status as "active" | "inactive" });
  },
});

export const deleteAgency = mutation({
  args: { id: v.id("agencies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createCity = mutation({
  args: { name: v.string(), region: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cities", {
      name: args.name,
      region: args.region,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const deleteCity = mutation({
  args: { id: v.id("cities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateUserRole = mutation({
  args: { id: v.id("users"), role: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { role: args.role as any });
  },
});
