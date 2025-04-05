import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { announcementsAPI } from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';
import LoadingIndicator from '../components/LoadingIndicator';
import CustomButton from '../components/CustomButton';

const HomeScreen = ({ navigation }) => {
  // State
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    userType: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Categories
  const categories = [
    { id: '', name: 'Todos' },
    { id: 'Maquinário', name: 'Maquinário' },
    { id: 'Consultoria', name: 'Consultoria' },
    { id: 'Serviços', name: 'Serviços' },
    { id: 'Insumos', name: 'Insumos' },
    { id: 'Outros', name: 'Outros' },
  ];

  // User types
  const userTypes = [
    { id: '', name: 'Todos' },
    { id: 'produtor', name: 'Produtor' },
    { id: 'técnico', name: 'Técnico' },
  ];

  // Fetch announcements
  const fetchAnnouncements = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else if (!refresh && !hasMore) {
        return;
      } else if (!refresh && !isLoading) {
        setIsLoading(true);
      }

      const currentPage = refresh ? 1 : page;
      const limit = 10;
      const offset = (currentPage - 1) * limit;

      // Build params
      const params = {
        limit,
        offset,
        status: 'active',
      };

      // Add search query
      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add filters
      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.location) {
        // Garantir que location seja enviado no formato correto
        // Se for um objeto, enviar como JSON, se for string, enviar como está
        if (typeof filters.location === 'object') {
          params.location = JSON.stringify(filters.location);
        } else {
          params.location = filters.location;
        }
      }

      if (filters.minPrice) {
        params.minPrice = parseFloat(filters.minPrice);
      }

      if (filters.maxPrice) {
        params.maxPrice = parseFloat(filters.maxPrice);
      }

      if (filters.userType) {
        params.userType = filters.userType;
      }

      console.log('Fetching announcements with params:', params);
      
      const response = await announcementsAPI.getAnnouncements(params);
      const { announcements: newAnnouncements, total } = response.data.data;

      console.log(`Received ${newAnnouncements.length} announcements, total: ${total}`);

      // Atualizar o estado com os novos anúncios
      if (refresh) {
        setAnnouncements(newAnnouncements);
      } else {
        setAnnouncements((prevAnnouncements) => [
          ...prevAnnouncements,
          ...newAnnouncements,
        ]);
      }

      // Corrigir a verificação de hasMore usando o callback para garantir o valor atualizado
      setHasMore(() => {
        const totalLoaded = refresh ? newAnnouncements.length : announcements.length + newAnnouncements.length;
        return totalLoaded < total;
      });
      
      // Increment page
      if (!refresh) {
        setPage((prevPage) => prevPage + 1);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      
      // Melhorar a mensagem de erro com base no tipo de erro
      if (!error.response) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.response.status === 500) {
        setError('Erro no servidor. Por favor, tente novamente mais tarde.');
      } else {
        setError(error.response?.data?.error || 'Erro ao carregar anúncios. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch announcements on mount and when filters change
  useEffect(() => {
    fetchAnnouncements(true);
  }, [filters]);

  // Refresh announcements when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements(true);
    }, [])
  );

  // Handle refresh
  const handleRefresh = () => {
    fetchAnnouncements(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchAnnouncements();
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchAnnouncements(true);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      userType: '',
    });
    setShowFilters(false);
  };

  // Handle announcement press
  const handleAnnouncementPress = (announcement) => {
    navigation.navigate('AnnouncementDetail', { id: announcement.id });
  };

  // Handle create announcement
  const handleCreateAnnouncement = () => {
    navigation.navigate('CreateAnnouncement');
  };

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        filters.category === item.id && styles.categoryItemSelected,
      ]}
      onPress={() => handleFilterChange('category', item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          filters.category === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render announcement item
  const renderAnnouncementItem = ({ item }) => (
    <AnnouncementCard
      announcement={item}
      onPress={() => handleAnnouncementPress(item)}
    />
  );

  // Render empty component
  const renderEmptyComponent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="search-off" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>Nenhum anúncio encontrado</Text>
        <Text style={styles.emptySubtext}>
          {error ? error : "Tente ajustar os filtros ou criar um novo anúncio"}
        </Text>
        <CustomButton
          title="Criar Anúncio"
          onPress={handleCreateAnnouncement}
          style={styles.createButton}
        />
        {error && (
          <CustomButton
            title="Tentar Novamente"
            onPress={handleRefresh}
            type="outline"
            style={[styles.createButton, { marginTop: 10 }]}
          />
        )}
      </View>
    );
  };

  // Render footer component
  const renderFooterComponent = () => {
    if (!isLoading || announcements.length === 0) {
      return null;
    }

    return (
      <View style={styles.footerContainer}>
        <LoadingIndicator size="small" />
        <Text style={styles.loadingMoreText}>Carregando mais anúncios...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AgroConnect</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateAnnouncement}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar anúncios"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                fetchAnnouncements(true);
              }}
            >
              <MaterialIcons name="clear" size={20} color="#757575" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialIcons
            name="filter-list"
            size={24}
            color={showFilters || Object.values(filters).some(Boolean) ? '#4CAF50' : '#757575'}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Preço:</Text>
            <View style={styles.priceInputContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={filters.minPrice}
                onChangeText={(value) => handleFilterChange('minPrice', value)}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={filters.maxPrice}
                onChangeText={(value) => handleFilterChange('maxPrice', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Localização:</Text>
            <TextInput
              style={styles.locationInput}
              placeholder="Cidade/Estado"
              value={filters.location}
              onChangeText={(value) => handleFilterChange('location', value)}
            />
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Tipo de Usuário:</Text>
            <View style={styles.userTypeContainer}>
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.userTypeItem,
                    filters.userType === type.id && styles.userTypeItemSelected,
                  ]}
                  onPress={() => handleFilterChange('userType', type.id)}
                >
                  <Text
                    style={[
                      styles.userTypeText,
                      filters.userType === type.id && styles.userTypeTextSelected,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={handleClearFilters}
          >
            <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id || 'all'}
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesList}
        contentContainerStyle={styles.categoriesContent}
      />

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
          ListFooterComponent={renderFooterComponent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
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
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
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
    color: '#4CAF50',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#212121',
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  priceSeparator: {
    marginHorizontal: 8,
    color: '#757575',
  },
  locationInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  userTypeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  userTypeItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    alignItems: 'center',
  },
  userTypeItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  userTypeText: {
    fontSize: 12,
    color: '#757575',
  },
  userTypeTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#F44336',
  },
  categoriesList: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryItemSelected: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
    color: '#757575',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  announcementsContent: {
    padding: 16,
    paddingBottom: 80,
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

export default HomeScreen;
