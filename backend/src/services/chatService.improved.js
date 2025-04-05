import Chat from '../models/Chat'; // Import the Chat model

// Utility function to handle errors
const handleError = (operation, error) => {
  console.error(`Error in ${operation}:`, error);
  return { error: 'Ocorreu um erro. Tente novamente mais tarde.' };
};

// Create a new chat between two users for a specific announcement
export const createChat = async (userId1, userId2, announcementId, announcementTitle) => {
  try {
    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [userId1, userId2] },
      announcement: announcementId
    });

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const chatData = new Chat({
      participants: [userId1, userId2],
      announcement: announcementId,
      lastMessage: null,
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      }
    });

    await chatData.save();
    return chatData;
  } catch (error) {
    return handleError('createChat', error);
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, text) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error('Chat not found');

    // Create a message object
    const messageData = {
      senderId,
      text,
      createdAt: new Date(),
      read: false
    };

    // Update chat with last message and unread count
    chat.lastMessage = text;
    chat.unreadCount[senderId] = (chat.unreadCount[senderId] || 0) + 1;
    await chat.save();

    return messageData;
  } catch (error) {
    return handleError('sendMessage', error);
  }
};

// Get messages for a specific chat
export const getMessages = async (chatId) => {
  try {
    const chat = await Chat.findById(chatId).populate('messages');
    return chat.messages || [];
  } catch (error) {
    handleError('getMessages', error);
    return [];
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.unreadCount[userId] = 0;
      await chat.save();
      return true;
    }
    return false;
  } catch (error) {
    handleError('markMessagesAsRead', error);
    return false;
  }
};

// Get all chats for a user
export const getUserChats = async (userId) => {
  try {
    const chats = await Chat.find({ participants: userId });
    return chats;
  } catch (error) {
    handleError('getUserChats', error);
    return [];
  }
};

// Get total unread messages count for a user
export const getTotalUnreadCount = async (userId) => {
  try {
    const chats = await Chat.find({ participants: userId });
    return chats.reduce((total, chat) => total + (chat.unreadCount[userId] || 0), 0);
  } catch (error) {
    handleError('getTotalUnreadCount', error);
    return 0;
  }
};
