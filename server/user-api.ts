import { Router } from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { authenticateToken } from './middleware/auth';
import bcrypt from 'bcrypt';

const router = Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// Get all users
router.get('/', async (req, res) => {
  try {
    // For now, return mock data since we don't have a users table yet
    // In production, you'd query from the actual users table
    const mockUsers = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@udnews.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01',
        lastLogin: '2024-12-19 10:30:00'
      },
      {
        id: '2',
        username: 'editor1',
        email: 'editor1@udnews.com',
        role: 'editor',
        status: 'active',
        createdAt: '2024-01-15',
        lastLogin: '2024-12-18 15:45:00'
      },
      {
        id: '3',
        username: 'user1',
        email: 'user1@udnews.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-02-01',
        lastLogin: '2024-12-17 09:15:00'
      }
    ];

    res.json(mockUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role, status } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // In production, you'd insert into the actual users table
    // For now, return the user data that would be created
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      role: role || 'user',
      status: status || 'active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: null
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, status } = req.body;

    // In production, you'd update the actual users table
    // For now, return success message
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      userId: id
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In production, you'd delete from the actual users table
    // For now, return success message
    res.json({ 
      success: true, 
      message: 'User deleted successfully',
      userId: id
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change user password
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // In production, you'd verify current password and update with new hashed password
    // For now, return success message
    res.json({ 
      success: true, 
      message: 'Password changed successfully',
      userId: id
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // In production, you'd query from the actual users table
    // For now, return mock user data
    const mockUser = {
      id,
      username: 'user',
      email: 'user@udnews.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-01-01',
      lastLogin: '2024-12-19 10:30:00'
    };

    res.json(mockUser);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router; 