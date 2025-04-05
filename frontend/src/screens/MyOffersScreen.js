import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { offersAPI } from '../services/api';
import { useAuth } from '../services/authContext';
import LoadingIndicator from '../components/LoadingIndicator';
import CustomButton from '../components/CustomButton';

const MyOffersScreen = ({ route, navigation }) => {
  const announcementId = route.params?.announcementId;
  const offerId = route.params?.offerId;
  const { user } = useAuth();

  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('sent');

  // Estados para o modal de contraproposta
  const [modalVisible, setModalVisible] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Limpa os campos da contraproposta quando o modal for fechado
  useEffect(() => {
    if (!modalVisible) {
      setCounterPrice('');
      setCounterMessage('');
    }
  }, [modalVisible]);

  const fetchOffers = async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const params = { status: activeTab !== 'all' ? activeTab : undefined };
      let response;

      if (offerId) {
        response = await offersAPI.getOfferById(offerId);
        setOffers([response.data.data.offer]);
      } else if (announcementId) {
        response = await offersAPI.getAnnouncementOffers(announcementId, params);
        setOffers(response.data.data.offers);
      } else {
        response =
          viewMode === 'received'
            ? await offersAPI.getReceivedOffers(params)
            : await offersAPI.getUserOffers(params);
        setOffers(response.data.data.offers);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Erro ao carregar ofertas. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [activeTab, viewMode, announcementId, offerId]);

  useFocusEffect(
    useCallback(() => {
      fetchOffers(true);
    }, [activeTab, viewMode, announcementId, offerId])
  );

  const handleRefresh = () => fetchOffers(true);

  const handleUpdateOfferStatus = async (offer, status) => {
    try {
      setIsLoading(true);
      await offersAPI.updateOfferStatus(offer.id, status);
      await fetchOffers();
      const successMessage =
        status === 'accepted'
          ? 'Oferta aceita com sucesso!'
          : status === 'rejected'
          ? 'Oferta rejeitada com sucesso!'
          : status === 'completed'
          ? 'Negociação concluída com sucesso!'
          : 'Status atualizado com sucesso!';
      Alert.alert('Sucesso', successMessage);
    } catch (err) {
      console.error('Error updating offer status:', err);
      Alert.alert(
        'Erro',
        err.response?.data?.error || 'Erro ao atualizar status da oferta. Tente novamente.'
      );
      setIsLoading(false);
    }
  };

  const handleReview = (offer) => navigation.navigate('Review', { offerId: offer.id });

  const handleChat = (offer) => {
    const isMyOffer = offer.userId === user.id;
    const otherUser =
      isMyOffer && offer.announcement?.user
        ? offer.announcement.user
        : offer.user || { id: 0, name: 'Usuário não disponível' };

    navigation.navigate('Chat', {
      userId: otherUser.id,
      title: otherUser.name,
      announcementId: offer.announcementId,
    });
  };

  const handleCounterOffer = (offer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const submitCounterOffer = async () => {
    try {
      // Converter o preço de formato brasileiro (vírgula) para formato internacional (ponto)
      const formattedPrice = counterPrice.replace(',', '.');
      
      console.log('Enviando contraproposta:', {
        id: selectedOffer.id,
        price: formattedPrice,
        message: counterMessage,
      });
      
      await offersAPI.counterOffer(selectedOffer.id, {
        price: formattedPrice,
        message: counterMessage,
      });
      
      Alert.alert('Sucesso', 'Contraproposta enviada com sucesso!');
      setModalVisible(false);
      fetchOffers();
    } catch (err) {
      console.error('Error submitting counter offer:', err);
      Alert.alert('Erro', 'Erro ao enviar contraproposta. Tente novamente.');
    }
  };

  const formatPrice = (price) =>
    price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceita';
      case 'rejected':
        return 'Rejeitada';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  const renderOfferItem = ({ item: offer }) => {
    const isMyOffer = offer.userId === user.id;
    const canReview =
      offer.status === 'completed' &&
      ((isMyOffer && !offer.buyerReviewed) || (!isMyOffer && !offer.sellerReviewed));

    return (
      <View style={styles.offerCard}>
        <TouchableOpacity
          style={styles.announcementContainer}
          onPress={() => navigation.navigate('AnnouncementDetail', { id: offer.announcementId })}
        >
          {offer.announcement?.images?.length > 0 ? (
            <Image source={{ uri: offer.announcement.images[0] }} style={styles.announcementImage} />
          ) : (
            <View style={styles.announcementImagePlaceholder}>
              <MaterialIcons name="image" size={24} color="#BDBDBD" />
            </View>
          )}
          <View style={styles.announcementInfo}>
            <Text style={styles.announcementTitle} numberOfLines={1}>
              {offer.announcement?.title || 'Anúncio não disponível'}
            </Text>
            <Text style={styles.announcementPrice}>
              {offer.announcement ? formatPrice(offer.announcement.price) : '-'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.offerDetails}>
          <View style={styles.offerRow}>
            <Text style={styles.offerLabel}>Preço Oferecido:</Text>
            <Text style={styles.offerPrice}>{formatPrice(offer.price)}</Text>
          </View>
          <View style={styles.offerRow}>
            <Text style={styles.offerLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(offer.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(offer.status) }]}>
                {getStatusText(offer.status)}
              </Text>
            </View>
          </View>
          {offer.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Mensagem:</Text>
              <Text style={styles.messageText}>{offer.message}</Text>
            </View>
          )}
        </View>

        <View style={styles.userContainer}>
          {isMyOffer ? (
            <>
              <Text style={styles.userLabel}>Anunciante:</Text>
              <View style={styles.userInfo}>
                {offer.announcement?.user ? (
                  <>
                    {offer.announcement.user.profileImage ? (
                      <Image
                        source={{ uri: offer.announcement.user.profileImage }}
                        style={styles.userImage}
                      />
                    ) : (
                      <View style={styles.userImagePlaceholder}>
                        <Text style={styles.userInitial}>
                          {offer.announcement.user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.userName}>{offer.announcement.user.name}</Text>
                  </>
                ) : (
                  <Text style={styles.userName}>Usuário não disponível</Text>
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.userLabel}>Ofertante:</Text>
              <View style={styles.userInfo}>
                {offer.user ? (
                  <>
                    {offer.user.profileImage ? (
                      <Image source={{ uri: offer.user.profileImage }} style={styles.userImage} />
                    ) : (
                      <View style={styles.userImagePlaceholder}>
                        <Text style={styles.userInitial}>
                          {offer.user.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.userName}>{offer.user.name}</Text>
                  </>
                ) : (
                  <Text style={styles.userName}>Usuário não disponível</Text>
                )}
              </View>
            </>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {!isMyOffer && offer.status === 'pending' && (
            <View style={styles.actionRow}>
              <CustomButton
                title="Aceitar"
                onPress={() => handleUpdateOfferStatus(offer, 'accepted')}
                style={styles.actionButton}
              />
              <CustomButton
                title="Rejeitar"
                onPress={() => handleUpdateOfferStatus(offer, 'rejected')}
                type="danger"
                style={styles.actionButton}
              />
            </View>
          )}
          {offer.status === 'accepted' && (
            <CustomButton
              title="Marcar como Concluído"
              onPress={() => handleUpdateOfferStatus(offer, 'completed')}
              style={styles.actionButton}
            />
          )}
          {canReview && (
            <CustomButton
              title="Avaliar"
              onPress={() => handleReview(offer)}
              style={styles.actionButton}
            />
          )}
          {(offer.status === 'pending' || offer.status === 'counteroffered') && (
            <CustomButton
              title="Contraproposta"
              onPress={() => handleCounterOffer(offer)}
              type="outline"
              style={styles.actionButton}
            />
          )}
          <CustomButton
            title="Chat"
            onPress={() => handleChat(offer)}
            type="outline"
            style={styles.actionButton}
          />
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="local-offer" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>Nenhuma oferta encontrada</Text>
        <Text style={styles.emptySubtext}>
          {announcementId
            ? 'Este anúncio ainda não recebeu ofertas'
            : 'Você ainda não possui ofertas'}
        </Text>
      </View>
    );
  };

  const screenTitle = announcementId
    ? 'Ofertas do Anúncio'
    : offerId
    ? 'Detalhes da Oferta'
    : 'Minhas Ofertas';

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho e modo de visualização */}
      {!announcementId && !offerId && (
        <View style={styles.header}>
          <Text style={styles.title}>{screenTitle}</Text>
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'sent' && styles.activeViewMode]}
              onPress={() => setViewMode('sent')}
            >
              <Text style={[styles.viewModeText, viewMode === 'sent' && styles.activeViewModeText]}>
                Enviadas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'received' && styles.activeViewMode]}
              onPress={() => setViewMode('received')}
            >
              <Text style={[styles.viewModeText, viewMode === 'received' && styles.activeViewModeText]}>
                Recebidas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Abas de filtro */}
      {!offerId && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pendentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
            onPress={() => setActiveTab('accepted')}
          >
            <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
              Aceitas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Concluídas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de ofertas */}
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
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.offersContent}
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

      {/* Modal de contraproposta */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contraproposta</Text>
            <Text style={styles.modalLabel}>Valor (R$):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 500,00 ou 500.00"
              keyboardType="numeric"
              value={counterPrice}
              onChangeText={setCounterPrice}
            />
            <Text style={styles.modalLabel}>Mensagem:</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Descreva sua contraproposta..."
              multiline
              numberOfLines={4}
              value={counterMessage}
              onChangeText={setCounterMessage}
            />
            <View style={styles.modalActions}>
              <CustomButton
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                type="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Enviar"
                onPress={submitCounterOffer}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  viewModeContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 4,
    overflow: 'hidden',
  },
  viewModeButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  activeViewMode: { backgroundColor: '#4CAF50' },
  viewModeText: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  activeViewModeText: { color: '#FFFFFF' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4CAF50' },
  tabText: { fontSize: 14, color: '#757575' },
  activeTabText: { color: '#4CAF50', fontWeight: '500' },
  offersContent: { padding: 16, paddingBottom: 80 },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementContainer: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  announcementImage: { width: 60, height: 60, borderRadius: 4 },
  announcementImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  announcementTitle: { fontSize: 16, fontWeight: '500', color: '#212121', marginBottom: 4 },
  announcementPrice: { fontSize: 14, color: '#757575' },
  offerDetails: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  offerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  offerLabel: { fontSize: 14, color: '#757575' },
  offerPrice: { fontSize: 16, fontWeight: '500', color: '#4CAF50' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  messageContainer: { marginTop: 8 },
  messageLabel: { fontSize: 14, color: '#757575', marginBottom: 4 },
  messageText: { fontSize: 14, color: '#212121' },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  userLabel: { fontSize: 14, color: '#757575', marginRight: 8 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userImage: { width: 24, height: 24, borderRadius: 12 },
  userImagePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: { fontSize: 12, fontWeight: 'bold', color: '#757575' },
  userName: { fontSize: 14, color: '#212121', marginLeft: 8 },
  actionsContainer: { padding: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { marginBottom: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '500', color: '#212121', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#757575', textAlign: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#F44336', textAlign: 'center', marginBottom: 16 },
  retryButton: { width: 200 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, color: '#757575', marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  modalTextArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalButton: { flex: 1, marginHorizontal: 5 },
});

export default MyOffersScreen;
