import React from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Modal,
} from 'react-native';

/**
 * Loading indicator component with different variants
 * 
 * @param {boolean} visible - Whether the indicator is visible
 * @param {string} message - Optional message to display
 * @param {string} type - Type of indicator (fullscreen, inline, overlay)
 * @param {string} size - Size of the indicator (small, large)
 * @param {string} color - Color of the indicator
 * @param {object} style - Additional style for the container
 */
const LoadingIndicator = ({
  visible = true,
  message,
  type = 'inline',
  size = 'large',
  color = '#4CAF50',
  style,
}) => {
  // Fullscreen loading indicator
  if (type === 'fullscreen') {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => {}}
      >
        <View style={styles.fullscreenContainer}>
          <View style={styles.fullscreenContent}>
            <ActivityIndicator size={size} color={color} />
            {message && <Text style={styles.message}>{message}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  // Overlay loading indicator
  if (type === 'overlay') {
    if (!visible) return null;
    
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={size} color={color} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    );
  }

  // Inline loading indicator (default)
  if (!visible) return null;
  
  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullscreenContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 999,
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default LoadingIndicator;
