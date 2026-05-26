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

interface KycRequiredSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Bottom sheet shown when a gated action requires KYC verification.
 */
export function KycRequiredSheet({ visible, onDismiss }: KycRequiredSheetProps): React.ReactElement {
  const handleVerifyNow = (): void => {
    onDismiss();
    router.push('/(auth)/kyc');
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
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Identity Verification Required</Text>
            <Text style={styles.warningDescription}>
              You need to complete KYC verification before creating or confirming rental agreements.
            </Text>
          </View>
        </View>

        <Button
          variant="primary"
          fullWidth
          onPress={handleVerifyNow}
          style={styles.button}
        >Verify Now</Button>

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
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    color: '#92400E',
  },
  warningDescription: {
    fontSize: 14,
    color: '#78350F',
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
