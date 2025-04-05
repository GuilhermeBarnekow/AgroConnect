import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Provider
import { AuthProvider, useAuth } from './src/services/authContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AnnouncementDetailScreen from './src/screens/AnnouncementDetailScreen';
import CreateAnnouncementScreen from './src/screens/CreateAnnouncementScreen';
import ChatScreen from './src/screens/ChatScreen'; // Usando a versão padrão atualizada
import ChatsListScreen from './src/screens/ChatsListScreen'; // Usando a versão padrão atualizada

import ReviewScreen from './src/screens/ReviewScreen';
import UserReviewsScreen from './src/screens/UserReviewsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MyAnnouncementsScreen from './src/screens/MyAnnouncementsScreen';
import MyOffersScreen from './src/screens/MyOffersScreen';

// Components
import LoadingIndicator from './src/components/LoadingIndicator';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MyAnnouncementsTab"
        component={MyAnnouncementsScreen}
        options={{
          tabBarLabel: 'Anúncios',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="post-add" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatsListScreen}
        options={{
          tabBarLabel: 'Mensagens',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MyOffersTab"
        component={MyOffersScreen}
        options={{
          tabBarLabel: 'Ofertas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="local-offer" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// App navigator with authentication flow
const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  // Check if first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  // Show loading indicator while checking auth state
  if (isLoading || isFirstLaunch === null) {
    return <LoadingIndicator />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#212121',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AnnouncementDetail"
              component={AnnouncementDetailScreen}
              options={{ title: 'Detalhes do Anúncio' }}
            />
            <Stack.Screen
              name="CreateAnnouncement"
              component={CreateAnnouncementScreen}
              options={{ title: 'Criar Anúncio' }}
            />
            <Stack.Screen
              name="EditAnnouncement"
              component={CreateAnnouncementScreen}
              options={{ title: 'Editar Anúncio' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({ title: route.params.title || 'Chat' })}
            />
            <Stack.Screen
              name="Review"
              component={ReviewScreen}
              options={{ title: 'Avaliar' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={ProfileScreen}
              options={{ title: 'Editar Perfil' }}
              initialParams={{ screen: 'EditProfile' }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ProfileScreen}
              options={{ title: 'Alterar Senha' }}
              initialParams={{ screen: 'ChangePassword' }}
            />
            <Stack.Screen
              name="AnnouncementOffers"
              component={MyOffersScreen}
              options={{ title: 'Ofertas do Anúncio' }}
            />
            <Stack.Screen
              name="UserReviews"
              component={UserReviewsScreen}
              options={{ title: 'Avaliações' }}
            />
          </>
        ) : (
          // Authentication screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Criar Conta' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App component with providers
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
