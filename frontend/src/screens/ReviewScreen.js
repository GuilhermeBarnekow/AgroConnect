import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { reviewsAPI } from '../services/api';
import FormInput from '../components/FormInput';
import CustomButton from '../components/CustomButton';
import LoadingIndicator from '../components/LoadingIndicator';

const ReviewScreen = ({ route, navigation }) => {
  // Get offer ID from route params
  const { offerId } = route.params || {};
  
  // Log para depuração
  console.log('ReviewScreen - offerId:', offerId);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewedUser, setReviewedUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  // Check if user can review
  useEffect(() => {
    const checkCanReview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await reviewsAPI.checkCanReview(offerId);
        const { canReview, reviewedUser, reason } = response.data.data;

        setCanReview(canReview);
        setReviewedUser(reviewedUser);

        if (!canReview) {
          setError(reason);
        }
      } catch (error) {
        console.error('Error checking review permission:', error);
        setError(
          error.response?.data?.error ||
            'Erro ao verificar permissão para avaliação. Tente novamente.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkCanReview();
  }, [offerId]);

  // Handle rating change
  const handleRatingChange = (value) => {
    setRating(value);
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);

      await reviewsAPI.createReview({
        offerId,
        rating,
        comment: comment.trim() || undefined,
      });

      Alert.alert(
        'Sucesso',
        'Avaliação enviada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Erro ao enviar avaliação. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
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
        <MaterialIcons name="error-outline" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Não é possível avaliar</Text>
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton
          title="Voltar"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Avaliar</Text>
          <Text style={styles.subtitle}>
            Compartilhe sua experiência com {reviewedUser.name}
          </Text>
        </View>

        {/* User info */}
        <View style={styles.userContainer}>
          {reviewedUser.profileImage ? (
            <Image
              source={{ uri: reviewedUser.profileImage }}
              style={styles.userImage}
            />
          ) : (
            <View style={styles.userImagePlaceholder}>
              <Text style={styles.userInitial}>
                {reviewedUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{reviewedUser.name}</Text>
            
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeText}>
                {reviewedUser.userType === 'produtor' ? 'Produtor' : 'Técnico'}
              </Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#FFC107" />
              <Text style={styles.ratingText}>
                {reviewedUser.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCountText}>
                ({reviewedUser.reviewCount} avaliações)
              </Text>
            </View>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Sua avaliação:</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => handleRatingChange(value)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name={value <= rating ? 'star' : 'star-border'}
                  size={36}
                  color="#FFC107"
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingDescription}>
            {rating === 1
              ? 'Muito ruim'
              : rating === 2
              ? 'Ruim'
              : rating === 3
              ? 'Regular'
              : rating === 4
              ? 'Bom'
              : 'Excelente'}
          </Text>
        </View>

        {/* Comment */}
        <FormInput
          label="Comentário (opcional)"
          value={comment}
          onChangeText={setComment}
          placeholder="Compartilhe detalhes da sua experiência..."
          multiline
        />

        {/* Submit button */}
        <CustomButton
          title="Enviar Avaliação"
          onPress={handleSubmitReview}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  userImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#757575',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
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
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 200,
  },
});

export default ReviewScreen;
