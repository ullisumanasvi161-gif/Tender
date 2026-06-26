import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard analytics and audit logs
// @route   GET /api/analytics
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    // 1. Fetch all checklists
    const { data: checklists, error: clErr } = await supabase
      .from('checklists')
      .select('id, project_type, tender_category, rating, technical_section, commercial_section, financial_section, compliance_section');

    if (clErr) throw clErr;

    // 2. Fetch all users (excluding passwords)
    const { data: users, error: usrErr } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (usrErr) throw usrErr;

    // 3. Fetch audit logs (last 50)
    const { data: auditLogs, error: logErr } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (logErr) throw logErr;

    // 4. Aggregate stats in JS
    const totalChecklists = checklists.length;
    const totalUsers = users.length;

    // Average rating
    const rated = (checklists || []).filter(c => c.rating > 0);
    const averageRating = rated.length > 0
      ? (rated.reduce((acc, c) => acc + Number(c.rating), 0) / rated.length).toFixed(1)
      : 'N/A';

    // Project types distribution
    const typesMap = {};
    (checklists || []).forEach(c => {
      typesMap[c.project_type] = (typesMap[c.project_type] || 0) + 1;
    });
    const projectTypes = Object.entries(typesMap).map(([name, value]) => ({ name, value }));

    // Tender categories distribution
    const catMap = {};
    (checklists || []).forEach(c => {
      catMap[c.tender_category] = (catMap[c.tender_category] || 0) + 1;
    });
    const tenderCategories = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    // Completion rate
    let totalItems = 0;
    let completedItems = 0;
    (checklists || []).forEach(c => {
      const sections = [
        c.technical_section,
        c.commercial_section,
        c.financial_section,
        c.compliance_section,
      ];
      sections.forEach(sec => {
        if (!sec) return;
        sec.forEach(item => {
          totalItems++;
          if (item.status === 'completed') completedItems++;
        });
      });
    });
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // AI usage stats
    const allAiLogs = (auditLogs || []).filter(l =>
      l.action === 'CHECKLIST_GENERATE' || l.action === 'CHECKLIST_REGENERATE'
    );
    const aiGenerations = allAiLogs.length;
    const aiUsage = {
      generations: aiGenerations,
      estimatedTokens: aiGenerations * 1250,
      costSaved: (aiGenerations * 0.025).toFixed(2),
    };

    return res.json({
      summary: {
        totalUsers,
        totalChecklists,
        averageRating,
        completionRate: `${completionRate}%`,
      },
      aiUsage,
      projectTypes,
      tenderCategories,
      auditLogs: (auditLogs || []).map(log => ({
        ...log,
        _id: log.id,
        userId: log.user_id,
        userName: log.user_name,
        userEmail: log.user_email,
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      })),
      users: (users || []).map(u => ({ ...u, _id: u.id })),
    });
  } catch (error) {
    console.error('Analytics calculation error:', error.message);
    res.status(500).json({ message: 'Failed to compile system analytics' });
  }
});

export default router;
