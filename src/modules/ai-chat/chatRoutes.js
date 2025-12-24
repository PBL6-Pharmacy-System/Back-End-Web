/**
 * AI Chat Routes
 * Routes cho tính năng chat AI
 */

import express from 'express';
import { authenticateToken } from '../auth/auth.middleware.js';
import * as chatController from './chatController.js';

const router = express.Router();

/**
 * POST /api/auth-chat/stream
 * Stream AI chat response
 * Access: Authenticated users
 */
router.post('/auth-chat/stream', authenticateToken, chatController.streamChat);

/**
 * POST /api/auth-chat
 * Non-streaming AI chat (fallback)
 * Access: Authenticated users
 */
router.post('/auth-chat', authenticateToken, chatController.chat);

// =====================================================
// CONVERSATION MANAGEMENT APIs
// =====================================================

/**
 * GET /api/auth-chat/conversations
 * Lấy danh sách các cuộc hội thoại của user
 * Access: Authenticated users
 */
router.get('/auth-chat/conversations', authenticateToken, chatController.getConversations);

/**
 * POST /api/auth-chat/conversations
 * Tạo cuộc hội thoại mới
 * Access: Authenticated users
 */
router.post('/auth-chat/conversations', authenticateToken, chatController.createConversation);

/**
 * GET /api/auth-chat/conversations/:conversationId
 * Lấy chi tiết một cuộc hội thoại (bao gồm messages)
 * Access: Authenticated users
 */
router.get('/auth-chat/conversations/:conversationId', authenticateToken, chatController.getConversationDetail);

/**
 * PUT /api/auth-chat/conversations/:conversationId
 * Cập nhật thông tin cuộc hội thoại (title, etc.)
 * Access: Authenticated users
 */
router.put('/auth-chat/conversations/:conversationId', authenticateToken, chatController.updateConversation);

/**
 * DELETE /api/auth-chat/conversations/:conversationId
 * Xóa cuộc hội thoại
 * Access: Authenticated users
 */
router.delete('/auth-chat/conversations/:conversationId', authenticateToken, chatController.deleteConversation);

export default router;
