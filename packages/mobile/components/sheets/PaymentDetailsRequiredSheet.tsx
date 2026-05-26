import * as React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@trustnest/ui-kit';

interface PaymentDetailsRequiredSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Bottom sheet shown when a gated action requires verified payment details.
 */
export function PaymentDetailsRequiredSheet({
  visible,
  onDismiss,
}: PaymentDetailsRequiredSheetProps): React.ReactElement {
  const handleAddDetails = (): void => {
    onDismiss();
    router.push('/(auth)/payment-details');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>💳</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Payment Details Required</Text>
            <Text style={styles.warningDescription}>
              You need to add your UPI ID or bank account to pay or receive rental deposits.
            </Text>
          </View>
        </View>

        <Button
          variant="primary"
          fullWidth
          onPress={handleAddDetails}
          style={styles.button}
        >Add Payment Details</Button>

        <TouchableOpacity onPress={onDismiss} style={styles.dismissRow}>
          <Text style={styles.dismissText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  warningIcon: {
    fontSize: 22,
  },
  warningContent: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  warningDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  button: {},
  dismissRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
