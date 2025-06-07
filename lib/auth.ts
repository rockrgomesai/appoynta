// lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users, roles, rolePermissions, permissions as permissionsTable } from '@/db/schema';
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// Define shape of JWT payload
interface JwtPayload {
  userId: number;
  iat: number;
  exp: number;
}

export async function authenticate(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }
    const payload = jwt.verify(token, secret) as JwtPayload;
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id,payload.userId));
    if (!user) {
      throw new Error('User not found');
    }

    // Fetch permissions for user's role
    const perms = await db
      .select({ name: permissionsTable.name })
      .from(rolePermissions)
      .innerJoin(permissionsTable, eq(permissionsTable.id,rolePermissions.permissionId))
      .where(eq(rolePermissions.role_id,user.role_id));

    // Fetch the role name for the user's role_id
    const [role] = await db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, user.role_id));

    const userObj = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role: role?.name || null,
      permissions: perms.map(p => p.name),
    };
    return userObj;
  } catch (err: any) {
    console.error('Authentication error:', err);
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
}

// Helper to get user from session cookie (for server components/pages)
export async function getSessionUser() {
  try {
    // Adjust the cookie name if needed
    const cookieStore = await cookies();
    const cookie = cookieStore.get("token");
    if (!cookie) throw new Error("No session token found");

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET environment variable");

    const payload = jwt.verify(cookie.value, secret) as { userId: number };

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) throw new Error("User not found");

    // Fetch permissions for user's role
    const perms = await db
      .select({ name: permissionsTable.name })
      .from(rolePermissions)
      .innerJoin(permissionsTable, eq(permissionsTable.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.role_id, user.role_id));

    // Fetch the role name for the user's role_id
    const [role] = await db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.id, user.role_id));

    return {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role: role?.name || null,
      permissions: perms.map(p => p.name),
    };
  } catch (err) {
    console.error("getSessionUser error:", err);
    return null;
  }
}
