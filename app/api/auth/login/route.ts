// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, roles } from '@/db/schema';
import { z } from 'zod';
import * as jwt from 'jsonwebtoken';
import { verifyPassword } from '@/lib/security';
import { eq, sql } from 'drizzle-orm';
import 'dotenv/config';

// Zod schema for login
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  const { username, password } = loginSchema.parse(await req.json());

  // Find user and join with roles table to get role_name
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      telephone: users.telephone,
      status: users.status,
      role_id: users.role_id,
      role_name: roles.name, // Include role_name
      password: users.password, // Include password for verification
    })
    .from(users)
    .leftJoin(roles, sql`${users.role_id} = ${roles.id}`) // Join with roles table
    .where(eq(users.username, username));

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Check if the user is inactive
  if (user.status === "Inactive") {
    return NextResponse.json(
      { error: "Your account is inactive. Please contact support." },
      { status: 403 }
    );
  }

  // Verify password
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Generate JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }
  const expiresIn = Number(process.env.JWT_EXPIRES) || 60 * 60 * 8; // Default to 8 hours
  const payload = { userId: user.id, username: user.username, role: user.role_name }; // Include role_name in the payload
  const token = jwt.sign(payload, secret, { expiresIn });

  // Respond with token and user information
  const { password: _, ...userWithoutPassword } = user; // Exclude password from the response
  return NextResponse.json({
    token,
    user: userWithoutPassword, // Return full user information without the password
  });
}

export async function GET(req: Request) {
  try {
    const data = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        username: users.username,
        telephone: users.telephone,
        status: users.status,
        role_id: users.role_id,
        role_name: roles.name, // Include role_name
      })
      .from(users)
      .leftJoin(roles, sql`${users.role_id} = ${roles.id}`); // Join with roles table

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
    });
  }
}
