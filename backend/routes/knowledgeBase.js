const express = require('express');
const { validateClientAccess } = require('../services/multiTenantService');
const { upsertKBItem, deleteKBItem, getClientKB } = require('../services/firebaseService');

const router = express.Router();

/**
 * Get client's knowledge base
 * GET /api/clients/:clientId/kb
 */
router.get('/:clientId/kb', async (req, res) => {
  try {
    const { clientId } = req.params;
    await validateClientAccess(clientId);

    const kb = await getClientKB(clientId);
    res.json(kb);
  } catch (error) {
    console.error('[KB_ROUTE] Error fetching KB:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Add/Update KB item (Q&A pair)
 * POST /api/clients/:clientId/kb
 */
router.post('/:clientId/kb', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { id, question, answer, category } = req.body;

    if (!id || !question || !answer) {
      return res.status(400).json({ error: 'id, question, and answer are required' });
    }

    await validateClientAccess(clientId);
    
    await upsertKBItem(clientId, id, {
      question,
      answer,
      category: category || 'general'
    });

    res.json({ 
      success: true, 
      message: 'KB item updated',
      id 
    });
  } catch (error) {
    console.error('[KB_ROUTE] Error updating KB:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete KB item
 * DELETE /api/clients/:clientId/kb/:itemId
 */
router.delete('/:clientId/kb/:itemId', async (req, res) => {
  try {
    const { clientId, itemId } = req.params;
    
    await validateClientAccess(clientId);
    await deleteKBItem(clientId, itemId);

    res.json({ success: true, message: 'KB item deleted', itemId });
  } catch (error) {
    console.error('[KB_ROUTE] Error deleting KB:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
