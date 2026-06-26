import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user theme setting
// @route   GET /api/theme
// @access  Private
router.get('/', protect, async (req, res) => {
  return res.json({ selected_theme: 'Light' });
});

// @desc    Save user theme setting
// @route   POST /api/theme
// @access  Private
router.post('/', protect, async (req, res) => {
  return res.json({ selected_theme: 'Light' });
});

export default router;
