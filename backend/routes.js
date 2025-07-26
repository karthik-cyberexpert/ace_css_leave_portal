const express = require('express');
const router = express.Router();
const pool = require('./db');

router.get('/api/leave_requests', async (req, res) => {
  console.log('Received request for /api/leave_requests');
  try {
    const result = await pool.query('SELECT * FROM leave_requests');
    console.log('Query result:', result);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

router.get('*', (req, res) => {
  console.log('Received request for unknown route:', req.url);
  res.status(404).json({ message: 'Not found' });
});

module.exports = router;