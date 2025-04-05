import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import FormInput from '../components/FormInput';
import CustomButton from '../components/CustomButton';

const RegisterScreen = ({ navigation }) => {
  // State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [userType, setUserType] = useState('produtor');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Auth context
  const { register } = useAuth();

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

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

    // Validate confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    // Validate phone (optional)
    if (phone && !/^\(\d{2}\) \d{5}-\d{4}$/.test(phone)) {
      newErrors.phone = 'Telefone inválido. Use o formato (99) 99999-9999';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle register
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Add a timeout to prevent hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: A solicitação de registro demorou muito tempo. Verifique sua conexão e o endereço IP do servidor.'));
      }, 15000); // 15 seconds timeout
    });

    try {
      // Show connecting message
      setErrors({ general: 'Conectando ao servidor...' });
      
      // Race between the registration request and the timeout
      const result = await Promise.race([
        register({
          name,
          email,
          password,
          userType,
          phone: phone || undefined,
          location: location || undefined,
        }),
        timeoutPromise
      ]);

      if (result.success) {
        // Clear any errors if successful
        setErrors({});
        // Navigate to home screen or show success message
        navigation.navigate('Home');
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Provide more detailed error message based on the error
      let errorMessage = 'Erro ao registrar. Tente novamente.';
      
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
          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Preencha os campos abaixo para se cadastrar
            </Text>
          </View>

          {/* Register form */}
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

            <FormInput
              label="Confirmar Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme sua senha"
              secureTextEntry
              icon="lock-outline"
              error={errors.confirmPassword}
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

            {/* User type selection */}
            <Text style={styles.label}>Tipo de Usuário</Text>
            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeOption,
                  userType === 'produtor' && styles.userTypeSelected,
                ]}
                onPress={() => setUserType('produtor')}
              >
                <MaterialIcons
                  name="agriculture"
                  size={24}
                  color={userType === 'produtor' ? '#4CAF50' : '#757575'}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'produtor' && styles.userTypeTextSelected,
                  ]}
                >
                  Produtor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeOption,
                  userType === 'técnico' && styles.userTypeSelected,
                ]}
                onPress={() => setUserType('técnico')}
              >
                <MaterialIcons
                  name="engineering"
                  size={24}
                  color={userType === 'técnico' ? '#4CAF50' : '#757575'}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'técnico' && styles.userTypeTextSelected,
                  ]}
                >
                  Técnico
                </Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Cadastrar"
              onPress={handleRegister}
              isLoading={isLoading}
              style={styles.registerButton}
            />
          </View>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Entrar</Text>
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
    paddingTop: 24,
    paddingBottom: 24,
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
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  userTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginRight: 8,
  },
  userTypeSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  userTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#757575',
  },
  userTypeTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#757575',
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RegisterScreen;
