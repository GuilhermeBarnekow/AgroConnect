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
import { 
  createChat, 
  sendMessage, 
  getMessages, 
  markMessagesAsRead 
} from '../services/chatService.fixed';

const ChatScreen = ({ route, navigation }) => {
  // Get params from route
  const { userId: otherUserId, title, announcementId, announcementTitle } = route.params;

  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatId, setChatId] = useState(null);
  const [otherUser, setOtherUser] = useState({
    id: otherUserId,
    name: title,
    profileImage: null,
  });
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const flatListRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Auth context
  const { user } = useAuth();

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create or get existing chat
        const chat = await createChat(
          user.id, 
          otherUserId, 
          announcementId,
          announcementTitle || title
        );
        
        setChatId(chat.id);
        
        // Subscribe to messages
        unsubscribeRef.current = getMessages(chat.id, (fetchedMessages) => {
          setMessages(fetchedMessages);
          setIsLoading(false);
        });
        
        // Mark messages as read when entering the chat
        await markMessagesAsRead(chat.id, user.id);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Não foi possível carregar a conversa. Tente novamente mais tarde.');
        setIsLoading(false);
      }
    };
    
    initializeChat();
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user.id, otherUserId, announcementId, title, announcementTitle]);

  // Mark messages as read when the component is focused
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', async () => {
      if (chatId) {
        try {
          await markMessagesAsRead(chatId, user.id);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    });
    
    return unsubscribeFocus;
  }, [navigation, chatId, user.id]);

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
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId) {
      return;
    }
    
    const messageText = newMessage.trim();
    setNewMessage('');
    
    // Create a temporary message to show immediately
    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: user.id,
      text: messageText,
      createdAt: new Date(),
      read: false,
      pending: true,
    };
    
    // Add to messages for immediate display
    setMessages([...messages, tempMessage]);
    
    try {
      setIsSending(true);
      
      // Send the message
      await sendMessage(chatId, user.id, messageText);
      
      // The message will be updated via the subscription
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Erro',
        'Não foi possível enviar a mensagem. Tente novamente mais tarde.'
      );
      
      // Remove the temporary message
      setMessages(messages.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setIsSending(false);
    }
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

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
                  Inicie uma conversa com {otherUser.name}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatScreen;
