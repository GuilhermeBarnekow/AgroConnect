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
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import { reviewsAPI, uploadAPI } from '../services/api';
import FormInput from '../components/FormInput';
import CustomButton from '../components/CustomButton';
import LoadingIndicator from '../components/LoadingIndicator';

const ProfileScreen = ({ route, navigation }) => {
  // Check if editing profile
  const editMode = route.params?.screen === 'EditProfile';
  const changePasswordMode = route.params?.screen === 'ChangePassword';

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Edit profile state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // Auth context
  const { user, logout, updateProfile, changePassword, refreshUser } = useAuth();

  // Set initial values
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setLocation(user.location || '');
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // Fetch reviews
  useEffect(() => {
    if (!editMode && !changePasswordMode && user) {
      fetchReviews();
    }
  }, [editMode, changePasswordMode, user]);

  // Request camera permissions
  useEffect(() => {
    if (editMode) {
      (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão Necessária',
            'Precisamos de permissão para acessar suas fotos para que você possa atualizar sua foto de perfil.'
          );
        }
      })();
    }
  }, [editMode]);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      const response = await reviewsAPI.getReceivedReviews({ limit: 5 });
      setReviews(response.data.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};

    // Validate name
    if (!name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Validate phone (optional)
    if (phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(phone)) {
      newErrors.phone = 'Telefone inválido. Use o formato (99) 99999-9999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};

    // Validate current password
    if (!currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }

    // Validate new password
    if (!newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Nova senha deve ter pelo menos 6 caracteres';
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle pick image
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        setIsUploading(true);

        try {
          // In a real app, you would upload the image to a server
          // For this prototype, we'll simulate an upload
          const imageUrl = await uploadAPI.uploadImage(
            `data:image/jpeg;base64,${selectedImage.base64}`
          );

          // Set profile image
          setProfileImage(imageUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Erro', 'Erro ao fazer upload da imagem. Tente novamente.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem. Tente novamente.');
    }
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        name,
        phone: phone || undefined,
        location: location || undefined,
        profileImage: profileImage || undefined,
      });

      if (result.success) {
        Alert.alert(
          'Sucesso',
          'Perfil atualizado com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ general: 'Erro ao atualizar perfil. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        Alert.alert(
          'Sucesso',
          'Senha alterada com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setPasswordErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({ general: 'Erro ao alterar senha. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setShowLogoutModal(false);
    
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Erro', 'Erro ao fazer logout. Tente novamente.');
    }
  };

  // Render edit profile screen
  if (editMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile image */}
          <View style={styles.profileImageContainer}>
            {isUploading ? (
              <View style={styles.profileImagePlaceholder}>
                <LoadingIndicator size="small" />
              </View>
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageInitial}>
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handlePickImage}
              disabled={isUploading}
            >
              <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <FormInput
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              icon="person"
              error={errors.name}
            />

            <FormInput
              label="Telefone (opcional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="(99) 99999-9999"
              keyboardType="phone-pad"
              icon="phone"
              error={errors.phone}
            />

            <FormInput
              label="Localização (opcional)"
              value={location}
              onChangeText={setLocation}
              placeholder="Sua cidade/estado"
              icon="location-on"
              error={errors.location}
            />

            <CustomButton
              title="Salvar Alterações"
              onPress={handleUpdateProfile}
              isLoading={isLoading}
              style={styles.saveButton}
            />

            <CustomButton
              title="Cancelar"
              onPress={() => navigation.goBack()}
              type="outline"
              disabled={isLoading}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render change password screen
  if (changePasswordMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Form */}
          <View style={styles.formContainer}>
            {passwordErrors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{passwordErrors.general}</Text>
              </View>
            )}

            <FormInput
              label="Senha Atual"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Sua senha atual"
              secureTextEntry
              icon="lock"
              error={passwordErrors.currentPassword}
            />

            <FormInput
              label="Nova Senha"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Sua nova senha"
              secureTextEntry
              icon="lock-outline"
              error={passwordErrors.newPassword}
            />

            <FormInput
              label="Confirmar Nova Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme sua nova senha"
              secureTextEntry
              icon="lock-outline"
              error={passwordErrors.confirmPassword}
            />

            <CustomButton
              title="Alterar Senha"
              onPress={handleChangePassword}
              isLoading={isLoading}
              style={styles.saveButton}
            />

            <CustomButton
              title="Cancelar"
              onPress={() => navigation.goBack()}
              type="outline"
              disabled={isLoading}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render profile screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshUser}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageInitial}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          
          <Text style={styles.profileName}>{user.name}</Text>
          
          <View style={styles.profileTypeContainer}>
            <Text style={styles.profileTypeText}>
              {user.userType === 'produtor' ? 'Produtor' : 'Técnico'}
            </Text>
          </View>
          
          <View style={styles.profileRatingContainer}>
            <MaterialIcons name="star" size={20} color="#FFC107" />
            <Text style={styles.profileRatingText}>
              {user.rating.toFixed(1)}
            </Text>
            <Text style={styles.profileReviewCountText}>
              ({user.reviewCount} avaliações)
            </Text>
          </View>
          
          {user.location && (
            <View style={styles.profileLocationContainer}>
              <MaterialIcons name="location-on" size={16} color="#757575" />
              <Text style={styles.profileLocationText}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Profile actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <MaterialIcons name="edit" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <MaterialIcons name="lock" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Alterar Senha</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowLogoutModal(true)}
          >
            <MaterialIcons name="exit-to-app" size={24} color="#F44336" />
            <Text style={[styles.actionText, styles.logoutText]}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews */}
        <View style={styles.reviewsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avaliações Recebidas</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('UserReviews', { userId: user.id })}
            >
              <Text style={styles.seeAllText}>Ver Todas</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <LoadingIndicator size="small" />
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
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
                    
                    <View style={styles.reviewRatingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialIcons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-border'}
                          size={16}
                          color="#FFC107"
                        />
                      ))}
                    </View>
                  </View>
                  
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>
              Você ainda não recebeu avaliações.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Logout modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sair</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja sair da sua conta?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.modalConfirmButtonText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Import RefreshControl
import { RefreshControl } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#757575',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  profileTypeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  profileTypeText: {
    fontSize: 12,
    color: '#757575',
  },
  profileRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileRatingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginLeft: 4,
  },
  profileReviewCountText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  profileLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLocationText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  actionsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  actionText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 16,
  },
  logoutText: {
    color: '#F44336',
  },
  reviewsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  reviewItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  reviewRatingContainer: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  reviewComment: {
    fontSize: 14,
    color: '#212121',
    marginTop: 8,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: '#212121',
  },
  modalConfirmButton: {
    backgroundColor: '#F44336',
  },
  modalConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
