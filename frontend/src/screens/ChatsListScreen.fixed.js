import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import LoadingIndicator from '../components/LoadingIndicator';
import { getUserChats } from '../services/chatService.fixed';

const ChatsListScreen = ({ navigation }) => {
  // State
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Auth context
  const { user } = useAuth();

  // Subscribe to user chats
  useEffect(() => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }

    try {
      const unsubscribe = getUserChats(user.id, (fetchedChats) => {
        setChats(fetchedChats);
        setIsLoading(false);
        setIsRefreshing(false);
        setError(null);
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error('Error setting up chats listener:', err);
      setError('Não foi possível carregar as conversas');
      setIsLoading(false);
      setIsRefreshing(false);
      return () => {};
    }
  }, [user]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // The listener will automatically update when new data is available
    // If no new data comes in 5 seconds, stop refreshing
    setTimeout(() => {
      setIsRefreshing(false);
    }, 5000);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';
    
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
    
    // If yesterday, show "Ontem"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      yesterday.getDate() === messageDate.getDate() &&
      yesterday.getMonth() === messageDate.getMonth() &&
      yesterday.getFullYear() === messageDate.getFullYear()
    ) {
      return 'Ontem';
    }
    
    // If this year, show day and month
    if (now.getFullYear() === messageDate.getFullYear()) {
      return messageDate.toLocaleDateString([], {
        day: '2-digit',
        month: '2-digit',
      });
    }
    
    // Otherwise, show date
    return messageDate.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Handle chat press
  const handleChatPress = (chat) => {
    try {
      const otherUserId = chat.participants.find(id => id !== user.id);
      
      navigation.navigate('Chat', {
        userId: otherUserId,
        title: chat.announcementTitle || 'Chat',
        announcementId: chat.announcementId,
        announcementTitle: chat.announcementTitle,
        chatId: chat.id,
      });
    } catch (err) {
      console.error('Error navigating to chat:', err);
      Alert.alert('Erro', 'Não foi possível abrir a conversa');
    }
  };

  // Render chat item
  const renderChatItem = ({ item }) => {
    try {
      const otherUserId = item.participants.find(id => id !== user.id);
      const unreadCount = item.unreadCount && item.unreadCount[user.id] ? item.unreadCount[user.id] : 0;
      
      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => handleChatPress(item)}
        >
          <View style={styles.chatAvatar}>
            <MaterialIcons name="person" size={24} color="#757575" />
          </View>
          
          <View style={styles.chatContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {item.announcementTitle || 'Conversa'}
              </Text>
              <Text style={styles.chatTime}>
                {formatDate(item.lastMessageTime)}
              </Text>
            </View>
            
            <View style={styles.chatPreview}>
              <Text style={styles.chatMessage} numberOfLines={1}>
                {item.lastMessage || 'Nenhuma mensagem ainda'}
              </Text>
              
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    } catch (err) {
      console.error('Error rendering chat item:', err);
      return (
        <View style={styles.errorItem}>
          <Text style={styles.errorText}>Erro ao carregar conversa</Text>
        </View>
      );
    }
  };

  // Render empty component
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color="#BDBDBD" />
      <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
      <Text style={styles.emptySubtitle}>
        Suas conversas aparecerão aqui quando você iniciar um chat com outros usuários.
      </Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  // Render loading state
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
  },
  errorItem: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    margin: 8,
    alignItems: 'center',
  },
});

export default ChatsListScreen;
