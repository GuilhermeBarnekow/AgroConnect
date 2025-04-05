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
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import LoadingIndicator from '../components/LoadingIndicator';
import { getUserChats } from '../services/chatService.unified';

const ChatsListScreen = ({ navigation }) => {
  // Estado
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Contexto de autenticação
  const { user } = useAuth();

  // Verificar status da rede
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected);
      } catch (error) {
        console.error('Erro ao verificar status da rede:', error);
        setIsConnected(true); // Assumir conectado por padrão
      }
    };

    checkConnection();

    // Inscrever-se para mudanças no status da rede
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Inscrever-se para chats do usuário
  useEffect(() => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = getUserChats(user.id, (fetchedChats) => {
      setChats(fetchedChats);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Lidar com atualização
  const handleRefresh = () => {
    if (!isConnected) {
      Alert.alert(
        'Sem conexão',
        'Você está offline. Conecte-se à internet para atualizar as conversas.'
      );
      return;
    }
    
    setIsRefreshing(true);
    // O listener atualizará automaticamente quando novos dados estiverem disponíveis
    // Se nenhum novo dado chegar em 5 segundos, parar de atualizar
    setTimeout(() => {
      setIsRefreshing(false);
    }, 5000);
  };

  // Formatar data
  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    
    // Se for hoje, mostrar hora
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
    
    // Se for ontem, mostrar "Ontem"
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      yesterday.getDate() === messageDate.getDate() &&
      yesterday.getMonth() === messageDate.getMonth() &&
      yesterday.getFullYear() === messageDate.getFullYear()
    ) {
      return 'Ontem';
    }
    
    // Se for este ano, mostrar dia e mês
    if (now.getFullYear() === messageDate.getFullYear()) {
      return messageDate.toLocaleDateString([], {
        day: '2-digit',
        month: '2-digit',
      });
    }
    
    // Caso contrário, mostrar data
    return messageDate.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Lidar com pressionar chat
  const handleChatPress = (chat) => {
    const otherUserId = chat.participants.find(id => id !== user.id);
    
    navigation.navigate('Chat', {
      userId: otherUserId,
      title: chat.announcementTitle || 'Chat',
      announcementId: chat.announcementId,
      announcementTitle: chat.announcementTitle,
      chatId: chat.id,
    });
  };

  // Renderizar item de chat
  const renderChatItem = ({ item }) => {
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
  };

  // Renderizar status de conexão
  const renderConnectionStatus = () => {
    if (isConnected) return null;
    
    return (
      <View style={styles.connectionStatus}>
        <MaterialIcons name="signal-wifi-off" size={16} color="#FFF" />
        <Text style={styles.connectionStatusText}>Sem conexão - Mostrando conversas salvas</Text>
      </View>
    );
  };

  // Renderizar componente vazio
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color="#BDBDBD" />
      <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
      <Text style={styles.emptySubtitle}>
        Suas conversas aparecerão aqui quando você iniciar um chat com outros usuários.
      </Text>
      
      {!isConnected && (
        <View style={styles.offlineNotice}>
          <MaterialIcons name="signal-wifi-off" size={16} color="#F44336" />
          <Text style={styles.offlineText}>
            Você está offline. Conecte-se à internet para ver suas conversas.
          </Text>
        </View>
      )}
    </View>
  );

  // Renderizar estado de carregamento
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderConnectionStatus()}
      
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
  connectionStatus: {
    backgroundColor: '#F44336',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
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
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  offlineText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
  },
});

export default ChatsListScreen;
