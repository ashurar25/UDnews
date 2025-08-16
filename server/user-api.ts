import { Router } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { authenticateToken, authorizeRoles } from './middleware/auth';
import bcrypt from 'bcrypt';
import { users, userValidationSchema, UserRole } from '@shared/schema';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

const router = Router();

// Apply authentication and admin authorization middleware to all user routes
router.use(authenticateToken, authorizeRoles('admin'));

// Get all users
router.get('/', async (req, res) => {
  try {
    const rows = await db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        role: true,
        email: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)]
    });
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    // Validate input using the shared schema
    const validation = userValidationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      });
    }
    
    const { username, password, role, email, isActive } = validation.data;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check if username already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username)
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const inserted = await db
      .insert(users)
      .values({ 
        username, 
        password: hashedPassword,
        role: role as UserRole,
        email: email || null,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    const created = inserted[0];
    // Don't return password hash
    const { password: _, ...userWithoutPassword } = created;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate input using the shared schema, but make fields optional
    const validation = userValidationSchema.partial().safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      });
    }

    const updateData: {
      username?: string;
      role?: UserRole;
      email?: string | null;
      isActive?: boolean;
      password?: string;
      updatedAt?: Date;
    } = { 
      updatedAt: new Date() 
    };

    if (validation.data.username) updateData.username = validation.data.username;
    if (validation.data.role) updateData.role = validation.data.role as UserRole;
    if (validation.data.email !== undefined) updateData.email = validation.data.email || null;
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive;

    // Handle password update if provided
    if (validation.data.password) {
      updateData.password = await bcrypt.hash(validation.data.password, 10);
    }

    // Don't allow empty update
    if (Object.keys(updateData).length === 1) { // only updatedAt was set
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(id)))
      .returning();

    if (!updated[0]) return res.status(404).json({ error: 'User not found' });
    
    // Don't return password hash
    const { password: _, ...userWithoutPassword } = updated[0];
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.delete(users).where(eq(users.id, Number(id)));
    // drizzle returns CommandResult with rowCount in some drivers; use truthy check by trying to fetch affected row via returning not always available on delete
    // To be safe, respond 204 regardless if no error
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change user password
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const found = await db.select().from(users).where(eq(users.id, Number(id)));
    const user = found[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, Number(id)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db.select().from(users).where(eq(users.id, Number(id)));
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;