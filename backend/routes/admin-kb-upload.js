const express = require('express');
const multer = require('multer');
const path = require('path');
const { db } = require('../services/firebaseService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Only accept .txt files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.txt') {
      cb(new Error('Only .txt files are allowed'), false);
    } else {
      cb(null, true);
    }
  }
});

/**
 * Upload and parse knowledge base document
 * POST /api/admin/kb/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { file } = req;
    const content = file.buffer.toString('utf-8').trim();

    if (!content) {
      return res.status(400).json({ error: 'File is empty' });
    }

    // Create document object
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const kbDocument = {
      id: docId,
      title: file.originalname.replace('.txt', ''),
      content: content,
      uploadedAt: new Date(),
      uploadedBy: 'admin@kylo.com', // TODO: Use authenticated user
      size: file.size,
      status: 'active'
    };

    // Get current global KB
    const globalKBRef = db.collection('knowledgeBases').doc('global');
    const globalKBDoc = await globalKBRef.get();
    const globalKB = globalKBDoc.data() || { documents: [] };

    // Add new document
    const documents = Array.isArray(globalKB.documents) ? globalKB.documents : [];
    documents.push(kbDocument);

    // Update Firestore
    await globalKBRef.set({
      ...globalKB,
      documents,
      updatedAt: new Date()
    });

    console.log(`[KB_UPLOAD] Document uploaded: ${docId} (${file.size} bytes)`);

    res.json({
      success: true,
      message: 'Knowledge base document uploaded successfully',
      document: kbDocument,
      totalDocuments: documents.length
    });
  } catch (error) {
    console.error('[KB_UPLOAD] Error:', error.message);
    res.status(500).json({
      error: 'Failed to upload knowledge base',
      details: error.message
    });
  }
});

/**
 * Get all knowledge base documents
 * GET /api/admin/kb/documents
 */
router.get('/documents', async (req, res) => {
  try {
    const globalKBRef = db.collection('knowledgeBases').doc('global');
    const globalKBDoc = await globalKBRef.get();
    const globalKB = globalKBDoc.data() || { documents: [] };

    const documents = Array.isArray(globalKB.documents) ? globalKB.documents : [];

    res.json({
      success: true,
      documents,
      count: documents.length
    });
  } catch (error) {
    console.error('[KB_UPLOAD] Error fetching documents:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a knowledge base document
 * DELETE /api/admin/kb/documents/:docId
 */
router.delete('/documents/:docId', async (req, res) => {
  try {
    const { docId } = req.params;

    const globalKBRef = db.collection('knowledgeBases').doc('global');
    const globalKBDoc = await globalKBRef.get();
    const globalKB = globalKBDoc.data() || { documents: [] };

    const documents = Array.isArray(globalKB.documents) ? globalKB.documents : [];
    const filtered = documents.filter(doc => doc.id !== docId);

    if (filtered.length === documents.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await globalKBRef.set({
      ...globalKB,
      documents: filtered,
      updatedAt: new Date()
    });

    console.log(`[KB_UPLOAD] Document deleted: ${docId}`);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      totalDocuments: filtered.length
    });
  } catch (error) {
    console.error('[KB_UPLOAD] Error deleting document:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
