import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, users, departments, designations, attendance_logs } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  // Appointments Analytics
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0, 10);

  const [
    totalAppointments,
    upcomingAppointments,
    appointmentsByType,
    appointmentsByStatus,
    recentAppointments,
    appointmentsByDepartment,
    appointmentsByDesignation,
    // Attendance
    todayCheckins,
    todayCheckouts,
    currentOnsite,
    attendanceByAppointment,
    frequentVisitors
  ] = await Promise.all([
    db.select({ count: sql`COUNT(*)` }).from(appointments),
    db.select({ count: sql`COUNT(*)` }).from(appointments).where(sql`start_date >= ${todayStr}`),
    db.select({ type: appointments.appointment_type, count: sql`COUNT(*)` })
      .from(appointments)
      .groupBy(appointments.appointment_type),
    db.select({ status: appointments.status, count: sql`COUNT(*)` })
      .from(appointments)
      .groupBy(appointments.status),
    db.select().from(appointments).orderBy(sql`created_at DESC`).limit(5),
    db.select({ department: departments.department, count: sql`COUNT(*)` })
      .from(appointments)
      .leftJoin(users, sql`appointments.id = users.id`)
      .leftJoin(departments, sql`users.department_id = departments.id`)
      .groupBy(departments.department),
    db.select({ designation: designations.designation, count: sql`COUNT(*)` })
      .from(appointments)
      .leftJoin(users, sql`appointments.id = users.id`)
      .leftJoin(designations, sql`users.designation_id = designations.id`)
      .groupBy(designations.designation),
    // Attendance
    db.select({ count: sql`COUNT(*)` }).from(attendance_logs).where(sql`DATE(check_in_time) = ${todayStr}`),
    db.select({ count: sql`COUNT(*)` }).from(attendance_logs).where(sql`DATE(check_out_time) = ${todayStr}`),
    db.select({ count: sql`COUNT(*)` }).from(attendance_logs).where(sql`check_in_time IS NOT NULL AND check_out_time IS NULL`),
    db.select({ appointment_id: attendance_logs.appointment_id, count: sql`COUNT(*)` })
      .from(attendance_logs)
      .groupBy(attendance_logs.appointment_id),
    db.select({ visitor_id: attendance_logs.visitor_id, count: sql`COUNT(*)` })
      .from(attendance_logs)
      .groupBy(attendance_logs.visitor_id)
      .orderBy(sql`count DESC`)
      .limit(5),
  ]);

  return NextResponse.json({
    appointments: {
      total: Number(totalAppointments[0].count),
      upcoming: Number(upcomingAppointments[0].count),
      byType: appointmentsByType.map((t: any) => ({ type: t.type, count: Number(t.count) })),
      byStatus: appointmentsByStatus.map((s: any) => ({ status: s.status, count: Number(s.count) })),
      recent: recentAppointments,
      byDepartment: appointmentsByDepartment.map((d: any) => ({ department: d.department, count: Number(d.count) })),
      byDesignation: appointmentsByDesignation.map((d: any) => ({ designation: d.designation, count: Number(d.count) })),
    },
    attendance: {
      todayCheckins: Number(todayCheckins[0].count),
      todayCheckouts: Number(todayCheckouts[0].count),
      currentOnsite: Number(currentOnsite[0].count),
      byAppointment: attendanceByAppointment.map((a: any) => ({ appointment_id: a.appointment_id, count: Number(a.count) })),
      frequentVisitors: frequentVisitors.map((v: any) => ({ visitor_id: v.visitor_id, count: Number(v.count) })),
    },
  });
}
