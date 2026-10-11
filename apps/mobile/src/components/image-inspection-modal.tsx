import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface ImageInspectionModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
}

export function ImageInspectionModal({
  visible,
  onClose,
  imageUrl,
  title = 'Ảnh Xác Thực Thực Địa',
  subtitle,
}: ImageInspectionModalProps) {
  if (!imageUrl) return null;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable
            accessibilityLabel="Close photo inspection"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <MaterialCommunityIcons color="#FFFFFF" name="close" size={24} />
          </Pressable>
        </View>

        {/* Full Image */}
        <View style={styles.imageContainer}>
          <Image
            contentFit="contain"
            source={{ uri: imageUrl }}
            style={styles.fullImage}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000FA',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
