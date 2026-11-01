import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/button';
import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CROP_SIZE = Math.min(Math.round(SCREEN_WIDTH * 0.72), 270);

export interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onConfirm: (uri: string) => void;
  onCancel: () => void;
}

export function AvatarCropModal({
  visible,
  imageUri,
  onConfirm,
  onCancel,
}: AvatarCropModalProps) {
  const theme = useTheme();

  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animated values for smooth dragging
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentPan = useRef({ x: 0, y: 0 });
  const boundsRef = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const renderDimensionsRef = useRef({ width: CROP_SIZE, height: CROP_SIZE });

  // Load natural dimensions of the image when imageUri changes
  useEffect(() => {
    if (!visible || !imageUri) {
      setNaturalDimensions(null);
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    let isCancelled = false;

    try {
      Image.getSize(
        imageUri,
        (width, height) => {
          if (isCancelled) return;
          setNaturalDimensions({ width, height });

          // Calculate scale factor so the image completely covers the crop circle
          const scale = Math.max(CROP_SIZE / width, CROP_SIZE / height);
          const dispW = Math.round(width * scale);
          const dispH = Math.round(height * scale);

          renderDimensionsRef.current = { width: dispW, height: dispH };

          // Default focus into the center of the selected image
          const initialX = Math.round(-(dispW - CROP_SIZE) / 2);
          const initialY = Math.round(-(dispH - CROP_SIZE) / 2);

          // Clamping bounds to prevent white/empty margins inside the circular viewport
          const minX = -(dispW - CROP_SIZE);
          const maxX = 0;
          const minY = -(dispH - CROP_SIZE);
          const maxY = 0;

          boundsRef.current = { minX, maxX, minY, maxY };
          currentPan.current = { x: initialX, y: initialY };
          pan.setValue({ x: initialX, y: initialY });

          setIsLoading(false);
        },
        () => {
          if (isCancelled) return;
          renderDimensionsRef.current = { width: CROP_SIZE, height: CROP_SIZE };
          boundsRef.current = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
          currentPan.current = { x: 0, y: 0 };
          pan.setValue({ x: 0, y: 0 });
          setIsLoading(false);
        },
      );
    } catch {
      renderDimensionsRef.current = { width: CROP_SIZE, height: CROP_SIZE };
      boundsRef.current = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      currentPan.current = { x: 0, y: 0 };
      pan.setValue({ x: 0, y: 0 });
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [visible, imageUri, pan]);

  // PanResponder to handle drag/pan interactions
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: currentPan.current.x,
          y: currentPan.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_evt, gestureState) => {
        const targetX = currentPan.current.x + gestureState.dx;
        const targetY = currentPan.current.y + gestureState.dy;

        // Clamp inside bounds
        const { minX, maxX, minY, maxY } = boundsRef.current;
        const clampedX = Math.min(maxX, Math.max(minX, targetX));
        const clampedY = Math.min(maxY, Math.max(minY, targetY));

        pan.setValue({
          x: clampedX - currentPan.current.x,
          y: clampedY - currentPan.current.y,
        });
      },
      onPanResponderRelease: (_evt, gestureState) => {
        pan.flattenOffset();
        const targetX = currentPan.current.x + gestureState.dx;
        const targetY = currentPan.current.y + gestureState.dy;

        const { minX, maxX, minY, maxY } = boundsRef.current;
        const clampedX = Math.min(maxX, Math.max(minX, targetX));
        const clampedY = Math.min(maxY, Math.max(minY, targetY));

        currentPan.current = { x: clampedX, y: clampedY };
        pan.setValue({ x: clampedX, y: clampedY });
      },
    }),
  ).current;

  const handleConfirm = () => {
    if (!imageUri) return;
    onConfirm(imageUri);
  };

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent={false}
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          {/* Header Title & Instruction */}
          <View style={styles.header}>
            <Text style={styles.title}>Căn chỉnh ảnh đại diện</Text>
            <Text style={styles.subtitle}>
              Kéo chỉnh để định vị ảnh vào đúng trung tâm vòng tròn
            </Text>
          </View>

          {/* Central Circular Crop Area */}
          <View style={styles.centerSection}>
            <View
              accessibilityHint="Kéo ngón tay để căn chỉnh vị trí ảnh trong hình tròn"
              accessibilityLabel="Vòng tròn căn chỉnh ảnh"
              accessibilityRole="imagebutton"
              style={[
                styles.cropCircleViewport,
                { width: CROP_SIZE, height: CROP_SIZE, borderRadius: CROP_SIZE / 2 },
              ]}
              {...panResponder.panHandlers}
            >
              {isLoading || !imageUri ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={theme.primary} size="large" />
                </View>
              ) : (
                <Animated.Image
                  resizeMode="cover"
                  source={{ uri: imageUri }}
                  style={[
                    styles.cropImage,
                    {
                      width: renderDimensionsRef.current.width,
                      height: renderDimensionsRef.current.height,
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                      ],
                    },
                  ]}
                />
              )}
            </View>

            {/* Instruction Badge */}
            <View style={styles.dragHintBadge}>
              <Text style={styles.dragHintText}>Kéo để di chuyển</Text>
            </View>
          </View>

          {/* Bottom Action Buttons: Cancel and Confirm */}
          <View style={styles.bottomSection}>
            <View style={styles.buttonRow}>
              {/* Secondary button: Cancel */}
              <AppButton
                accessibilityLabel="Hủy chọn ảnh"
                label="Hủy"
                onPress={onCancel}
                style={[
                  styles.actionButton,
                  styles.cancelButton,
                  { borderColor: 'rgba(255, 255, 255, 0.25)' },
                ]}
                textStyle={styles.cancelButtonText}
                variant="surface"
              />

              {/* Primary button: Confirm */}
              <AppButton
                accessibilityLabel="Xác nhận ảnh đại diện"
                disabled={isLoading}
                label="Xác nhận"
                onPress={handleConfirm}
                style={[
                  styles.actionButton,
                  styles.confirmButton,
                  { backgroundColor: theme.primary },
                ]}
                textStyle={styles.confirmButtonText}
                variant="primary"
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#0A0E11',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#A0AAB0',
    fontSize: 13,
    fontFamily: Fonts.body,
    marginTop: 6,
    textAlign: 'center',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cropCircleViewport: {
    backgroundColor: '#000000',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  cropImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHintBadge: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dragHintText: {
    color: '#D0D8DC',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Fonts.body,
  },
  bottomSection: {
    paddingBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: Rounded.md,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    borderWidth: 0,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
