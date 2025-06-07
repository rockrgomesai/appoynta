// lib/permissions.ts
import { NextResponse } from 'next/server';
import { redis } from "./redis";
import { db } from "@/lib/db"; // adjust import to your DB setup
import { rolePermissions, permissions } from "@/db/schema"; // adjust path to your schema
import { eq } from 'drizzle-orm';

interface UserSession {
  id: number;
  username: string;
  role_id: number;
  permissions?: string[];
}

// Helper to get permissions for a role, with Redis caching
export async function getPermissionsForRole(role_id: number): Promise<string[]> {
  const cacheKey = `role_permissions:${role_id}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("Redis cache hit for", cacheKey, cached);
      return JSON.parse(cached);
    }
    console.log("Redis cache miss for", cacheKey);
    // Fetch from DB using Drizzle ORM
    const rows = await db.select({
      permission: permissions.name
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.role_id,role_id));

    const perms = rows.map((row: any) => row.permission);
    await redis.set(cacheKey, JSON.stringify(perms), "EX", 3600); // cache for 1 hour
    return perms;
  } catch (err) {
    console.error("Redis error:", err);
    // fallback to DB
    // Fetch from DB using Drizzle ORM
    const rows = await db.select({
      permission: permissions.name
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.role_id,role_id));

    const perms = rows.map((row: any) => row.permission);
    return perms;
  }
}

export async function authorize(user: UserSession, permission: string) {
  const permissions = user.permissions ?? (await getPermissionsForRole(user.role_id));
  if (!permissions.includes(permission)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
}
