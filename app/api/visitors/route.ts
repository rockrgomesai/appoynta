// app/api/visitors/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { authorize } from '@/lib/permissions';
import { visitors } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// Zod schema for GET query parameters
const getVisitorsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).default('1'), // Ensure page is a number
  pageSize: z.string().regex(/^\d+$/).transform(Number).default('10'), // Ensure pageSize is a number
});

// Zod schema for POST body
const createVisitorSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  email: z.union([
    z.literal("").nullable(),                 // allow empty
    z.string().email("Invalid email")
  ]).nullable().optional(), 
  phone:    z.string().min(11, 'Phone is required'),
  whatsapp: z.enum(['Yes', 'No']).default('No'),
  gender:   z.enum(['Male', 'Female', 'Other']),
  company:  z.string().optional(),
  nid:      z.union([z.string().max(255), z.literal(''), z.null()]).optional(), // allow empty/null
  image_pp:  z.string().optional(),
  note:     z.string().optional(),
  status:   z.enum(['Active', 'Inactive']).default('Active'),
});

export async function GET(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'view:visitors');

  // Parse and validate query parameters
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  const { search, status, page, pageSize } = getVisitorsSchema.parse(queryParams);

  // Build the where condition dynamically
  const where: any[] = [];
  if (search) {
    where.push(
      sql`(${visitors.name} ILIKE ${'%' + search + '%'} OR ${visitors.phone} ILIKE ${'%' + search + '%'})`
    );
  }
  if (status) {
    where.push(sql`${visitors.status} = ${status}`);
  }

  // Combine all conditions with AND, or use TRUE if no conditions are provided
  const whereCondition = where.length > 0 ? sql.join(where, sql` AND `) : sql`TRUE`;

  const [data, total] = await Promise.all([
    db.select()
      .from(visitors)
      .where(whereCondition)
      .orderBy(sql`${visitors.id} DESC`)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql`COUNT(${visitors.id})` })
      .from(visitors)
      .where(whereCondition)
      .then((r) => Number(r[0].count)),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: Request) {
  const user = await authenticate(req);
  await authorize(user, 'create:visitors');

  // Parse and validate request body
  const body = await req.json();
  const { name, email, phone, whatsapp, gender, company, nid, image_pp, note, status } = createVisitorSchema.parse(body);

  // Enforce: if nid is non-empty/non-null, it must be unique
  if (nid && nid.trim() !== '') {
    const existing = await db.select().from(visitors).where(sql`${visitors.nid} = ${nid}`).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'NID must be unique if provided.' }, { status: 409 });
    }
  }

  const [newVisitor] = await db.insert(visitors)
    .values({ 
      name,
      email,
      phone,
      whatsapp,
      gender,
      company,
      nid: nid && nid.trim() !== '' ? nid : null,
      image_pp: image_pp,
      note,
      status,
    })
    .returning();

  return NextResponse.json(newVisitor, { status: 201 });
}