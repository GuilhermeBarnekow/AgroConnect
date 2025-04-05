import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Card component for displaying announcement information
 * 
 * @param {object} announcement - Announcement data
 * @param {function} onPress - Function to call when card is pressed
 * @param {boolean} showUserInfo - Whether to show user info
 * @param {object} style - Additional style for the card
 */
const AnnouncementCard = ({ announcement, onPress, showUserInfo = true, style }) => {
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

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {announcement.images && announcement.images.length > 0 ? (
          <Image
            source={{ uri: announcement.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons
              name={getCategoryIcon(announcement.category)}
              size={40}
              color="#BDBDBD"
            />
          </View>
        )}
        
        {/* Category badge */}
        <View style={styles.categoryBadge}>
          <MaterialIcons
            name={getCategoryIcon(announcement.category)}
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.categoryText}>{announcement.category}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {announcement.title}
        </Text>
        
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={14} color="#757575" />
          <Text style={styles.locationText} numberOfLines={1}>
            {announcement.location}
          </Text>
        </View>
        
        <Text style={styles.price}>{formatPrice(announcement.price)}</Text>
        
        {announcement.acceptCounterOffers && (
          <View style={styles.counterOfferBadge}>
            <Text style={styles.counterOfferText}>Aceita contrapropostas</Text>
          </View>
        )}
        
        {/* User info */}
        {showUserInfo && announcement.user && (
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
              
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={14} color="#FFC107" />
                <Text style={styles.ratingText}>
                  {announcement.user.rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewCountText}>
                  ({announcement.user.reviewCount})
                </Text>
              </View>
            </View>
            
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>
                {announcement.user.userType === 'produtor' ? 'Produtor' : 'Técnico'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    width: width - 32,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
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
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
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
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  counterOfferBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  counterOfferText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  userImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
  },
  userInfo: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 2,
  },
  reviewCountText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 2,
  },
  userTypeBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userTypeText: {
    fontSize: 10,
    color: '#757575',
  },
});

export default AnnouncementCard;
