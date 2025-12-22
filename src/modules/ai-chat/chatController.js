/**
 * AI Chat Controller
 * Xử lý chat với AI và gợi ý sản phẩm
 */

import * as chatService from './chatService.js';

/**
 * POST /api/auth-chat/stream
 * Stream AI chat response với gợi ý sản phẩm
 * Access: Authenticated users
 */
export const streamChat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.userId;
    const customerId = req.user?.customer_id;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'Message is required',
        status_code: 400
      });
    }

    console.log(`🤖 AI Chat - User ${userId} (Customer: ${customerId}): ${message}`);

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Process chat and stream response (with conversation support)
    const result = await chatService.processChatStream(message, customerId, (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, userId, conversationId);

    // Send completion signal
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('❌ Stream chat error:', error);
    
    // If headers not sent, return JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
        status_code: 500
      });
    }
    
    // If streaming, send error event
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: 'An error occurred while processing your request'
    })}\n\n`);
    res.end();
  }
};

/**
 * POST /api/auth-chat
 * Non-streaming AI chat (fallback)
 * Access: Authenticated users
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.userId;
    const customerId = req.user?.customer_id;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`🤖 AI Chat (non-stream) - User ${userId}: ${message}`);

    const result = await chatService.processChat(message, customerId, userId, conversationId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

/**
 * GET /api/auth-chat/conversations
 * Lấy danh sách cuộc hội thoại của user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    console.log(`📜 Getting conversations for user ${userId}`);

    const result = await chatService.getUserConversations(userId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result.conversations,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách cuộc hội thoại'
    });
  }
};

/**
 * POST /api/auth-chat/conversations
 * Tạo cuộc hội thoại mới
 */
export const createConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { title } = req.body;

    console.log(`➕ Creating new conversation for user ${userId}`);

    const conversation = await chatService.createConversation(userId, title);

    res.status(201).json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tạo cuộc hội thoại mới'
    });
  }
};

/**
 * GET /api/auth-chat/conversations/:conversationId
 * Lấy chi tiết cuộc hội thoại (bao gồm messages)
 */
export const getConversationDetail = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    console.log(`📖 Getting conversation ${conversationId} for user ${userId}`);

    const result = await chatService.getConversationWithMessages(userId, parseInt(conversationId));

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy cuộc hội thoại'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Get conversation detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể lấy chi tiết cuộc hội thoại'
    });
  }
};

/**
 * PUT /api/auth-chat/conversations/:conversationId
 * Cập nhật thông tin cuộc hội thoại
 */
export const updateConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const { title } = req.body;

    console.log(`✏️ Updating conversation ${conversationId} for user ${userId}`);

    const conversation = await chatService.updateConversation(userId, parseInt(conversationId), { title });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy cuộc hội thoại'
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Update conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể cập nhật cuộc hội thoại'
    });
  }
};

/**
 * DELETE /api/auth-chat/conversations/:conversationId
 * Xóa cuộc hội thoại
 */
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    console.log(`🗑️ Deleting conversation ${conversationId} for user ${userId}`);

    const success = await chatService.deleteConversation(userId, parseInt(conversationId));

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy cuộc hội thoại'
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa cuộc hội thoại'
    });

  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể xóa cuộc hội thoại'
    });
  }
};
