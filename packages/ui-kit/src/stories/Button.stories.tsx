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
    <Button label="Pay Deposit" variant="primary" onPress={() => undefined} />
    <Button label="Loading…" variant="primary" loading onPress={() => undefined} />
    <Button label="Disabled" variant="primary" disabled onPress={() => undefined} />
    <Button label="Full Width" variant="primary" fullWidth onPress={() => undefined} />
  </View>
);

export const Secondary = (): React.ReactElement => (
  <View style={styles.container}>
    <Button label="Cancel" variant="secondary" onPress={() => undefined} />
    <Button label="Loading…" variant="secondary" loading onPress={() => undefined} />
    <Button label="Disabled" variant="secondary" disabled onPress={() => undefined} />
  </View>
);

export const Destructive = (): React.ReactElement => (
  <View style={styles.container}>
    <Button label="Raise Dispute" variant="destructive" onPress={() => undefined} />
    <Button label="Loading…" variant="destructive" loading onPress={() => undefined} />
  </View>
);

export const Sizes = (): React.ReactElement => (
  <View style={styles.container}>
    <Button label="Small" size="sm" onPress={() => undefined} />
    <Button label="Medium (default)" size="md" onPress={() => undefined} />
    <Button label="Large" size="lg" onPress={() => undefined} />
  </View>
);

export const AllVariants = (): React.ReactElement => (
  <ScrollView contentContainerStyle={styles.container}>
    <Button label="Primary — Small" variant="primary" size="sm" onPress={() => undefined} />
    <Button label="Primary — Medium" variant="primary" size="md" onPress={() => undefined} />
    <Button label="Primary — Large" variant="primary" size="lg" onPress={() => undefined} />
    <Button label="Secondary — Medium" variant="secondary" size="md" onPress={() => undefined} />
    <Button label="Destructive — Medium" variant="destructive" size="md" onPress={() => undefined} />
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    padding: spacing['2xl'],
    gap: spacing.base,
  },
});
