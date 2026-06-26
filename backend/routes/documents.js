import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { protect, adminOnly } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import {
  isSupabaseConfigured,
  uploadToSupabase,
  deleteFromSupabase,
  generateSignedUrl,
} from '../services/supabaseService.js';

const router = express.Router();

// Define directory variables for local file storage in mock fallback mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'tenders');

// Multer Setup - Memory storage to handle buffer upload for Supabase and local writing on fallback
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Allowed Mime Types List
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Helper: check if user has access to a checklist/tender
const checkTenderAccess = async (tenderId, reqUser) => {
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select('id, project_name, created_by')
    .eq('id', tenderId)
    .single();

  if (error || !checklist) return null;

  // Admins have access to everything
  if (reqUser.role === 'admin') return checklist;

  // Staff only have access to their own checklists
  const userIdStr = (reqUser.id || reqUser._id).toString();
  if (checklist.created_by === userIdStr) return checklist;

  return null;
};

// Helper: write audit log
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
    console.error('[DOCUMENTS] Audit log write failed:', err.message);
  }
};

// @desc    Upload tender document
// @route   POST /api/documents
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    const { tenderId } = req.body;
    const file = req.file;

    if (!tenderId) {
      return res.status(400).json({ message: 'Tender ID is required' });
    }
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate Mime Type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        message: 'Invalid file type. Allowed types: PDF, Word, Excel, PNG, JPG, WEBP.',
      });
    }

    // Verify checklist exists and user has access
    const checklist = await checkTenderAccess(tenderId, req.user);
    if (!checklist) {
      return res.status(404).json({ message: 'Tender/Checklist record not found or access denied.' });
    }

    const timestamp = Date.now();
    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const relativeFilePath = `tenders/${tenderId}/${timestamp}_${cleanFilename}`;

    let savedMetadata = null;
    let savedInSupabase = false;

    // 1. Attempt upload to Supabase Storage
    if (isSupabaseConfigured) {
      try {
        console.log(`[DOCUMENTS] Uploading to Supabase Storage: ${relativeFilePath}`);
        await uploadToSupabase(relativeFilePath, file.buffer, file.mimetype);
        savedInSupabase = true;
      } catch (storageErr) {
        console.error('[DOCUMENTS] Supabase Storage upload failed, falling back to local files:', storageErr.message);
      }
    }

    // 2. Save metadata to Supabase DB
    const userId = (req.user.id || req.user._id).toString();
    const { data: docRow, error: dbErr } = await supabase
      .from('tender_documents')
      .insert({
        tender_id:   tenderId,
        uploaded_by: userId,
        file_name:   file.originalname,
        file_path:   relativeFilePath,
        file_type:   file.mimetype,
        file_size:   file.size,
      })
      .select()
      .single();

    if (dbErr) {
      console.error('[DOCUMENTS] Supabase DB Insert failed:', dbErr.message);

      // Fall back to saving file locally if Supabase DB failed too
      const targetDir = path.join(UPLOADS_DIR, tenderId);
      await fs.mkdir(targetDir, { recursive: true });
      const localPath = path.join(targetDir, `${timestamp}_${cleanFilename}`);
      await fs.writeFile(localPath, file.buffer);

      savedMetadata = {
        _id: `local_${timestamp}`,
        tender_id: tenderId,
        uploaded_by: userId,
        file_name: file.originalname,
        file_path: relativeFilePath,
        file_type: file.mimetype,
        file_size: file.size,
        isSupabase: false,
        createdAt: new Date().toISOString(),
      };
    } else {
      savedMetadata = {
        _id: docRow.id,
        id: docRow.id,
        tender_id: tenderId,
        uploaded_by: userId,
        file_name: file.originalname,
        file_path: relativeFilePath,
        file_type: file.mimetype,
        file_size: file.size,
        isSupabase: savedInSupabase,
        createdAt: docRow.created_at,
      };
    }

    // 3. Create Audit Log
    await createAuditLog({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DOCUMENT_UPLOAD',
      details: `Uploaded tender document "${file.originalname}" for project "${checklist.project_name}"`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return res.status(201).json(savedMetadata);
  } catch (err) {
    console.error('[DOCUMENTS] Upload route exception:', err.message);
    res.status(500).json({ message: 'Server failed to upload document.' });
  }
});

// @desc    Get tender documents by tender ID
// @route   GET /api/documents/tender/:tenderId
// @access  Private
router.get('/tender/:tenderId', protect, async (req, res) => {
  try {
    const { tenderId } = req.params;

    // Verify access rights
    const checklist = await checkTenderAccess(tenderId, req.user);
    if (!checklist) {
      return res.status(403).json({ message: 'Access denied or tender not found.' });
    }

    const { data: docs, error } = await supabase
      .from('tender_documents')
      .select('*, uploader:uploaded_by(id, name, email, role)')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const documents = (docs || []).map(d => ({
      _id: d.id,
      id: d.id,
      tender_id: d.tender_id,
      uploaded_by: d.uploader || d.uploaded_by,
      file_name: d.file_name,
      file_path: d.file_path,
      file_type: d.file_type,
      file_size: d.file_size,
      createdAt: d.created_at,
      isSupabase: true,
    }));

    return res.json(documents);
  } catch (err) {
    console.error('[DOCUMENTS] Get documents route exception:', err.message);
    res.status(500).json({ message: 'Server failed to fetch documents.' });
  }
});

// Helper: retrieve metadata record from Supabase DB
const getDocumentRecord = async (docId) => {
  try {
    const { data, error } = await supabase
      .from('tender_documents')
      .select('*')
      .eq('id', docId)
      .maybeSingle();

    if (!error && data) {
      return {
        _id: data.id,
        id: data.id,
        tender_id: data.tender_id,
        uploaded_by: data.uploaded_by,
        file_name: data.file_name,
        file_path: data.file_path,
        file_type: data.file_type,
        file_size: data.file_size,
        isSupabase: true,
      };
    }
  } catch (err) {
    // Ignore, return null
  }
  return null;
};

// @desc    Generate signed preview URL
// @route   GET /api/documents/:id/preview
// @access  Private
router.get('/:id/preview', protect, async (req, res) => {
  try {
    const doc = await getDocumentRecord(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Verify access
    const checklist = await checkTenderAccess(doc.tender_id, req.user);
    if (!checklist) {
      return res.status(403).json({ message: 'Access denied to this document.' });
    }

    if (isSupabaseConfigured) {
      const signedUrl = await generateSignedUrl(doc.file_path, 3600, false);
      return res.json({ url: signedUrl, file_name: doc.file_name, file_type: doc.file_type });
    } else {
      return res.json({
        url: `/api/documents/serve/${doc.id}?action=view`,
        file_name: doc.file_name,
        file_type: doc.file_type,
        isLocal: true,
      });
    }
  } catch (err) {
    console.error('[DOCUMENTS] Preview route exception:', err.message);
    res.status(500).json({ message: 'Server failed to generate preview URL.' });
  }
});

// @desc    Generate signed download URL
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const doc = await getDocumentRecord(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Verify access
    const checklist = await checkTenderAccess(doc.tender_id, req.user);
    if (!checklist) {
      return res.status(403).json({ message: 'Access denied to this document.' });
    }

    if (isSupabaseConfigured) {
      const signedUrl = await generateSignedUrl(doc.file_path, 3600, true);
      return res.json({ url: signedUrl, file_name: doc.file_name });
    } else {
      return res.json({
        url: `/api/documents/serve/${doc.id}?action=download`,
        file_name: doc.file_name,
        isLocal: true,
      });
    }
  } catch (err) {
    console.error('[DOCUMENTS] Download route exception:', err.message);
    res.status(500).json({ message: 'Server failed to generate download URL.' });
  }
});

// @desc    Serve local files directly (fallback mode)
// @route   GET /api/documents/serve/:id
// @access  Private
router.get('/serve/:id', protect, async (req, res) => {
  try {
    const action = req.query.action || 'view';
    const doc = await getDocumentRecord(req.params.id);

    if (!doc) {
      return res.status(404).send('Document not found');
    }

    // Verify access
    const checklist = await checkTenderAccess(doc.tender_id, req.user);
    if (!checklist) {
      return res.status(403).send('Access denied');
    }

    const cleanPath = doc.file_path.replace(/\\/g, '/');
    const localFilePath = path.join(__dirname, '..', 'uploads', cleanPath);

    try {
      await fs.access(localFilePath);
    } catch {
      return res.status(404).send('Physical file not found on local disk storage.');
    }

    res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');

    if (action === 'download') {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
    }

    res.sendFile(localFilePath);
  } catch (err) {
    console.error('[DOCUMENTS] Serve local file exception:', err.message);
    res.status(500).send('Internal server error serving document');
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await getDocumentRecord(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Verify access
    const checklist = await checkTenderAccess(doc.tender_id, req.user);
    if (!checklist) {
      return res.status(403).json({ message: 'Access denied or tender not found.' });
    }

    // 1. Delete from Supabase Storage
    if (isSupabaseConfigured) {
      try {
        await deleteFromSupabase(doc.file_path);
      } catch (storageErr) {
        console.error('[DOCUMENTS] Supabase Storage delete failed:', storageErr.message);
      }
    } else {
      // Delete local physical file fallback
      const cleanPath = doc.file_path.replace(/\\/g, '/');
      const localFilePath = path.join(__dirname, '..', 'uploads', cleanPath);
      try {
        await fs.unlink(localFilePath);
      } catch (err) {
        console.warn('[DOCUMENTS] Local file removal warning:', err.message);
      }
    }

    // 2. Delete metadata from Supabase DB
    const { error: deleteErr } = await supabase
      .from('tender_documents')
      .delete()
      .eq('id', req.params.id);

    if (deleteErr) {
      console.error('[DOCUMENTS] Supabase metadata delete failed:', deleteErr.message);
    }

    // 3. Create Audit Log
    const userId = (req.user.id || req.user._id).toString();
    await createAuditLog({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DOCUMENT_DELETE',
      details: `Deleted tender document "${doc.file_name}" from project "${checklist.project_name}"`,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    });

    return res.json({ message: 'Tender document deleted successfully.' });
  } catch (err) {
    console.error('[DOCUMENTS] Delete route exception:', err.message);
    res.status(500).json({ message: 'Server failed to delete document.' });
  }
});

export default router;
