import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';
import { generateChecklist } from '../services/openai.js';

const router = express.Router();

// Helper to recalculate compliance score and readiness level
const recalculateCompliance = (checklist) => {
  const sections = [
    checklist.technical_section || checklist.technicalSection,
    checklist.commercial_section || checklist.commercialSection,
    checklist.financial_section || checklist.financialSection,
    checklist.compliance_section || checklist.complianceSection,
  ];

  let totalItems = 0;
  let completedItems = 0;
  let totalMandatory = 0;
  let completedMandatory = 0;

  sections.forEach(section => {
    if (!section) return;
    section.forEach(item => {
      totalItems++;
      if (item.status === 'completed') completedItems++;
      if (item.mandatory) {
        totalMandatory++;
        if (item.status === 'completed') completedMandatory++;
      }
    });
  });

  if (totalItems === 0) return { score: 0, readiness: 'Low', alerts: [] };

  const score = Math.round((completedItems / totalItems) * 100);
  const mandatoryCompletionRate = totalMandatory > 0 ? (completedMandatory / totalMandatory) : 1;

  let readiness = 'Low';
  if (mandatoryCompletionRate === 1 && score >= 90) {
    readiness = 'High';
  } else if (mandatoryCompletionRate >= 0.6 || score >= 50) {
    readiness = 'Medium';
  }

  const missingAlerts = [];
  sections.forEach((section, sIdx) => {
    const sectionName = ['Technical', 'Commercial', 'Financial', 'Compliance'][sIdx];
    if (!section) return;
    section.forEach(item => {
      if (item.mandatory && item.status !== 'completed') {
        missingAlerts.push(`Mandatory ${sectionName} Document missing: ${item.title}`);
      }
    });
  });

  return { score, readiness, alerts: missingAlerts };
};

// Helper to add item _id if missing (for JSONB items)
const assignItemIds = (items = []) =>
  items.map((item, idx) => ({
    _id: item._id || `item_${Date.now()}_${idx}`,
    ...item,
  }));

// Helper to map Supabase snake_case row → camelCase response (frontend compatibility)
const toClientFormat = (row, createdByUser = null) => ({
  _id: row.id,
  id: row.id,
  projectName: row.project_name,
  projectType: row.project_type,
  clientName: row.client_name,
  tenderValue: row.tender_value,
  tenderCategory: row.tender_category,
  submissionDeadline: row.submission_deadline,
  location: row.location,
  specialRequirements: row.special_requirements,
  scopeOfWork: row.scope_of_work,
  eligibilityCriteria: row.eligibility_criteria,
  additionalNotes: row.additional_notes,
  technicalSection: row.technical_section || [],
  commercialSection: row.commercial_section || [],
  financialSection: row.financial_section || [],
  complianceSection: row.compliance_section || [],
  complianceScore: row.compliance_score,
  readinessLevel: row.readiness_level,
  missingDocumentsAlerts: row.missing_documents_alerts || [],
  aiRecommendations: row.ai_recommendations || [],
  rating: row.rating,
  createdBy: createdByUser
    ? { _id: createdByUser.id, id: createdByUser.id, name: createdByUser.name, email: createdByUser.email, role: createdByUser.role }
    : row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper to write audit log
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
    console.error('[CHECKLISTS] Audit log write failed:', err.message);
  }
};

// @desc    Generate & Save a new checklist
// @route   POST /api/checklists
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName) {
      return res.status(400).json({ message: 'Project Name is required' });
    }

    const userId = req.user.id || req.user._id;

    // Generate checklist items via OpenAI
    const generatedData = await generateChecklist(req.body);

    // Merge and assign item IDs
    const techSection    = assignItemIds(generatedData.technicalSection   || []);
    const commSection    = assignItemIds(generatedData.commercialSection  || []);
    const finSection     = assignItemIds(generatedData.financialSection   || []);
    const compSection    = assignItemIds(generatedData.complianceSection  || []);

    const draftChecklist = {
      technical_section:  techSection,
      commercial_section: commSection,
      financial_section:  finSection,
      compliance_section: compSection,
    };

    const metrics = recalculateCompliance(draftChecklist);

    const insertPayload = {
      project_name:             req.body.projectName,
      project_type:             req.body.projectType,
      client_name:              req.body.clientName,
      tender_value:             req.body.tenderValue,
      tender_category:          req.body.tenderCategory,
      submission_deadline:      req.body.submissionDeadline,
      location:                 req.body.location,
      special_requirements:     req.body.specialRequirements || null,
      scope_of_work:            req.body.scopeOfWork || null,
      eligibility_criteria:     req.body.eligibilityCriteria || null,
      additional_notes:         req.body.additionalNotes || null,
      technical_section:        techSection,
      commercial_section:       commSection,
      financial_section:        finSection,
      compliance_section:       compSection,
      compliance_score:         metrics.score,
      readiness_level:          metrics.readiness,
      missing_documents_alerts: [...metrics.alerts, ...(generatedData.missingDocumentsAlerts || [])],
      ai_recommendations:       generatedData.aiRecommendations || [],
      created_by:               userId,
    };

    const { data: saved, error } = await supabase
      .from('checklists')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    await createAuditLog({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CHECKLIST_GENERATE',
      details: `Generated checklist for "${projectName}"`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return res.status(201).json(toClientFormat(saved, req.user));
  } catch (error) {
    console.error('Error generating/saving checklist:', error.message);
    res.status(500).json({ message: 'Failed to generate tender checklist' });
  }
});

// @desc    Get all checklists
// @route   GET /api/checklists
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, type, readiness } = req.query;
    const userId = req.user.id || req.user._id;

    let query = supabase
      .from('checklists')
      .select('*, creator:created_by(id, name, email, role)')
      .order('created_at', { ascending: false });

    // Staff can only see their own checklists
    if (req.user.role !== 'admin') {
      query = query.eq('created_by', userId);
    }

    if (category && category !== 'All') {
      query = query.eq('tender_category', category);
    }
    if (type && type !== 'All') {
      query = query.eq('project_type', type);
    }
    if (readiness && readiness !== 'All') {
      query = query.eq('readiness_level', readiness);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    // Apply search filter in JS (Supabase OR filter across multiple text columns)
    let results = rows || [];
    if (search) {
      const term = search.toLowerCase();
      results = results.filter(r =>
        (r.project_name || '').toLowerCase().includes(term) ||
        (r.client_name || '').toLowerCase().includes(term) ||
        (r.location || '').toLowerCase().includes(term)
      );
    }

    return res.json(results.map(r => toClientFormat(r, r.creator)));
  } catch (error) {
    console.error('Error fetching checklists:', error.message);
    res.status(500).json({ message: 'Failed to fetch checklists' });
  }
});

// @desc    Get checklist by ID
// @route   GET /api/checklists/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('checklists')
      .select('*, creator:created_by(id, name, email, role)')
      .eq('id', req.params.id)
      .single();

    if (error || !row) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const userId = (req.user.id || req.user._id).toString();
    if (req.user.role !== 'admin' && row.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied to this checklist' });
    }

    return res.json(toClientFormat(row, row.creator));
  } catch (error) {
    console.error('Error fetching single checklist:', error.message);
    res.status(500).json({ message: 'Failed to fetch checklist details' });
  }
});

// @desc    Update status of a checklist item
// @route   PUT /api/checklists/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  const { section, itemId, status } = req.body;

  try {
    const { data: row, error: fetchErr } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !row) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const userId = (req.user.id || req.user._id).toString();
    if (req.user.role !== 'admin' && row.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sectionKey = {
      technical:  'technical_section',
      commercial: 'commercial_section',
      financial:  'financial_section',
      compliance: 'compliance_section',
    }[section];

    if (!sectionKey) {
      return res.status(400).json({ message: 'Invalid section name' });
    }

    const sectionData = row[sectionKey] || [];
    const item = sectionData.find(i => i._id === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }

    item.status = status;

    const updated = { ...row, [sectionKey]: sectionData };
    const metrics = recalculateCompliance(updated);

    const { data: saved, error: updateErr } = await supabase
      .from('checklists')
      .update({
        [sectionKey]: sectionData,
        compliance_score: metrics.score,
        readiness_level: metrics.readiness,
        missing_documents_alerts: metrics.alerts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, creator:created_by(id, name, email, role)')
      .single();

    if (updateErr) throw updateErr;

    return res.json(toClientFormat(saved, saved.creator));
  } catch (error) {
    console.error('Error updating item status:', error.message);
    res.status(500).json({ message: 'Failed to update item status' });
  }
});

// @desc    Simulate document upload for a checklist item
// @route   POST /api/checklists/:id/upload
// @access  Private
router.post('/:id/upload', protect, async (req, res) => {
  const { section, itemId, fileName } = req.body;

  try {
    const { data: row, error: fetchErr } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !row) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const userId = (req.user.id || req.user._id).toString();
    if (req.user.role !== 'admin' && row.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sectionKey = {
      technical:  'technical_section',
      commercial: 'commercial_section',
      financial:  'financial_section',
      compliance: 'compliance_section',
    }[section];

    if (!sectionKey) {
      return res.status(400).json({ message: 'Invalid section name' });
    }

    const sectionData = row[sectionKey] || [];
    const item = sectionData.find(i => i._id === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.uploadedDocName = fileName || 'Uploaded_Document.pdf';
    item.uploadedDocUrl = `/mock-uploads/${Date.now()}_${item.uploadedDocName}`;
    item.status = 'completed';

    const updated = { ...row, [sectionKey]: sectionData };
    const metrics = recalculateCompliance(updated);

    const { data: saved, error: updateErr } = await supabase
      .from('checklists')
      .update({
        [sectionKey]: sectionData,
        compliance_score: metrics.score,
        readiness_level: metrics.readiness,
        missing_documents_alerts: metrics.alerts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, creator:created_by(id, name, email, role)')
      .single();

    if (updateErr) throw updateErr;

    await createAuditLog({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DOCUMENT_UPLOAD',
      details: `Uploaded "${item.uploadedDocName}"`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return res.json(toClientFormat(saved, saved.creator));
  } catch (error) {
    console.error('Error handling document upload:', error.message);
    res.status(500).json({ message: 'Failed to upload document' });
  }
});

// @desc    Rate a checklist
// @route   PUT /api/checklists/:id/rate
// @access  Private
router.put('/:id/rate', protect, async (req, res) => {
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const { data: saved, error } = await supabase
      .from('checklists')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, creator:created_by(id, name, email, role)')
      .single();

    if (error) throw error;

    return res.json({ message: 'Rating updated successfully', checklist: toClientFormat(saved, saved.creator) });
  } catch (error) {
    console.error('Error rating checklist:', error.message);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// @desc    Regenerate checklist
// @route   POST /api/checklists/:id/regenerate
// @access  Private
router.post('/:id/regenerate', protect, async (req, res) => {
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !row) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const userId = (req.user.id || req.user._id).toString();
    if (req.user.role !== 'admin' && row.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const regeneratedData = await generateChecklist({
      projectName: row.project_name,
      projectType: row.project_type,
      clientName: row.client_name,
      tenderValue: row.tender_value,
      tenderCategory: row.tender_category,
      submissionDeadline: row.submission_deadline,
      location: row.location,
      specialRequirements: row.special_requirements,
      scopeOfWork: row.scope_of_work,
      eligibilityCriteria: row.eligibility_criteria,
      additionalNotes: row.additional_notes,
    });

    const techSection    = assignItemIds(regeneratedData.technicalSection   || []);
    const commSection    = assignItemIds(regeneratedData.commercialSection  || []);
    const finSection     = assignItemIds(regeneratedData.financialSection   || []);
    const compSection    = assignItemIds(regeneratedData.complianceSection  || []);

    const draftChecklist = {
      technical_section:  techSection,
      commercial_section: commSection,
      financial_section:  finSection,
      compliance_section: compSection,
    };

    const metrics = recalculateCompliance(draftChecklist);

    const { data: saved, error: updateErr } = await supabase
      .from('checklists')
      .update({
        technical_section:        techSection,
        commercial_section:       commSection,
        financial_section:        finSection,
        compliance_section:       compSection,
        ai_recommendations:       regeneratedData.aiRecommendations || [],
        compliance_score:         metrics.score,
        readiness_level:          metrics.readiness,
        missing_documents_alerts: [...metrics.alerts, ...(regeneratedData.missingDocumentsAlerts || [])],
        updated_at:               new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, creator:created_by(id, name, email, role)')
      .single();

    if (updateErr) throw updateErr;

    await createAuditLog({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CHECKLIST_REGENERATE',
      details: `Regenerated checklist for "${row.project_name}"`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return res.json(toClientFormat(saved, saved.creator));
  } catch (error) {
    console.error('Error regenerating checklist:', error.message);
    res.status(500).json({ message: 'Failed to regenerate checklist' });
  }
});

// @desc    Delete a checklist
// @route   DELETE /api/checklists/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('checklists')
      .select('id, project_name, created_by')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !row) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const userId = (req.user.id || req.user._id).toString();
    if (req.user.role !== 'admin' && row.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { error: deleteErr } = await supabase
      .from('checklists')
      .delete()
      .eq('id', req.params.id);

    if (deleteErr) throw deleteErr;

    await createAuditLog({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CHECKLIST_DELETE',
      details: `Deleted checklist for "${row.project_name}"`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error.message);
    res.status(500).json({ message: 'Failed to delete checklist' });
  }
});

export default router;
