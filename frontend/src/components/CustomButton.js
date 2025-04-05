import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Custom button component with different variants
 * 
 * @param {string} title - Button text
 * @param {function} onPress - Function to call when button is pressed
 * @param {boolean} isLoading - Whether to show loading indicator
 * @param {string} type - Button type (primary, outline, danger)
 * @param {string} size - Button size (small, medium, large)
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} icon - Optional icon name from MaterialIcons
 * @param {object} style - Additional style for the button container
 * @param {object} textStyle - Additional style for the button text
 */
const CustomButton = ({
  title,
  onPress,
  isLoading = false,
  type = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  // Get button style based on type
  const getButtonStyle = () => {
    switch (type) {
      case 'outline':
        return styles.outlineButton;
      case 'danger':
        return styles.dangerButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  // Get text style based on type
  const getTextStyle = () => {
    switch (type) {
      case 'outline':
        return styles.outlineButtonText;
      case 'danger':
        return styles.dangerButtonText;
      case 'primary':
      default:
        return styles.primaryButtonText;
    }
  };

  // Get button size style
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButton;
      case 'large':
        return styles.largeButton;
      case 'medium':
      default:
        return styles.mediumButton;
    }
  };

  // Get text size style
  const getTextSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallButtonText;
      case 'large':
        return styles.largeButtonText;
      case 'medium':
      default:
        return styles.mediumButtonText;
    }
  };

  // Get icon color based on type
  const getIconColor = () => {
    switch (type) {
      case 'outline':
        return '#4CAF50';
      case 'danger':
        return '#FFFFFF';
      case 'primary':
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        getSizeStyle(),
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={type === 'outline' ? '#4CAF50' : '#FFFFFF'}
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <MaterialIcons
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              getTextStyle(),
              getTextSizeStyle(),
              disabled && styles.disabledButtonText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
  // Button types
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  // Button sizes
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  // Text styles
  primaryButtonText: {
    color: '#FFFFFF',
  },
  outlineButtonText: {
    color: '#4CAF50',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  },
  // Text sizes
  smallButtonText: {
    fontSize: 12,
  },
  mediumButtonText: {
    fontSize: 14,
  },
  largeButtonText: {
    fontSize: 16,
  },
});

export default CustomButton;
