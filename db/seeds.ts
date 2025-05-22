// db/seeds.ts
import 'dotenv/config';
import { db } from '@/lib/db';
import {
  roles,
  permissions,
  rolePermissions,
  users,
  departments,
  designations,
  visitors,
  appointments,
  appointmentDetails,
  attendanceLogs,
  auditLogs,
} from './schema';
import { hashPassword } from '@/lib/security';

async function seedUsers() {
  const roles = [1, 2, 3, 4, 5]; // Example role IDs
  const statuses = ['Active', 'Inactive'];

  // 6. Users
  const passwords = await Promise.all(
    ['password1','password2','password3','password4','password5']
      .map(p => hashPassword(p))
  );
  const createdUsers = await db.insert(users)
    .values([
      { first_name: 'Alice', username: 'alice', last_name: 'Wonderland', email: 'alice@example.com', telephone: '1234567890', password: passwords[0], role_id: 1, status: 'Active' },
      { first_name: 'Bob', username: 'bob', last_name: 'Wonderland', email: 'bob@example.com', telephone: '2345678901', password: passwords[1], role_id: 2, status: 'Active' },
      { first_name: 'Carol', username: 'carol', last_name: 'Wonderland', email: 'carol@example.com', telephone: '3456789012', password: passwords[2], role_id: 3, status: 'Active' },
      { first_name: 'Dave', username: 'dave', last_name: 'Wonderland', email: 'dave@example.com', telephone: '4567890123', password: passwords[3], role_id: 4, status: 'Inactive' },
      { first_name: 'Eve', username: 'eve', last_name: 'Wonderland', email: 'eve@example.com', telephone: '5678901234', password: passwords[4], role_id: 5, status: 'Active' },
    ])
    .returning();

  console.log('Seeded 5 users successfully!');
}

seedUsers().catch((error) => {
  console.error('Error seeding users:', error);
});