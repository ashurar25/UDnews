import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function createAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // In production, use environment variables
  const adminEmail = 'admin@example.com';

  try {
    // Check if admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, adminUsername)
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    await db.insert(users).values({
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
