// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

// Logout - client should discard token
export async function POST() {
  // Optionally clear cookie if using httpOnly tokens
  return NextResponse.json({ success: true });
}