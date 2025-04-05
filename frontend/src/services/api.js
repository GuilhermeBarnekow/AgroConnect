import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API base URL - Configuração dinâmica
// Prioridade: 1. Variável de ambiente, 2. IP do servidor de produção, 3. IP local
const getApiUrl = () => {
  // Para ambiente de desenvolvimento, use o IP da máquina local
  // Para produção, use o servidor de produção
  if (__DEV__) {
    return 'http://192.168.0.109:3001/api'; // IP local atualizado
  }
  return 'http://34.121.43.244:3001/api'; // IP do servidor de produção
};

const API_URL = getApiUrl();
console.log('API URL:', API_URL);

// Create axios instance with improved configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return config;
    }
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Verificar se é um erro de rede (sem conexão)
    if (!error.response) {
      console.error('Erro de rede:', error);
      return Promise.reject({
        response: {
          status: 0,
          data: {
            status: 'error',
            error: 'Erro de conexão. Verifique sua internet e tente novamente.',
          },
        },
      });
    }

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // In a real app, you would redirect to login screen here
    }

    // Log detalhes do erro para depuração
    console.error('Erro na resposta:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register a new user
  register: (userData) => api.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
  
  // Update user profile
  updateProfile: (userData) => api.put('/auth/profile', userData),
  
  // Change password
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
};

// Announcements API
export const announcementsAPI = {
  // Get all announcements
  getAnnouncements: (params) => api.get('/announcements', { params }),
  
  // Get announcement by ID
  getAnnouncementById: (id) => api.get(`/announcements/${id}`),
  
  // Create announcement
  createAnnouncement: (announcementData) => api.post('/announcements', announcementData),
  
  // Update announcement
  updateAnnouncement: (id, announcementData) => api.put(`/announcements/${id}`, announcementData),
  
  // Delete announcement
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
  
  // Get user announcements
  getUserAnnouncements: (params) => api.get('/announcements/user/me', { params }),
};

// Offers API
export const offersAPI = {
  // Get all offers for an announcement
  getAnnouncementOffers: (announcementId, params) => 
    api.get(`/announcements/${announcementId}/offers`, { params }),
  
  // Get offer by ID
  getOfferById: (id) => api.get(`/offers/${id}`),
  
  // Create offer
  createOffer: (offerData) => api.post('/offers', offerData),
  
  // Update offer status
  updateOfferStatus: (id, status) => api.put(`/offers/${id}/status`, { status }),
  
  // Get user offers (sent)
  getUserOffers: (params) => api.get('/offers/user/me', { params }),
  
  // Get received offers
  getReceivedOffers: (params) => api.get('/offers/user/received', { params }),
  
  // Send counter offer
  counterOffer: (id, counterOfferData) => api.put(`/offers/${id}/counteroffer`, counterOfferData),
};

// Reviews API
export const reviewsAPI = {
  // Create review
  createReview: (reviewData) => api.post('/reviews', reviewData),
  
  // Get reviews for a user
  getUserReviews: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
  
  // Get received reviews
  getReceivedReviews: (params) => api.get('/reviews/received', { params }),
  
  // Check if can review
  checkCanReview: (offerId) => api.get(`/reviews/check/${offerId}`),
};

// Upload API
export const uploadAPI = {
  // Upload image
  uploadImage: async (base64Image) => {
    // In a real app, you would upload the image to a server
    // For this prototype, we'll simulate an upload and return a mock URL
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Return a mock URL
    // In a real app, this would be the URL returned by the server
    return `https://picsum.photos/500/500?random=${Math.floor(Math.random() * 1000)}`;
  },
};

export default api;
