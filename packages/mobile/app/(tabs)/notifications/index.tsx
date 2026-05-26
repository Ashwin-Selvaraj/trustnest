import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Banner, colors, spacing, fontSize, fontWeight } from '@trustnest/ui-kit';

export default function NotificationsScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications coming soon</Text>
      <Banner variant="info">Push notifications will appear here.</Banner>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    padding:         spacing.xl,
    gap:             spacing.base,
  },
  title: {
    fontSize:   fontSize.lg,
    fontWeight: fontWeight.semibold,
    color:      colors.text,
    textAlign:  'center',
  },
});
