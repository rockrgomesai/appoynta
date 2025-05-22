import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Assuming you have a database instance here
import { visitors, appointments, appointment_guest } from '@/db/schema'; // Adjust based on your schema
import { eq, gte, and } from 'drizzle-orm';
import { parseISO, startOfDay, format } from 'date-fns';
import { authenticate } from '@/lib/auth'; // Import the authentication function

export async function GET(req: NextRequest) {
    try {
        // Authenticate the user
        const user = await authenticate(req);

        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Telephone is required' }, { status: 400 });
        }

        const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

        // Fetch visitor data
        const visitor = await db
            .select()
            .from(visitors)
            .where(eq(visitors.phone, phone))
            .limit(1);

        if (visitor.length === 0) {
            return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
        }

        const visitorId = visitor[0].id;

        // Fetch appointments data
        const appointmentsData = await db
            .select()
            .from(appointments)
            .innerJoin(appointment_guest, eq(appointments.id, appointment_guest.appointment_id))
            .where(
                and(eq(appointment_guest.visitor_id, visitorId), gte(appointments.end_date, today))
            );

        return NextResponse.json({
            visitor: visitor[0],
            appointments: appointmentsData,
        });
    } catch (error) {
        console.error('Error fetching visitor data:', error);
        return NextResponse.json({ error: 'Failed to fetch visitor data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate the user
        const user = await authenticate(req);

        // Add your POST logic here
        return NextResponse.json({ message: 'POST endpoint is not implemented yet' });
    } catch (error) {
        console.error('Error in POST request:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}