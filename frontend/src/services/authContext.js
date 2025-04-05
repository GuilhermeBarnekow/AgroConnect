 import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';
import { registerForPushNotifications } from './notificationService';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is logged in
        const token = await AsyncStorage.getItem('token');
        const userData = await AsyncStorage.getItem('user');

        if (token && userData) {
          // Set user data
          setUser(JSON.parse(userData));
          
          // Refresh user data from server
          refreshUser();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      console.log('Registering user with data:', userData);
      
      // Register user
      console.log('Sending registration request to API...');
      const response = await authAPI.register(userData);
      console.log('Registration response received:', response.data);
      
      // Get token and user data
      const { token, user } = response.data.data;
      
      // Save token and user data
      console.log('Saving token and user data to AsyncStorage...');
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set user data
      console.log('Setting user data in state...');
      setUser(user);
      
      // Register for push notifications (don't await to prevent blocking)
      console.log('Registering for push notifications in background...');
      setTimeout(() => {
        registerForPushNotifications().catch(error => {
          console.error('Error registering for push notifications:', error);
        });
      }, 0);
      
      console.log('Registration completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error registering:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request ? 'Request sent but no response received' : 'Request not sent',
      });
      
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao registrar. Tente novamente.',
      };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      console.log('Logging in with credentials:', credentials);
      
      // Login user
      console.log('Sending login request to API...');
      const response = await authAPI.login(credentials);
      console.log('Login response received:', response.data);
      
      // Get token and user data
      const { token, user } = response.data.data;
      
      // Save token and user data
      console.log('Saving token and user data to AsyncStorage...');
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set user data
      console.log('Setting user data in state...');
      setUser(user);
      
      // Register for push notifications (don't await to prevent blocking)
      console.log('Registering for push notifications in background...');
      setTimeout(() => {
        registerForPushNotifications().catch(error => {
          console.error('Error registering for push notifications:', error);
        });
      }, 0);
      
      console.log('Login completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error logging in:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request ? 'Request sent but no response received' : 'Request not sent',
      });
      
      return {
        success: false,
        error: error.response?.data?.error || 'Credenciais inválidas.',
      };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Remove token and user data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear user data
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      // Get current user data
      const response = await authAPI.getCurrentUser();
      
      // Get user data
      const userData = response.data.data.user;
      
      // Save user data
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Set user data
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Error refreshing user:', error);
      
      // If 401 Unauthorized, logout
      if (error.response && error.response.status === 401) {
        logout();
      }
      
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar dados do usuário.',
      };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      // Update profile
      const response = await authAPI.updateProfile(userData);
      
      // Get updated user data
      const updatedUser = response.data.data.user;
      
      // Save user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Set user data
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao atualizar perfil.',
      };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      // Change password
      await authAPI.changePassword(passwordData);
      
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao alterar senha.',
      };
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    register,
    login,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
