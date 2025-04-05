import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { reviewsAPI } from '../services/api';
import LoadingIndicator from '../components/LoadingIndicator';
import CustomButton from '../components/CustomButton';

const UserReviewsScreen = ({ route, navigation }) => {
  // Get user ID from route params
  const { userId } = route.params || {};
  
  // Log para depuração
  console.log('UserReviewsScreen - userId:', userId);

  // State
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reviews
  const fetchReviews = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (!isLoading) {
        setIsLoading(true);
      }

      const response = await reviewsAPI.getUserReviews(userId);
      setReviews(response.data.data.reviews);
      setError(null);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      setError(
        error.response?.data?.error ||
          'Erro ao carregar avaliações. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch reviews on mount
  useEffect(() => {
    fetchReviews();
  }, [userId]);

  // Handle refresh
  const handleRefresh = () => {
    fetchReviews(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Render review item
  const renderReviewItem = ({ item: review }) => {
    return (
      <View style={styles.reviewCard}>
        {/* Reviewer info */}
        <View style={styles.reviewerContainer}>
          {review.reviewer.profileImage ? (
            <Image
              source={{ uri: review.reviewer.profileImage }}
              style={styles.reviewerImage}
            />
          ) : (
            <View style={styles.reviewerImagePlaceholder}>
              <Text style={styles.reviewerInitial}>
                {review.reviewer.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
            
            <View style={styles.reviewerTypeContainer}>
              <Text style={styles.reviewerTypeText}>
                {review.reviewer.userType === 'produtor' ? 'Produtor' : 'Técnico'}
              </Text>
            </View>
            
            <Text style={styles.reviewDate}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <MaterialIcons
              key={star}
              name={star <= review.rating ? 'star' : 'star-border'}
              size={20}
              color="#FFC107"
              style={styles.starIcon}
            />
          ))}
        </View>

        {/* Comment */}
        {review.comment && (
          <Text style={styles.commentText}>{review.comment}</Text>
        )}

        {/* Announcement info */}
        {review.offer && review.offer.announcement && (
          <TouchableOpacity
            style={styles.announcementContainer}
            onPress={() =>
              navigation.navigate('AnnouncementDetail', {
                id: review.offer.announcement.id,
              })
            }
          >
            <MaterialIcons name="info-outline" size={16} color="#757575" />
            <Text style={styles.announcementText} numberOfLines={1}>
              Avaliação para: {review.offer.announcement.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render empty component
  const renderEmptyComponent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="star-border" size={64} color="#BDBDBD" />
        <Text style={styles.emptyText}>Nenhuma avaliação encontrada</Text>
        <Text style={styles.emptySubtext}>
          Este usuário ainda não recebeu avaliações
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Avaliações Recebidas</Text>
      </View>

      {/* Reviews list */}
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
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reviewsContent}
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
  reviewsContent: {
    padding: 16,
    paddingBottom: 80,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewerContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reviewerImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#757575',
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  reviewerTypeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  reviewerTypeText: {
    fontSize: 12,
    color: '#757575',
  },
  reviewDate: {
    fontSize: 12,
    color: '#757575',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starIcon: {
    marginRight: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 12,
    lineHeight: 20,
  },
  announcementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    padding: 8,
  },
  announcementText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
    flex: 1,
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

export default UserReviewsScreen;
