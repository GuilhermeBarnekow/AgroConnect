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
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.unified';

// Função utilitária para tratar erros
const handleError = (operation, error) => {
  console.error(`Erro em ${operation}:`, error);
  
  // Verificar se é um erro de rede
  if (error.code === 'unavailable' || error.code === 'network-request-failed') {
    return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
  }
  
  // Verificar se é um erro de permissão
  if (error.code === 'permission-denied') {
    return { error: 'Você não tem permissão para realizar esta operação.' };
  }
  
  // Erro genérico
  return { error: 'Ocorreu um erro. Tente novamente mais tarde.' };
};

// Criar um novo chat entre dois usuários para um anúncio específico
export const createChat = async (userId1, userId2, announcementId, announcementTitle) => {
  try {
    // Verificar se o chat já existe
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
    
    // Criar novo chat com um ID específico para melhor suporte offline
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
    
    // Usar setDoc com um ID específico em vez de addDoc para melhor suporte offline
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

// Enviar uma mensagem em um chat
export const sendMessage = async (chatId, senderId, text) => {
  try {
    // Gerar um ID único para a mensagem
    const messageId = `${chatId}_${senderId}_${Date.now()}`;
    const messageData = {
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false,
      pending: false
    };
    
    // Usar setDoc com um ID específico em vez de addDoc para melhor suporte offline
    await setDoc(doc(db, `chats/${chatId}/messages`, messageId), messageData);
    
    // Obter documento do chat
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    
    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      
      // Obter o outro participante
      const otherParticipant = chatData.participants.find(id => id !== senderId);
      
      // Atualizar contagem de não lidos para o outro participante
      const unreadCount = {
        ...chatData.unreadCount,
        [otherParticipant]: (chatData.unreadCount[otherParticipant] || 0) + 1
      };
      
      // Atualizar última mensagem no chat
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

// Obter mensagens para um chat específico
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
        console.error('Erro ao obter mensagens:', error);
        // Continuar com mensagens vazias em vez de falhar completamente
        callback([]);
      }
    );
  } catch (error) {
    console.error('Erro ao configurar listener de mensagens:', error);
    // Retornar uma função de unsubscribe fictícia
    return () => {};
  }
};

// Marcar mensagens como lidas
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

// Obter todos os chats para um usuário
export const getUserChats = (userId, callback) => {
  try {
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
        
        // Ordenar manualmente após receber os dados
        chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        
        callback(chats);
      },
      (error) => {
        console.error('Erro ao obter chats:', error);
        // Continuar com chats vazios em vez de falhar completamente
        callback([]);
      }
    );
  } catch (error) {
    console.error('Erro ao configurar listener de chats:', error);
    // Retornar uma função de unsubscribe fictícia
    return () => {};
  }
};

// Obter contagem total de mensagens não lidas para um usuário
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
        console.error('Erro ao obter contagem não lida:', error);
        // Padrão para 0 mensagens não lidas em caso de erro
        callback(0);
      }
    );
  } catch (error) {
    console.error('Erro ao configurar listener de contagem não lida:', error);
    // Retornar uma função de unsubscribe fictícia
    callback(0);
    return () => {};
  }
};
