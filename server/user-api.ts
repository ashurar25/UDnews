import { Router } from 'express';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { authenticateToken } from './middleware/auth';
import bcrypt from 'bcrypt';
import { users } from '@shared/schema';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// Get all users
router.get('/', async (req, res) => {
  try {
    const rows = await db.select().from(users);
    // Note: current users table has only id, username, password
    // Do not return passwords
    const safe = rows.map(u => ({ id: u.id, username: u.username }));
    res.json(safe);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const inserted = await db
      .insert(users)
      .values({ username, password: hashedPassword })
      .returning();

    const created = inserted[0];
    res.status(201).json({ id: created.id, username: created.username });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body as { username?: string };

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const updated = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, Number(id)))
      .returning();

    if (!updated[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ id: updated[0].id, username: updated[0].username });
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