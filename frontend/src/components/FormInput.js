import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Custom form input component with label, error handling, and optional icon
 * 
 * @param {string} label - Input label
 * @param {string} value - Input value
 * @param {function} onChangeText - Function to call when text changes
 * @param {string} placeholder - Input placeholder
 * @param {boolean} secureTextEntry - Whether input is for password
 * @param {string} error - Error message
 * @param {string} icon - Icon name from MaterialIcons
 * @param {boolean} multiline - Whether input is multiline
 * @param {object} style - Additional style for the input container
 * @param {object} inputStyle - Additional style for the input
 * @param {object} props - Additional props for TextInput
 */
const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon,
  multiline = false,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Handle focus
  const handleFocus = () => setIsFocused(true);
  
  // Handle blur
  const handleBlur = () => setIsFocused(false);
  
  // Toggle password visibility
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
          multiline && styles.multilineInput,
        ]}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={isFocused ? '#4CAF50' : '#757575'}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineTextInput,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility-off' : 'visibility'}
              size={20}
              color="#757575"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  focusedInput: {
    borderColor: '#4CAF50',
  },
  errorInput: {
    borderColor: '#F44336',
  },
  multilineInput: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  icon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#212121',
  },
  multilineTextInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  passwordToggle: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
});

export default FormInput;
