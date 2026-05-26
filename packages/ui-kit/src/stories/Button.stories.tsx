/**
 * Button component stories.
 * These follow the Storybook CSF 3 format and can be viewed in
 * Expo Go via the StoryBook Expo Go preview or a local Storybook server.
 */
import * as React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../components/Button';
import { spacing } from '../theme';

export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = (): React.ReactElement => (
  <View style={styles.container}>
    <Button variant="primary" onPress={() => undefined}>Pay Deposit</Button>
    <Button variant="primary" loading onPress={() => undefined}>Loading…</Button>
    <Button variant="primary" disabled onPress={() => undefined}>Disabled</Button>
    <Button variant="primary" fullWidth onPress={() => undefined}>Full Width</Button>
  </View>
);

export const Secondary = (): React.ReactElement => (
  <View style={styles.container}>
    <Button variant="secondary" onPress={() => undefined}>Cancel</Button>
    <Button variant="secondary" loading onPress={() => undefined}>Loading…</Button>
    <Button variant="secondary" disabled onPress={() => undefined}>Disabled</Button>
  </View>
);

export const Destructive = (): React.ReactElement => (
  <View style={styles.container}>
    <Button variant="destructive" onPress={() => undefined}>Raise Dispute</Button>
    <Button variant="destructive" loading onPress={() => undefined}>Loading…</Button>
  </View>
);

export const Ghost = (): React.ReactElement => (
  <View style={styles.container}>
    <Button variant="ghost" onPress={() => undefined}>Skip for now</Button>
    <Button variant="ghost" onPress={() => undefined}>View details</Button>
  </View>
);

export const Sizes = (): React.ReactElement => (
  <View style={styles.container}>
    <Button size="sm" onPress={() => undefined}>Small (h36)</Button>
    <Button size="md" onPress={() => undefined}>Medium (h48)</Button>
    <Button size="lg" onPress={() => undefined}>Large (h56)</Button>
  </View>
);

export const AllVariants = (): React.ReactElement => (
  <ScrollView contentContainerStyle={styles.container}>
    <Button variant="primary"     size="sm"  onPress={() => undefined}>Primary — Small</Button>
    <Button variant="primary"     size="md"  onPress={() => undefined}>Primary — Medium</Button>
    <Button variant="primary"     size="lg"  onPress={() => undefined}>Primary — Large</Button>
    <Button variant="secondary"   size="md"  onPress={() => undefined}>Secondary — Medium</Button>
    <Button variant="destructive" size="md"  onPress={() => undefined}>Destructive — Medium</Button>
    <Button variant="ghost"       size="md"  onPress={() => undefined}>Ghost — Medium</Button>
    <Button variant="primary" fullWidth       onPress={() => undefined}>Full Width</Button>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    padding: spacing['2xl'],
    gap: spacing.base,
  },
});
