/**
 * AI Chat Service
 * Logic xử lý chat AI và tìm kiếm sản phẩm
 */

import prisma from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// CONVERSATION MANAGEMENT
// =====================================================

/**
 * Tạo cuộc hội thoại mới
 */
export const createConversation = async (userId, title = null) => {
  try {
    const sessionId = uuidv4();
    
    const conversation = await prisma.chat_conversations.create({
      data: {
        session_id: sessionId,
        user_id: userId,
        user_role: 'customer',
        title: title || 'Cuộc trò chuyện mới',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_activity: new Date()
      }
    });

    console.log(`✅ Created conversation ${conversation.id} for user ${userId}`);
    return conversation;
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    throw error;
  }
};

/**
 * Lấy danh sách cuộc hội thoại của user
 */
export const getUserConversations = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.chat_conversations.findMany({
        where: {
          user_id: userId,
          is_active: true
        },
        orderBy: {
          last_activity: 'desc'
        },
        skip,
        take: limit,
        include: {
          chat_messages: {
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              content: true,
              query_type: true,
              created_at: true
            }
          },
          _count: {
            select: { chat_messages: true }
          }
        }
      }),
      prisma.chat_conversations.count({
        where: {
          user_id: userId,
          is_active: true
        }
      })
    ]);

    // Format conversations with last message preview and accurate message count
    const formattedConversations = conversations.map(conv => {
      // Get last user message for preview (more meaningful)
      const lastUserMessage = conv.chat_messages.find(m => m.query_type === 'user');
      const lastMessage = lastUserMessage || conv.chat_messages[0];
      
      return {
        id: conv.id,
        sessionId: conv.session_id,
        title: conv.title || 'Cuộc trò chuyện',
        lastMessage: lastMessage?.content?.substring(0, 100) || null,
        lastActivity: conv.last_activity || conv.updated_at,
        createdAt: conv.created_at,
        messageCount: conv._count?.chat_messages || 0
      };
    });

    return {
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('❌ Get user conversations error:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết cuộc hội thoại với messages
 */
export const getConversationWithMessages = async (userId, conversationId) => {
  try {
    const conversation = await prisma.chat_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: userId
      },
      include: {
        chat_messages: {
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            content: true,
            query_type: true,
            result_ids: true,
            created_at: true
          }
        }
      }
    });

    if (!conversation) {
      return null;
    }

    // Format messages for client
    const messages = conversation.chat_messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      isUser: msg.query_type === 'user',
      productIds: msg.result_ids || [],
      createdAt: msg.created_at
    }));

    return {
      id: conversation.id,
      sessionId: conversation.session_id,
      title: conversation.title,
      createdAt: conversation.created_at,
      lastActivity: conversation.last_activity,
      messages
    };
  } catch (error) {
    console.error('❌ Get conversation with messages error:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin cuộc hội thoại
 */
export const updateConversation = async (userId, conversationId, data) => {
  try {
    // Verify ownership
    const existing = await prisma.chat_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: userId
      }
    });

    if (!existing) {
      return null;
    }

    const updated = await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: {
        title: data.title,
        updated_at: new Date()
      }
    });

    return updated;
  } catch (error) {
    console.error('❌ Update conversation error:', error);
    throw error;
  }
};

/**
 * Xóa cuộc hội thoại (soft delete)
 */
export const deleteConversation = async (userId, conversationId) => {
  try {
    // Verify ownership
    const existing = await prisma.chat_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: userId
      }
    });

    if (!existing) {
      return false;
    }

    // Soft delete - set is_active to false
    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    console.log(`🗑️ Deleted conversation ${conversationId}`);
    return true;
  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    throw error;
  }
};

/**
 * Lưu message vào conversation
 */
const saveMessage = async (conversationId, content, isUser, productIds = []) => {
  try {
    const message = await prisma.chat_messages.create({
      data: {
        conversation_id: conversationId,
        content: content,
        query_type: isUser ? 'user' : 'assistant',
        result_ids: productIds,
        created_at: new Date()
      }
    });

    // Update conversation last_activity
    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: {
        last_activity: new Date(),
        updated_at: new Date()
      }
    });

    return message;
  } catch (error) {
    console.error('❌ Save message error:', error);
    throw error;
  }
};

/**
 * Tự động tạo title từ tin nhắn đầu tiên
 */
const autoGenerateTitle = async (conversationId, firstMessage) => {
  try {
    // Lấy 50 ký tự đầu làm title
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...'
      : firstMessage;

    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: { title }
    });
  } catch (error) {
    console.error('❌ Auto generate title error:', error);
  }
};

/**
 * Get or create conversation for user
 */
const getOrCreateConversation = async (userId, conversationId = null) => {
  try {
    if (conversationId) {
      // Verify existing conversation belongs to user
      const existing = await prisma.chat_conversations.findFirst({
        where: {
          id: conversationId,
          user_id: userId,
          is_active: true
        }
      });
      if (existing) return existing;
    }

    // Create new conversation
    return await createConversation(userId);
  } catch (error) {
    console.error('❌ Get or create conversation error:', error);
    throw error;
  }
};

// =====================================================
// CHAT PROCESSING (Updated to save messages)
// =====================================================

/**
 * Process chat message and stream response
 */
export const processChatStream = async (message, customerId, writeData, userId = null, conversationId = null) => {
  try {
    console.log('🤖 AI Chat - Processing message:', message);
    
    let conversation = null;
    let isNewConversation = false;
    
    // If user is logged in, save to conversation
    if (userId) {
      conversation = await getOrCreateConversation(userId, conversationId);
      isNewConversation = !conversationId;
      
      // Send conversation ID immediately so client can track
      if (conversation) {
        writeData({ type: 'conversation', conversationId: conversation.id });
        console.log(`📝 Sent conversation ID: ${conversation.id}`);
      }
      
      // Save user message
      await saveMessage(conversation.id, message, true);
      
      // Auto-generate title for new conversation
      if (isNewConversation) {
        await autoGenerateTitle(conversation.id, message);
      }
    }
    
    // First, search for relevant products based on keywords
    const { exactMatches, relatedProducts } = await searchRelevantProducts(message, customerId);
    const hasProducts = exactMatches.length > 0 || relatedProducts.length > 0;
    
    console.log('🔍 Search results - exactMatches:', exactMatches.length, ', relatedProducts:', relatedProducts.length);
    
    // Generate AI response based on products found
    const aiResponse = await generateAIResponse(message, hasProducts, exactMatches.length);
    
    console.log('💬 AI Response:', aiResponse.substring(0, 100) + '...');
    
    // Stream text response in chunks
    const words = aiResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      writeData({ type: 'text', data: chunk });
      
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 25));
    }

    // Send products if found
    if (hasProducts) {
      console.log('🛒 Sending products to client...');
      writeData({
        type: 'products',
        products: {
          exact_matches: exactMatches,
          related: relatedProducts
        }
      });
    } else {
      console.log('⚠️ No products found for this query');
    }

    // Save AI response to conversation
    if (conversation) {
      const productIds = [...exactMatches, ...relatedProducts].map(p => p.id);
      await saveMessage(conversation.id, aiResponse, false, productIds);
    }

    return { conversationId: conversation?.id };

  } catch (error) {
    console.error('❌ Process chat stream error:', error);
    throw error;
  }
};

/**
 * Process chat message (non-streaming)
 */
export const processChat = async (message, customerId, userId = null, conversationId = null) => {
  try {
    let conversation = null;
    
    // If user is logged in, save to conversation
    if (userId) {
      conversation = await getOrCreateConversation(userId, conversationId);
      await saveMessage(conversation.id, message, true);
      
      if (!conversationId) {
        await autoGenerateTitle(conversation.id, message);
      }
    }
    
    const { exactMatches, relatedProducts } = await searchRelevantProducts(message, customerId);
    const hasProducts = exactMatches.length > 0 || relatedProducts.length > 0;
    const aiResponse = await generateAIResponse(message, hasProducts, exactMatches.length);

    // Save AI response
    if (conversation) {
      const productIds = [...exactMatches, ...relatedProducts].map(p => p.id);
      await saveMessage(conversation.id, aiResponse, false, productIds);
    }

    return {
      response: aiResponse,
      products: {
        exact_matches: exactMatches,
        related: relatedProducts
      },
      conversationId: conversation?.id
    };
  } catch (error) {
    console.error('❌ Process chat error:', error);
    throw error;
  }
};

/**
 * Generate AI response based on message and product search results
 */
const generateAIResponse = async (message, hasProducts, exactMatchCount) => {
  const lowerMessage = message.toLowerCase();

  // Đau cơ, đau tay, đau chân, đau nhức - kiểm tra TRƯỚC đau lưng
  if (lowerMessage.includes('đau tay') || lowerMessage.includes('đau chân') || 
      lowerMessage.includes('đau cơ') || lowerMessage.includes('nhức mỏi') ||
      lowerMessage.includes('đau vai') || lowerMessage.includes('đau cổ')) {
    const bodyPart = lowerMessage.includes('đau tay') ? 'tay' : 
                     lowerMessage.includes('đau chân') ? 'chân' :
                     lowerMessage.includes('đau vai') ? 'vai' :
                     lowerMessage.includes('đau cổ') ? 'cổ' :
                     lowerMessage.includes('đau cơ') ? 'cơ' : 'cơ thể';
    if (hasProducts) {
      return `Tôi hiểu bạn đang bị đau ${bodyPart}. Đây có thể do căng cơ, vận động quá sức, hoặc chấn thương nhẹ. Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm phù hợp' : 'một số sản phẩm liên quan'} cho bạn, bao gồm miếng dán giảm đau, gel bôi, và thuốc giảm đau. Bạn có thể xem và đặt mua trực tiếp bên dưới. Lưu ý: Nếu đau kéo dài hoặc nghiêm trọng, bạn nên đi khám bác sĩ.`;
    }
    return `Tôi hiểu bạn đang bị đau ${bodyPart}. Đây có thể do căng cơ, vận động quá sức, hoặc chấn thương nhẹ. Các sản phẩm hỗ trợ phổ biến bao gồm miếng dán giảm đau, gel bôi ngoài da, và thuốc giảm đau. Nếu đau kéo dài, bạn nên đi khám bác sĩ.`;
  }

  // Đau lưng
  if (lowerMessage.includes('đau lưng')) {
    if (hasProducts) {
      return `Tôi hiểu bạn đang gặp vấn đề về đau lưng. Đây là một triệu chứng phổ biến có thể do nhiều nguyên nhân như ngồi sai tư thế, vận động quá sức, hoặc các vấn đề về cột sống. Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm phù hợp' : 'một số sản phẩm liên quan'} cho bạn, bao gồm miếng dán giảm đau và các loại thuốc giảm đau khác. Bạn có thể xem và đặt mua trực tiếp. Lưu ý: Nếu đau lưng kéo dài hoặc nghiêm trọng, bạn nên đi khám bác sĩ để được chẩn đoán chính xác.`;
    }
    return 'Tôi hiểu bạn đang gặp vấn đề về đau lưng. Đau lưng có thể do nhiều nguyên nhân như ngồi sai tư thế, vận động quá sức, hoặc các vấn đề về cột sống. Các sản phẩm hỗ trợ phổ biến bao gồm miếng dán giảm đau, gel bôi ngoài da, và thuốc giảm đau. Nếu đau lưng kéo dài, bạn nên đi khám bác sĩ để được chẩn đoán chính xác.';
  }

  // Miếng dán giảm đau (generic)
  if (lowerMessage.includes('miếng dán') || lowerMessage.includes('cao dán')) {
    if (hasProducts) {
      return `Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm miếng dán/cao dán' : 'một số sản phẩm miếng dán'} phù hợp với nhu cầu của bạn. Miếng dán giảm đau thường được sử dụng để giảm đau cơ, đau khớp, đau lưng. Bạn có thể xem chi tiết và đặt mua bên dưới. Lưu ý đọc kỹ hướng dẫn sử dụng trước khi dùng.`;
    }
    return 'Miếng dán giảm đau là sản phẩm phổ biến để giảm đau cơ, đau khớp, đau lưng. Hãy cho tôi biết vị trí đau cụ thể (đau lưng, đau vai, đau khớp...) để tôi gợi ý sản phẩm phù hợp nhất.';
  }

  // Health and medicine responses with product awareness
  if (lowerMessage.includes('cảm') || lowerMessage.includes('sốt') || lowerMessage.includes('đau đầu')) {
    if (hasProducts) {
      return `Dựa trên triệu chứng của bạn, tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm phù hợp' : 'một số sản phẩm liên quan'} giúp giảm các triệu chứng cảm cúm, sốt, đau đầu. Bạn có thể xem chi tiết và thêm vào giỏ hàng. Lưu ý: Nếu triệu chứng kéo dài hoặc nghiêm trọng, vui lòng tham khảo ý kiến bác sĩ.`;
    }
    return 'Dựa trên triệu chứng của bạn, tôi gợi ý một số loại thuốc phù hợp. Thuốc cảm cúm thường giúp giảm các triệu chứng như sốt, đau đầu, và nghẹt mũi. Tuy nhiên, bạn nên tham khảo ý kiến bác sĩ nếu triệu chứng kéo dài hoặc nghiêm trọng.';
  }

  if (lowerMessage.includes('vitamin') || lowerMessage.includes('tăng đề kháng') || lowerMessage.includes('sức khỏe')) {
    if (hasProducts) {
      return `Tuyệt vời! Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm vitamin và bổ sung' : 'một số sản phẩm bổ sung'} phù hợp với nhu cầu tăng cường sức đề kháng của bạn. Vitamin C, D và các multivitamin đều có sẵn. Bạn có thể xem và mua trực tiếp bên dưới.`;
    }
    return 'Vitamin và các chất bổ sung giúp tăng cường sức đề kháng, đặc biệt quan trọng trong mùa thay đổi thời tiết. Tôi có một số sản phẩm vitamin C, vitamin D, và các multivitamin chất lượng cao phù hợp với nhu cầu của bạn.';
  }

  if (lowerMessage.includes('đau bụng') || lowerMessage.includes('tiêu hóa') || lowerMessage.includes('đau dạ dày')) {
    if (hasProducts) {
      return `Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} hỗ trợ tiêu hóa và giảm đau bụng. Các sản phẩm này bao gồm thuốc đau dạ dày, men vi sinh, và các loại hỗ trợ tiêu hóa. Bạn có thể xem và đặt mua bên dưới. Nếu tình trạng không cải thiện sau 2-3 ngày, bạn nên đi khám bác sĩ.`;
    }
    return 'Vấn đề tiêu hóa có thể do nhiều nguyên nhân. Tôi gợi ý các loại thuốc hỗ trợ tiêu hóa và men vi sinh. Nếu tình trạng không cải thiện sau 2-3 ngày, bạn nên đi khám bác sĩ.';
  }

  if (lowerMessage.includes('ho') || lowerMessage.includes('đau họng') || lowerMessage.includes('viêm họng')) {
    if (hasProducts) {
      return `Tôi hiểu bạn đang gặp vấn đề về ho và đau họng. Đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} bao gồm siro ho, viên ngậm họng, và thuốc trị viêm họng. Bạn có thể xem chi tiết và mua ngay bên dưới. Nhớ uống nhiều nước và nghỉ ngơi đầy đủ nhé!`;
    }
    return 'Đau họng và ho có thể là dấu hiệu của nhiễm trùng đường hô hấp. Tôi có thể gợi ý một số loại thuốc ho, viên ngậm họng, và thuốc kháng sinh nếu cần. Nhớ uống nhiều nước và nghỉ ngơi đầy đủ nhé.';
  }

  if (lowerMessage.includes('dị ứng') || lowerMessage.includes('ngứa') || lowerMessage.includes('mẩn đỏ')) {
    if (hasProducts) {
      return `Triệu chứng dị ứng như ngứa, mẩn đỏ cần được điều trị kịp thời. Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} phù hợp bao gồm thuốc kháng histamin và kem bôi. Bạn có thể xem và mua bên dưới. Nếu triệu chứng nghiêm trọng, vui lòng đến cơ sở y tế ngay.`;
    }
    return 'Triệu chứng dị ứng như ngứa, mẩn đỏ có thể được điều trị bằng thuốc kháng histamin. Tôi sẽ gợi ý một số sản phẩm phù hợp. Nếu triệu chứng nghiêm trọng, vui lòng đến cơ sở y tế ngay.';
  }

  if (lowerMessage.includes('đau khớp') || lowerMessage.includes('viêm khớp') || lowerMessage.includes('xương khớp')) {
    if (hasProducts) {
      return `Tôi hiểu bạn đang gặp vấn đề về xương khớp. Đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} bao gồm thuốc giảm đau, thực phẩm chức năng hỗ trợ xương khớp, và các sản phẩm chống viêm. Bạn có thể xem và mua trực tiếp bên dưới.`;
    }
    return 'Đau khớp có thể do nhiều nguyên nhân như viêm khớp, thoái hóa khớp. Tôi gợi ý các loại thuốc giảm đau và chống viêm, cùng với thực phẩm chức năng hỗ trợ xương khớp.';
  }

  if (lowerMessage.includes('mất ngủ') || lowerMessage.includes('ngủ không ngon') || lowerMessage.includes('khó ngủ')) {
    if (hasProducts) {
      return `Mất ngủ ảnh hưởng đến sức khỏe tổng thể. Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} hỗ trợ giấc ngủ tự nhiên và an toàn. Bạn có thể xem và mua bên dưới. Đồng thời, hãy tạo thói quen ngủ đều giờ và tránh caffeine trước khi ngủ nhé.`;
    }
    return 'Mất ngủ ảnh hưởng đến sức khỏe tổng thể. Tôi có thể gợi ý các sản phẩm hỗ trợ giấc ngủ tự nhiên. Đồng thời, bạn nên tạo thói quen ngủ đều giờ và tránh caffeine trước khi ngủ.';
  }

  if (lowerMessage.includes('trẻ em') || lowerMessage.includes('cho con') || lowerMessage.includes('bé') || lowerMessage.includes('trẻ nhỏ')) {
    if (hasProducts) {
      return `Đối với trẻ em, việc sử dụng thuốc cần đặc biệt cẩn trọng. Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} dành riêng cho trẻ em với liều lượng phù hợp. Bạn có thể xem chi tiết bên dưới. Lưu ý: Luôn tham khảo bác sĩ trước khi dùng thuốc cho trẻ nhé.`;
    }
    return 'Đối với trẻ em, việc sử dụng thuốc cần đặc biệt cẩn trọng. Tôi sẽ gợi ý các sản phẩm dành riêng cho trẻ em với liều lượng phù hợp. Luôn tham khảo bác sĩ trước khi dùng thuốc cho trẻ nhé.';
  }

  if (lowerMessage.includes('da') || lowerMessage.includes('mụn') || lowerMessage.includes('nám') || lowerMessage.includes('chăm sóc da')) {
    if (hasProducts) {
      return `Vấn đề về da cần được chăm sóc đúng cách. Tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm' : 'một số sản phẩm'} chăm sóc da phù hợp với bạn. Bạn có thể xem chi tiết và mua trực tiếp bên dưới. Nhớ bảo vệ da khỏi ánh nắng mặt trời nhé!`;
    }
    return 'Vấn đề về da như mụn, nám cần được chăm sóc đúng cách. Tôi có các sản phẩm chăm sóc da, kem trị mụn, và sản phẩm làm đẹp da. Bạn cũng nên bảo vệ da khỏi ánh nắng mặt trời.';
  }

  // Generic product search - if products found
  if (hasProducts) {
    return `Dựa trên yêu cầu của bạn, tôi đã tìm thấy ${exactMatchCount > 0 ? exactMatchCount + ' sản phẩm phù hợp' : 'một số sản phẩm liên quan'}. Bạn có thể xem chi tiết, thêm vào giỏ hàng và đặt mua trực tiếp. Nếu bạn cần tư vấn thêm, hãy cho tôi biết nhé!`;
  }

  // Default response - no products found
  return 'Cảm ơn bạn đã hỏi! Tôi là trợ lý AI của nhà thuốc, có thể giúp bạn tư vấn về thuốc và sức khỏe. Hãy mô tả cụ thể triệu chứng hoặc sản phẩm bạn đang tìm kiếm để tôi có thể hỗ trợ tốt nhất. Ví dụ: "Thuốc ho cho trẻ em", "Vitamin C tăng đề kháng", "Miếng dán giảm đau lưng"...';
};

/**
 * Search for relevant products based on message keywords
 * Returns both exact matches and related products
 */
const searchRelevantProducts = async (message, customerId) => {
  try {
    const lowerMessage = message.toLowerCase();
    const keywords = extractKeywords(lowerMessage);

    console.log('🔍 Extracted keywords:', keywords);

    if (keywords.length === 0) {
      return { exactMatches: [], relatedProducts: [] };
    }

    // Separate primary keywords (symptoms/conditions) and secondary keywords (product types)
    const { primaryKeywords, secondaryKeywords } = categorizeKeywords(keywords, lowerMessage);
    
    console.log('🎯 Primary keywords:', primaryKeywords);
    console.log('📦 Secondary keywords:', secondaryKeywords);

    // Search for exact matches - products matching ALL primary keywords
    let exactMatches = [];
    if (primaryKeywords.length > 0) {
      const exactSearchConditions = primaryKeywords.map(keyword => ({
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ]
      }));

      exactMatches = await prisma.products.findMany({
        where: {
          AND: exactSearchConditions
        },
        include: {
          productunits: true,
          categories: true
        },
        take: 5,
        orderBy: [
          { sold_count: 'desc' },
          { created_at: 'desc' }
        ]
      });
    }

    // Search for related products - products matching ANY keyword (but not in exact matches)
    const exactMatchIds = exactMatches.map(p => p.id);
    const allKeywords = [...primaryKeywords, ...secondaryKeywords];
    
    const relatedSearchConditions = allKeywords.map(keyword => ({
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ]
    }));

    const relatedProducts = await prisma.products.findMany({
      where: {
        AND: [
          { id: { notIn: exactMatchIds } },
          { OR: relatedSearchConditions }
        ]
      },
      include: {
        productunits: true,
        categories: true
      },
      take: 5,
      orderBy: [
        { sold_count: 'desc' },
        { created_at: 'desc' }
      ]
    });

    console.log(`✅ Found ${exactMatches.length} exact matches, ${relatedProducts.length} related products`);

    // Format products for response
    return {
      exactMatches: formatProducts(exactMatches),
      relatedProducts: formatProducts(relatedProducts)
    };

  } catch (error) {
    console.error('❌ Search products error:', error);
    return { exactMatches: [], relatedProducts: [] };
  }
};

/**
 * Format products for API response - Đầy đủ thông tin như API mẫu
 */
const formatProducts = (products) => {
  return products.map(product => {
    const defaultUnit = product.productunits?.[0];
    const categoryName = product.categories?.name || null;
    const categoryId = product.category_id || null;
    
    // Parse FAQ nếu có
    let faq = [];
    if (product.faq) {
      try {
        faq = typeof product.faq === 'string' ? JSON.parse(product.faq) : product.faq;
      } catch (e) {
        faq = [];
      }
    }
    
    return {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: parseFloat(defaultUnit?.price || product.price || '0'),
      unit: defaultUnit?.unit_name || 'Đơn vị',
      sku: `P${product.id}`,
      image_url: product.image_url || null,
      images: product.images || [],
      brand: product.brand || null,
      manufacturer: product.manufacturer || null,
      producer: product.producer || product.manufacturer || null,
      manufactor: product.manufactor || null,
      usage: product.usage || null,
      dosage: product.dosage || null,
      specification: product.specification || null,
      adverse_effect: product.adverseEffect || null,
      regist_num: product.registNum || null,
      legal_declaration: product.legalDeclaration || null,
      faq: faq,
      prescription_required: product.prescription_required || false,
      category_id: categoryId,
      category_name: categoryName,
      sold_count: product.sold_count || 0,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  });
};

/**
 * Categorize keywords into primary (symptoms) and secondary (product types)
 */
const categorizeKeywords = (keywords, message) => {
  const primaryKeywords = [];
  const secondaryKeywords = [];

  // Symptom/condition keywords are primary - Bao gồm tất cả body parts
  const symptomKeywords = [
    'đau lưng', 'đau đầu', 'đau bụng', 'đau khớp', 'đau họng', 'đau dạ dày',
    'đau tay', 'đau chân', 'đau vai', 'đau cổ', 'đau cơ', 'nhức mỏi', 'đau nhức',
    'sốt', 'ho', 'cảm', 'cúm', 'dị ứng', 'ngứa', 'mất ngủ', 'mệt mỏi',
    'viêm', 'nhiễm trùng', 'tiêu chảy', 'táo bón', 'căng cơ', 'bong gân'
  ];

  // Product type keywords are secondary
  const productKeywords = [
    'miếng dán', 'thuốc', 'viên', 'siro', 'kem', 'gel', 'xịt',
    'vitamin', 'giảm đau', 'hạ sốt', 'kháng sinh'
  ];

  keywords.forEach(keyword => {
    if (symptomKeywords.some(s => keyword.includes(s) || s.includes(keyword))) {
      primaryKeywords.push(keyword);
    } else if (productKeywords.some(p => keyword.includes(p) || p.includes(keyword))) {
      secondaryKeywords.push(keyword);
    } else {
      // Default to primary if not categorized
      primaryKeywords.push(keyword);
    }
  });

  // If no primary keywords, use secondary as primary
  if (primaryKeywords.length === 0 && secondaryKeywords.length > 0) {
    return { primaryKeywords: secondaryKeywords, secondaryKeywords: [] };
  }

  return { primaryKeywords, secondaryKeywords };
};

/**
 * Extract relevant keywords from message
 */
const extractKeywords = (message) => {
  console.log('🔎 [extractKeywords] Input message:', message);
  const keywords = [];

  // Medical condition keywords - EXPANDED
  const conditions = [
    // Pain
    'đau lưng', 'đau đầu', 'đau bụng', 'đau họng', 'đau khớp', 'đau cơ', 
    'đau dạ dày', 'đau răng', 'đau vai', 'đau cổ', 'đau chân', 'đau tay',
    'nhức đầu', 'nhức mỏi', 'đau nhức',
    // Cold/Flu
    'cảm cúm', 'cảm', 'sốt', 'hắt hơi', 'sổ mũi', 'nghẹt mũi',
    // Respiratory
    'ho', 'viêm họng', 'viêm phế quản', 'hen suyễn', 'khó thở',
    // Digestive
    'tiêu hóa', 'táo bón', 'tiêu chảy', 'đầy hơi', 'khó tiêu', 'ợ chua',
    // Allergy
    'dị ứng', 'ngứa', 'mẩn đỏ', 'phát ban', 'nổi mề đay',
    // Joint/Bone
    'viêm khớp', 'thoái hóa khớp', 'xương khớp', 'loãng xương',
    // Sleep
    'mất ngủ', 'ngủ không ngon', 'khó ngủ', 'stress', 'căng thẳng',
    // Fatigue
    'mệt mỏi', 'suy nhược', 'thiếu máu', 'chóng mặt',
    // Skin
    'da', 'mụn', 'nám', 'trắng da', 'khô da', 'viêm da',
    // Eye
    'mắt', 'khô mắt', 'mỏi mắt', 'viêm kết mạc',
    // Women health
    'kinh nguyệt', 'đau bụng kinh', 'tiền mãn kinh'
  ];

  // Product type keywords - EXPANDED
  const productTypes = [
    'vitamin', 'thuốc', 'kháng sinh', 'giảm đau', 'hạ sốt',
    'men vi sinh', 'bổ sung', 'năng lượng', 'đề kháng',
    'kem', 'xịt', 'viên', 'siro', 'miếng dán', 'cao dán',
    'dầu', 'gel', 'nước súc miệng', 'nước muối',
    'collagen', 'omega', 'canxi', 'sắt', 'kẽm',
    'probiotics', 'enzyme', 'tinh dầu'
  ];

  // Age group keywords
  const ageGroups = [
    'trẻ em', 'người già', 'bà bầu', 'cho con', 'trẻ sơ sinh', 
    'người lớn', 'thanh thiếu niên', 'phụ nữ', 'nam giới'
  ];

  // Check for multi-word keywords first (longer matches have priority)
  const allKeywords = [...conditions, ...productTypes, ...ageGroups];
  allKeywords.sort((a, b) => b.length - a.length); // Sort by length descending

  allKeywords.forEach(keyword => {
    if (message.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return [...new Set(keywords)]; // Remove duplicates
};
