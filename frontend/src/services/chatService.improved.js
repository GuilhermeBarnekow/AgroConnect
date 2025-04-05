import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.improved';

// Utility function to handle errors
const handleError = (operation, error) => {
  console.error(`Error in ${operation}:`, error);
  
  // Check if it's a network error
  if (error.code === 'unavailable' || error.code === 'network-request-failed') {
    return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
  }
  
  return { error: 'Ocorreu um erro. Tente novamente mais tarde.' };
};

// Create a new chat between two users for a specific announcement
export const createChat = async (userId1, userId2, announcementId, announcementTitle) => {
  try {
    // Check if chat already exists
    const chatQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId1)
    );
    
    const querySnapshot = await getDocs(chatQuery);
    let existingChat = null;
    
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participants.includes(userId2) && chatData.announcementId === announcementId) {
        existingChat = { id: doc.id, ...chatData };
      }
    });
    
    if (existingChat) {
      return existingChat;
    }
    
    // Create new chat with a specific ID for better offline support
    const chatId = `${userId1}_${userId2}_${announcementId}`;
    const chatData = {
      participants: [userId1, userId2],
      announcementId,
      announcementTitle,
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: serverTimestamp(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      }
    };
    
    // Use setDoc with a specific ID instead of addDoc for better offline support
    await setDoc(doc(db, 'chats', chatId), chatData);
    
    return {
      id: chatId,
      ...chatData,
      createdAt: new Date(),
      lastMessageTime: new Date()
    };
  } catch (error) {
    return handleError('createChat', error);
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, text) => {
  try {
    // Generate a unique ID for the message
    const messageId = `${chatId}_${senderId}_${Date.now()}`;
    const messageData = {
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false,
      pending: false
    };
    
    // Use setDoc with a specific ID instead of addDoc for better offline support
    await setDoc(doc(db, `chats/${chatId}/messages`, messageId), messageData);
    
    // Get chat document
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      
      // Get the other participant
      const otherParticipant = chatData.participants.find(id => id !== senderId);
      
      // Update unread count for the other participant
      const unreadCount = {
        ...chatData.unreadCount,
        [otherParticipant]: (chatData.unreadCount[otherParticipant] || 0) + 1
      };
      
      // Update last message in chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastSenderId: senderId,
        unreadCount
      });
    }
    
    return {
      id: messageId,
      senderId,
      text,
      createdAt: new Date(),
      read: false,
      pending: false
    };
  } catch (error) {
    return handleError('sendMessage', error);
  }
};

// Get messages for a specific chat
export const getMessages = (chatId, callback) => {
  try {
    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(
      messagesQuery, 
      (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        });
        callback(messages);
      },
      (error) => {
        console.error('Error getting messages:', error);
        // Continue with empty messages rather than failing completely
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up messages listener:', error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatDocRef);
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      const unreadCount = { ...chatData.unreadCount, [userId]: 0 };
      
      await updateDoc(chatDocRef, { unreadCount });
      return true;
    }
    return false;
  } catch (error) {
    handleError('markMessagesAsRead', error);
    return false;
  }
};

// Get all chats for a user
export const getUserChats = (userId, callback) => {
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    
    return onSnapshot(
      chatsQuery, 
      (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          chats.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastMessageTime: data.lastMessageTime?.toDate() || new Date()
          });
        });
        callback(chats);
      },
      (error) => {
        console.error('Error getting chats:', error);
        // Continue with empty chats rather than failing completely
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up chats listener:', error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};

// Get total unread messages count for a user
export const getTotalUnreadCount = (userId, callback) => {
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );
    
    return onSnapshot(
      chatsQuery, 
      (snapshot) => {
        let totalUnread = 0;
        
        snapshot.forEach((doc) => {
          const chatData = doc.data();
          if (chatData.unreadCount && chatData.unreadCount[userId]) {
            totalUnread += chatData.unreadCount[userId];
          }
        });
        
        callback(totalUnread);
      },
      (error) => {
        console.error('Error getting unread count:', error);
        // Default to 0 unread messages on error
        callback(0);
      }
    );
  } catch (error) {
    console.error('Error setting up unread count listener:', error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};
