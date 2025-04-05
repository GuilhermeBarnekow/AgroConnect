import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import { announcementsAPI, offersAPI } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';
import CustomButton from '../components/CustomButton';

const AnnouncementDetailScreen = ({ route, navigation }) => {
  // Get announcement ID from route params
  const { id } = route.params;

  // State
  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auth context
  const { user } = useAuth();

  // Fetch announcement
  const fetchAnnouncement = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await announcementsAPI.getAnnouncementById(id);
      setAnnouncement(response.data.data.announcement);
    } catch (error) {
      console.error('Error fetching announcement:', error);
      setError('Erro ao carregar anúncio. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch announcement on mount
  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  // Format price to BRL currency
  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Maquinário':
        return 'agriculture';
      case 'Consultoria':
        return 'person-search';
      case 'Serviços':
        return 'handyman';
      case 'Insumos':
        return 'inventory';
      case 'Outros':
      default:
        return 'category';
    }
  };

  // Handle make offer
  const handleMakeOffer = () => {
    if (announcement.userId === user.id) {
      Alert.alert(
        'Erro',
        'Você não pode fazer uma oferta para seu próprio anúncio.'
      );
      return;
    }

    setOfferPrice(announcement.price.toString());
    setOfferMessage('');
    setShowOfferModal(true);
  };

  // Handle submit offer
  const handleSubmitOffer = async () => {
    // Validate price
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um preço válido.');
      return;
    }

    try {
      setIsSubmittingOffer(true);

      await offersAPI.createOffer({
        announcementId: announcement.id,
        price: parseFloat(offerPrice),
        message: offerMessage.trim() || undefined,
      });

      setShowOfferModal(false);
      Alert.alert(
        'Sucesso',
        'Sua oferta foi enviada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting offer:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Erro ao enviar oferta. Tente novamente.'
      );
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Handle contact seller
  const handleContactSeller = () => {
    if (announcement.userId === user.id) {
      Alert.alert(
        'Erro',
        'Este é o seu próprio anúncio.'
      );
      return;
    }

    navigation.navigate('Chat', {
      userId: announcement.user.id,
      title: announcement.user.name,
      announcementId: announcement.id,
    });
  };

  // Handle edit announcement
  const handleEditAnnouncement = () => {
    navigation.navigate('EditAnnouncement', { announcement });
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = () => {
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
              Alert.alert(
                'Sucesso',
                'Anúncio excluído com sucesso!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
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

  // Handle view offers
  const handleViewOffers = () => {
    navigation.navigate('AnnouncementOffers', { announcementId: announcement.id });
  };

  // Handle next image
  const handleNextImage = () => {
    if (announcement.images && announcement.images.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === announcement.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Handle previous image
  const handlePrevImage = () => {
    if (announcement.images && announcement.images.length > 0) {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? announcement.images.length - 1 : prevIndex - 1
      );
    }
  };

  // Render loading state
  if (isLoading) {
    return <LoadingIndicator />;
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton
          title="Tentar Novamente"
          onPress={fetchAnnouncement}
          type="outline"
          style={styles.retryButton}
        />
      </View>
    );
  }

  // Render announcement details
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Images */}
        <View style={styles.imageContainer}>
          {announcement.images && announcement.images.length > 0 ? (
            <>
              <Image
                source={{ uri: announcement.images[currentImageIndex] }}
                style={styles.image}
                resizeMode="cover"
              />
              {announcement.images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.prevButton]}
                    onPress={handlePrevImage}
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageNavButton, styles.nextButton]}
                    onPress={handleNextImage}
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.imageIndicators}>
                    {announcement.images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.imageIndicator,
                          index === currentImageIndex && styles.imageIndicatorActive,
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons
                name={getCategoryIcon(announcement.category)}
                size={64}
                color="#BDBDBD"
              />
            </View>
          )}
          
          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <MaterialIcons
              name={getCategoryIcon(announcement.category)}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.categoryText}>{announcement.category}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and price */}
          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.price}>{formatPrice(announcement.price)}</Text>

          {/* Location */}
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#757575" />
            <Text style={styles.locationText}>{announcement.location}</Text>
          </View>

          {/* Counter offers badge */}
          {announcement.acceptCounterOffers && (
            <View style={styles.counterOfferBadge}>
              <Text style={styles.counterOfferText}>Aceita contrapropostas</Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{announcement.description}</Text>
          </View>

          {/* User info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Anunciante</Text>
            <View style={styles.userContainer}>
              {announcement.user.profileImage ? (
                <Image
                  source={{ uri: announcement.user.profileImage }}
                  style={styles.userImage}
                />
              ) : (
                <View style={styles.userImagePlaceholder}>
                  <Text style={styles.userInitial}>
                    {announcement.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{announcement.user.name}</Text>
                
                <View style={styles.userTypeContainer}>
                  <Text style={styles.userTypeText}>
                    {announcement.user.userType === 'produtor' ? 'Produtor' : 'Técnico'}
                  </Text>
                </View>
                
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.ratingText}>
                    {announcement.user.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewCountText}>
                    ({announcement.user.reviewCount} avaliações)
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {announcement.userId === user.id ? (
              // Owner actions
              <>
                <CustomButton
                  title="Ver Ofertas"
                  onPress={handleViewOffers}
                  icon="local-offer"
                  style={styles.actionButton}
                />
                <View style={styles.actionRow}>
                  <CustomButton
                    title="Editar"
                    onPress={handleEditAnnouncement}
                    type="outline"
                    style={styles.actionButton}
                  />
                  <CustomButton
                    title="Excluir"
                    onPress={handleDeleteAnnouncement}
                    type="danger"
                    style={styles.actionButton}
                  />
                </View>
              </>
            ) : (
              // User actions
              <>
                <CustomButton
                  title="Fazer Oferta"
                  onPress={handleMakeOffer}
                  style={styles.actionButton}
                />
                <CustomButton
                  title="Entrar em Contato"
                  onPress={handleContactSeller}
                  type="outline"
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Offer modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fazer Oferta</Text>
              <TouchableOpacity
                onPress={() => setShowOfferModal(false)}
                disabled={isSubmittingOffer}
              >
                <MaterialIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Preço Oferecido:</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.priceInput}
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#9E9E9E"
              />
            </View>
            
            <Text style={styles.modalLabel}>Mensagem (opcional):</Text>
            <TextInput
              style={styles.messageInput}
              value={offerMessage}
              onChangeText={setOfferMessage}
              placeholder="Escreva uma mensagem para o vendedor..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <CustomButton
              title="Enviar Oferta"
              onPress={handleSubmitOffer}
              isLoading={isSubmittingOffer}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  imageIndicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  counterOfferBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  counterOfferText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  userImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#757575',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  userTypeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  userTypeText: {
    fontSize: 12,
    color: '#757575',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginBottom: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    height: 48,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#212121',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    height: 100,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AnnouncementDetailScreen;
