import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import LoadingIndicator from '../components/LoadingIndicator';

// Dados de exemplo para evitar dependência do Firestore
const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: 'user2',
    text: 'Olá, o produto ainda está disponível?',
    createdAt: new Date(Date.now() - 3600000), // 1 hora atrás
    read: true
  },
  {
    id: '2',
    senderId: 'user1',
    text: 'Sim, está disponível. Qual quantidade você precisa?',
    createdAt: new Date(Date.now() - 3500000), // 58 minutos atrás
    read: true
  },
  {
    id: '3',
    senderId: 'user2',
    text: 'Estou interessado em 50kg. Qual o preço?',
    createdAt: new Date(Date.now() - 3400000), // 56 minutos atrás
    read: true
  },
  {
    id: '4',
    senderId: 'user1',
    text: 'R$ 10,00 por kg. Posso fazer um desconto para essa quantidade.',
    createdAt: new Date(Date.now() - 3300000), // 55 minutos atrás
    read: true
  }
];

const ChatScreen = ({ route, navigation }) => {
  // Get params from route
  const { userId: otherUserId, title, announcementId, announcementTitle } = route.params;

  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Refs
  const flatListRef = useRef(null);

  // Auth context
  const { user } = useAuth();

  // Carregar mensagens simuladas
  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      // Substituir IDs de usuário de exemplo pelo ID real
      const updatedMessages = MOCK_MESSAGES.map(msg => {
        const updatedMsg = { ...msg };
        if (user && user.id) {
          updatedMsg.senderId = msg.senderId === 'user1' ? user.id : msg.senderId;
        }
        return updatedMsg;
      });
      
      setMessages(updatedMessages);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If today, show time
    if (
      now.getDate() === messageDate.getDate() &&
      now.getMonth() === messageDate.getMonth() &&
      now.getFullYear() === messageDate.getFullYear()
    ) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    // If yesterday, show "Ontem" and time
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      yesterday.getDate() === messageDate.getDate() &&
      yesterday.getMonth() === messageDate.getMonth() &&
      yesterday.getFullYear() === messageDate.getFullYear()
    ) {
      return `Ontem ${messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    
    // Otherwise, show date and time
    return messageDate.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      return;
    }
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    
    // Simular envio de mensagem
    setTimeout(() => {
      const newMsg = {
        id: `msg_${Date.now()}`,
        senderId: user.id,
        text: messageText,
        createdAt: new Date(),
        read: false
      };
      
      setMessages([...messages, newMsg]);
      setIsSending(false);
    }, 500);
  };

  // Render message item
  const renderMessageItem = ({ item }) => {
    const isMyMessage = item.senderId === user.id;
    const isPending = item.pending;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            isPending && styles.pendingMessageBubble,
          ]}
        >
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatDate(item.createdAt)}
            </Text>
            
            {isPending && (
              <MaterialIcons name="access-time" size={12} color="rgba(255, 255, 255, 0.7)" style={styles.pendingIcon} />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render loading state
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info-outline" size={16} color="#2196F3" />
          <Text style={styles.infoText}>
            Modo de demonstração: Os dados exibidos são simulados.
          </Text>
        </View>
        
        {/* Chat messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length === 0 ? (
              <View style={styles.chatHeader}>
                <Text style={styles.chatHeaderText}>
                  Inicie uma conversa com {title}
                </Text>
                <Text style={styles.chatHeaderSubtext}>
                  As mensagens são sincronizadas em tempo real.
                </Text>
              </View>
            ) : null
          }
        />

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#9E9E9E"
            multiline
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons
                name="send"
                size={24}
                color={!newMessage.trim() ? '#BDBDBD' : '#FFFFFF'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 8,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 8,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chatHeader: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  chatHeaderText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  chatHeaderSubtext: {
    fontSize: 12,
    color: '#757575',
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  pendingMessageBubble: {
    backgroundColor: '#78C37F',
  },
  messageText: {
    fontSize: 14,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#212121',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#757575',
  },
  pendingIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    color: '#212121',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
});

export default ChatScreen;
