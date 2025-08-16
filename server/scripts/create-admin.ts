import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env (.env.local preferred, fallback to .env)
try {
  const rootDir = path.resolve(import.meta.dirname, '..');
  const localEnv = path.join(rootDir, '.env.local');
  const defaultEnv = path.join(rootDir, '.env');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else if (fs.existsSync(defaultEnv)) {
    dotenv.config({ path: defaultEnv });
  }
} catch {}

async function createAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

  try {
    // Check if admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, adminUsername)
    });

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    if (existingAdmin) {
      // Update existing admin to ensure correct credentials and role
      await db.update(users)
        .set({
          password: hashedPassword,
          email: adminEmail,
          role: 'admin',
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.username, adminUsername));
      console.log('Admin user updated successfully');
    } else {
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
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
