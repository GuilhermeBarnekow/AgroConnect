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
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

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
    
    // Create new chat
    const chatRef = await addDoc(collection(db, 'chats'), {
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
    });
    
    return {
      id: chatRef.id,
      participants: [userId1, userId2],
      announcementId,
      announcementTitle,
      createdAt: new Date(),
      lastMessage: null,
      lastMessageTime: new Date(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      }
    };
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, text) => {
  try {
    // Add message to the messages subcollection
    const messageRef = await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false
    });
    
    // Get chat document
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
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
    
    return {
      id: messageRef.id,
      senderId,
      text,
      createdAt: new Date(),
      read: false
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
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
          messages.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          });
        });
        callback(messages);
      },
      (error) => {
        console.error('Error getting messages:', error);
        // Return empty messages to avoid infinite loading
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up messages listener:', error);
    // Return a dummy unsubscribe function
    callback([]);
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
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    // Don't throw the error to avoid crashing the app
  }
};

// Get all chats for a user
export const getUserChats = (userId, callback) => {
  try {
    // Query without orderBy to avoid issues with null fields
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
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
        
        // Sort manually after receiving the data
        chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        
        callback(chats);
      },
      (error) => {
        console.error('Error getting chats:', error);
        // Return empty chats to avoid infinite loading
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up chats listener:', error);
    // Return a dummy unsubscribe function
    callback([]);
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
    callback(0);
    return () => {};
  }
};
