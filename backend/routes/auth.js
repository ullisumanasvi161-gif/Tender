import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'AVINASH_KANAPARTHI_GOLDEN_SECRET_2026';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// Helper to create an audit log entry
const createAuditLog = async (data) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: data.userId || null,
      user_name: data.userName || 'Anonymous',
      user_email: data.userEmail || 'N/A',
      action: data.action,
      details: data.details,
      ip_address: data.ipAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('[AUTH] Audit log write failed:', err.message);
  }
};

// @desc    Register a new user (DISABLED)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  return res.status(403).json({ message: 'Registration is disabled for security compliance.' });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Write audit log
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'USER_LOGIN',
      details: `User logged in successfully`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  // User is already attached in protect middleware
  res.json(req.user);
});

export default router;
