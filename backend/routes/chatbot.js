const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/auth');

router.post('/chat', optionalAuth, chat);

module.exports = router;
