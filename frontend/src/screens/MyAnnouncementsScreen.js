import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { announcementsAPI } from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';
import LoadingIndicator from '../components/LoadingIndicator';
import CustomButton from '../components/CustomButton';

const MyAnnouncementsScreen = ({ navigation }) => {
  // State
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  // Fetch announcements
  const fetchAnnouncements = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (!isLoading) {
        setIsLoading(true);
      }

      const params = {
        status: activeTab,
      };

      const response = await announcementsAPI.getUserAnnouncements(params);
      setAnnouncements(response.data.data.announcements);
      setError(null);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Erro ao carregar anúncios. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch announcements on mount and when tab changes
  useEffect(() => {
    fetchAnnouncements();
  }, [activeTab]);

  // Refresh announcements when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements(true);
    }, [activeTab])
  );

  // Handle refresh
  const handleRefresh = () => {
    fetchAnnouncements(true);
  };

  // Handle announcement press
  const handleAnnouncementPress = (announcement) => {
    navigation.navigate('AnnouncementDetail', { id: announcement.id });
  };

  // Handle create announcement
  const handleCreateAnnouncement = () => {
    navigation.navigate('CreateAnnouncement');
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = (announcement) => {
    Alert.alert(
      'Excluir Anúncio',
      'Tem certeza que deseja excluir este anúncio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await announcementsAPI.deleteAnnouncement(announcement.id);
              fetchAnnouncements();
              Alert.alert('Sucesso', 'Anúncio excluído com sucesso!');
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert(
                'Erro',
                error.response?.data?.error || 'Erro ao excluir anúncio. Tente novamente.'
              );
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render announcement item
  const renderAnnouncementItem = ({ item }) => (
    <View style={styles.announcementItemContainer}>
      <AnnouncementCard
        announcement={item}
        onPress={() => handleAnnouncementPress(item)}
        showUserInfo={false}
      />
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditAnnouncement', { announcement: item })}
        >
          <MaterialIcons name="edit" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAnnouncement(item)}
        >
          <MaterialIcons name="delete" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty component
  const renderEmptyComponent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="post-add" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>Nenhum anúncio encontrado</Text>
        <Text style={styles.emptySubtext}>
          Você ainda não possui anúncios {activeTab === 'active' ? 'ativos' : activeTab === 'completed' ? 'concluídos' : 'cancelados'}
        </Text>
        {activeTab === 'active' && (
          <CustomButton
            title="Criar Anúncio"
            onPress={handleCreateAnnouncement}
            style={styles.createButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Anúncios</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateAnnouncement}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.activeTabText,
            ]}
          >
            Ativos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}
          >
            Concluídos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'cancelled' && styles.activeTabText,
            ]}
          >
            Cancelados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Announcements list */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <CustomButton
            title="Tentar Novamente"
            onPress={handleRefresh}
            type="outline"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncementItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.announcementsContent}
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  announcementsContent: {
    padding: 16,
    paddingBottom: 80,
  },
  announcementItemContainer: {
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    width: 200,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    width: 200,
  },
});

export default MyAnnouncementsScreen;
