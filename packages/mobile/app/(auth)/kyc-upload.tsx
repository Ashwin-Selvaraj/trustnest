/**
 * KYC Upload screen — step 2 of 3.
 * User takes a photo of their chosen government ID using the device camera
 * or selects an image from their photo library.
 * Uses expo-image-picker (already in Expo SDK, no install needed).
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  NavHeader, ProgressBar, Button, Banner,
  colors, spacing, fontSize, fontWeight, borderRadius,
} from '@trustnest/ui-kit';

export default function KycUploadScreen(): React.ReactElement {
  const { docType } = useLocalSearchParams<{ docType: 'aadhaar' | 'pan' }>();
  const [imageUri, setImageUri] = React.useState<string | null>(null);

  const docLabel = docType === 'pan' ? 'PAN Card' : 'Aadhaar Card';

  const requestAndPick = async (source: 'camera' | 'library'): Promise<void> => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Please enable camera access in Settings to take a photo.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality:    0.85,
        allowsEditing: true,
        aspect:     [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library',
          'Please enable photo library access in Settings.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality:    0.85,
        allowsEditing: true,
        aspect:     [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    }
  };

  const handleContinue = (): void => {
    if (!imageUri) return;
    router.push('/(auth)/kyc-selfie');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <NavHeader title={`Upload ${docLabel}`} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <ProgressBar step={2} total={3} />

        <Banner variant="info">
          {`Place your ${docLabel} on a flat surface, ensure all 4 corners are visible, and take a clear photo in good lighting.`}
        </Banner>

        {/* Upload zone */}
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setImageUri(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.retakeText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadZone}
            onPress={() => {
              Alert.alert('Add Photo', 'Choose how you want to add your document photo.', [
                { text: 'Take Photo',       onPress: () => void requestAndPick('camera')  },
                { text: 'Choose from Library', onPress: () => void requestAndPick('library') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadTitle}>Tap to upload document</Text>
            <Text style={styles.uploadHint}>
              JPG or PNG · Max 5 MB{Platform.OS === 'ios' ? '\nTake photo or choose from library' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tips}>
          {[
            '✅  All 4 corners of the document visible',
            '✅  Text is clear and not blurry',
            '❌  No glare or reflections',
            '❌  Document not cropped or folded',
          ].map((tip) => (
            <Text key={tip} style={styles.tip}>{tip}</Text>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            fullWidth
            disabled={!imageUri}
            onPress={handleContinue}
          >
            Continue
          </Button>
          <Button variant="secondary" fullWidth onPress={() => router.replace('/(tabs)')}>
            I'll do this later
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.md },

  uploadZone: {
    height:          180,
    borderWidth:     2,
    borderStyle:     'dashed',
    borderColor:     colors.primaryBorder,
    borderRadius:    borderRadius.lg,
    backgroundColor: colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    padding:         spacing.md,
  },
  uploadIcon:  { fontSize: 36 },
  uploadTitle: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.semibold,
    color:      colors.primary,
  },
  uploadHint: {
    fontSize:  fontSize.xs,
    color:     colors.textSec,
    textAlign: 'center',
    lineHeight: 18,
  },

  previewContainer: {
    borderRadius:    borderRadius.lg,
    overflow:        'hidden',
    backgroundColor: colors.border,
  },
  preview: {
    width:  '100%',
    height: 220,
  },
  retakeBtn: {
    padding:         spacing.sm,
    backgroundColor: colors.primaryLight,
    alignItems:      'center',
  },
  retakeText: {
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.semibold,
    color:      colors.primary,
  },

  tips: { gap: spacing.xs },
  tip: {
    fontSize:   fontSize.sm,
    color:      colors.textSec,
    lineHeight: 20,
  },

  actions: { gap: spacing.sm },
});
