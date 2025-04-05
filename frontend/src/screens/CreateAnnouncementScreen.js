import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { announcementsAPI, uploadAPI } from '../services/api';
import FormInput from '../components/FormInput';
import CustomButton from '../components/CustomButton';
import LoadingIndicator from '../components/LoadingIndicator';

const CreateAnnouncementScreen = ({ route, navigation }) => {
  // Check if editing existing announcement
  const editMode = route.params?.announcement !== undefined;
  const existingAnnouncement = route.params?.announcement;

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [acceptCounterOffers, setAcceptCounterOffers] = useState(true);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Categories
  const categories = [
    { id: 'Maquinário', name: 'Maquinário', icon: 'agriculture' },
    { id: 'Consultoria', name: 'Consultoria', icon: 'person-search' },
    { id: 'Serviços', name: 'Serviços', icon: 'handyman' },
    { id: 'Insumos', name: 'Insumos', icon: 'inventory' },
    { id: 'Outros', name: 'Outros', icon: 'category' },
  ];

  // Set initial values if editing
  useEffect(() => {
    if (editMode && existingAnnouncement) {
      setTitle(existingAnnouncement.title);
      setDescription(existingAnnouncement.description);
      setPrice(existingAnnouncement.price.toString());
      setLocation(existingAnnouncement.location);
      setCategory(existingAnnouncement.category);
      setImages(existingAnnouncement.images || []);
      setAcceptCounterOffers(existingAnnouncement.acceptCounterOffers);
    }
  }, [editMode, existingAnnouncement]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos para que você possa adicionar imagens ao anúncio.'
        );
      }
    })();
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate title
    if (!title) {
      newErrors.title = 'Título é obrigatório';
    } else if (title.length < 5) {
      newErrors.title = 'Título deve ter pelo menos 5 caracteres';
    }

    // Validate description
    if (!description) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (description.length < 20) {
      newErrors.description = 'Descrição deve ter pelo menos 20 caracteres';
    }

    // Validate price
    if (!price) {
      newErrors.price = 'Preço é obrigatório';
    } else if (parseFloat(price) <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    // Validate location
    if (!location) {
      newErrors.location = 'Localização é obrigatória';
    }

    // Validate category
    if (!category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle pick image
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Check if already have 5 images
        if (images.length >= 5) {
          Alert.alert('Limite Atingido', 'Você pode adicionar no máximo 5 imagens.');
          return;
        }

        setIsUploading(true);

        try {
          // In a real app, you would upload the image to a server
          // For this prototype, we'll simulate an upload
          const imageUrl = await uploadAPI.uploadImage(
            `data:image/jpeg;base64,${selectedImage.base64}`
          );

          // Add image URL to images array
          setImages((prevImages) => [...prevImages, imageUrl]);
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

  // Handle remove image
  const handleRemoveImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // Handle save announcement
  const handleSaveAnnouncement = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const announcementData = {
        title,
        description,
        price: parseFloat(price),
        location,
        category,
        images,
        acceptCounterOffers,
      };

      if (editMode) {
        // Update announcement
        await announcementsAPI.updateAnnouncement(
          existingAnnouncement.id,
          announcementData
        );

        Alert.alert(
          'Sucesso',
          'Anúncio atualizado com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Create announcement
        await announcementsAPI.createAnnouncement(announcementData);

        Alert.alert(
          'Sucesso',
          'Anúncio criado com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.error || 'Erro ao salvar anúncio. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Form */}
          <View style={styles.formContainer}>
            <FormInput
              label="Título"
              value={title}
              onChangeText={setTitle}
              placeholder="Título do anúncio"
              error={errors.title}
            />

            <FormInput
              label="Descrição"
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva seu produto ou serviço em detalhes"
              multiline
              error={errors.description}
            />

            <FormInput
              label="Preço"
              value={price}
              onChangeText={setPrice}
              placeholder="0,00"
              keyboardType="numeric"
              error={errors.price}
            />

            <FormInput
              label="Localização"
              value={location}
              onChangeText={setLocation}
              placeholder="Cidade/Estado"
              error={errors.location}
            />

            {/* Category selection */}
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.categoryItem,
                    category === item.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => setCategory(item.id)}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={category === item.id ? '#4CAF50' : '#757575'}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      category === item.id && styles.categoryTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}

            {/* Images */}
            <Text style={styles.label}>Imagens (máx. 5)</Text>
            <View style={styles.imagesContainer}>
              {/* Add image button */}
              {images.length < 5 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handlePickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <LoadingIndicator size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="add-photo-alternate" size={24} color="#757575" />
                      <Text style={styles.addImageText}>Adicionar</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Image previews */}
              {images.map((image, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Accept counter offers */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Aceitar contrapropostas</Text>
              <Switch
                value={acceptCounterOffers}
                onValueChange={setAcceptCounterOffers}
                trackColor={{ false: '#E0E0E0', true: 'rgba(76, 175, 80, 0.4)' }}
                thumbColor={acceptCounterOffers ? '#4CAF50' : '#BDBDBD'}
              />
            </View>

            {/* Save button */}
            <CustomButton
              title={editMode ? 'Atualizar Anúncio' : 'Criar Anúncio'}
              onPress={handleSaveAnnouncement}
              isLoading={isLoading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#757575',
  },
  categoryTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: -12,
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 14,
    color: '#212121',
  },
  saveButton: {
    marginTop: 8,
  },
});

export default CreateAnnouncementScreen;
