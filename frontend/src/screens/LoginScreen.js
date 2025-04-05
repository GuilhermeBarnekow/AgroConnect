import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import FormInput from '../components/FormInput';
import CustomButton from '../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Auth context
  const { login } = useAuth();

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate email
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Add a timeout to prevent hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: A solicitação de login demorou muito tempo. Verifique sua conexão e o endereço IP do servidor.'));
      }, 15000); // 15 seconds timeout
    });

    try {
      // Show connecting message
      setErrors({ general: 'Conectando ao servidor...' });
      
      // Race between the login request and the timeout
      const result = await Promise.race([
        login({ email, password }),
        timeoutPromise
      ]);

      if (result.success) {
        // Clear any errors if successful
        setErrors({});
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide more detailed error message based on the error
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.message && error.message.includes('Timeout')) {
        errorMessage = error.message;
      } else if (error.message && error.message.includes('Network Error')) {
        errorMessage = 'Erro de rede: Não foi possível conectar ao servidor. Verifique se o endereço IP do servidor está correto (em api.js) e se o servidor está rodando.';
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Erro ${error.response.status}: ${error.response.data?.error || 'Erro desconhecido'}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Servidor não respondeu. Verifique se o servidor está rodando e acessível.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="agriculture" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.title}>AgroConnect</Text>
            <Text style={styles.subtitle}>
              Conectando produtores e técnicos agrícolas
            </Text>
          </View>

          {/* Login form */}
          <View style={styles.formContainer}>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <FormInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Seu email"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="email"
              error={errors.email}
            />

            <FormInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => {
                // Handle forgot password
                // This would be implemented in a real app
                alert('Funcionalidade não implementada neste protótipo');
              }}
            >
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Entrar"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.loginButton}
            />
          </View>

          {/* Register link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Cadastre-se</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#757575',
    fontSize: 14,
    marginRight: 4,
  },
  registerLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;
