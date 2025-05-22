// lib/permissions.ts
import { NextResponse } from 'next/server';

interface UserSession {
  id: number;
  username: string;
  role_id: number;
  permissions: string[];
}

export async function authorize(user: UserSession, permission: string) {
  if (!user.permissions.includes(permission)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
}
