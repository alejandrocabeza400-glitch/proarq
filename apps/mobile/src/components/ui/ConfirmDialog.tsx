import { Modal, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import Button from './Button';
import Text from './Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text variant="titleMd">⚠️</Text>
          </View>

          <Text variant="titleMd" weight="800" color={colors.primary} style={styles.title}>
            {title}
          </Text>

          {description && (
            <Text variant="bodySm" color={colors.onSurfaceVariant} align="center" style={styles.description}>
              {description}
            </Text>
          )}

          <View style={styles.actions}>
            <Button
              onPress={onCancel}
              disabled={isConfirming}
              variant="ghost"
              fullWidth
              style={styles.cancelButton}
              textVariant="labelSm"
            >
              {cancelLabel}
            </Button>
            <Button
              onPress={onConfirm}
              loading={isConfirming}
              disabled={isConfirming}
              variant="primary"
              fullWidth
              style={styles.confirmButton}
              textVariant="labelSm"
            >
              {isConfirming ? 'Eliminando...' : confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 24,
    maxWidth: 360,
    width: '100%',
    alignItems: 'center',
    gap: 12,
    // Shadows
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    letterSpacing: -0.5,
  },
  description: {
    lineHeight: 20,
    marginBottom: 8,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  confirmButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.error,
  },
});
