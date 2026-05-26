/**
 * Combined stories for AgreementCard, ReputationBadge, StatusChip, and OtpInput.
 */
import * as React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AgreementStatus, UserRole } from '@trustnest/shared';
import { AgreementCard } from '../components/AgreementCard';
import { ReputationBadge } from '../components/ReputationBadge';
import { StatusChip } from '../components/StatusChip';
import { OtpInput } from '../components/OtpInput';
import { spacing } from '../theme';

// ──────────────────────────── AgreementCard ────────────────────────────

export const AgreementCardStories = (): React.ReactElement => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AgreementCard
        id="1"
        propertyAddress="12 MG Road, Bengaluru, Karnataka 560001"
        status={AgreementStatus.ACTIVE}
        rentINR={25000}
        depositINR={75000}
        tenantName="Ashwin Selvaraj"
        ownerName="Ravi Kumar"
        startDate="2025-01-01"
        endDate="2025-12-31"
        viewerRole={UserRole.TENANT}
        onPress={() => undefined}
      />
      <AgreementCard
        id="2"
        propertyAddress="7/B, Koramangala 4th Block, Bengaluru"
        status={AgreementStatus.PENDING_DEPOSIT}
        rentINR={18000}
        depositINR={54000}
        tenantName="Priya Mehta"
        ownerName="Suresh Nair"
        startDate="2025-03-01"
        endDate="2026-02-28"
        viewerRole={UserRole.OWNER}
        onPress={() => undefined}
      />
      <AgreementCard
        id="3"
        propertyAddress="Plot 42, Whitefield, Bengaluru 560066"
        status={AgreementStatus.DISPUTED}
        rentINR={32000}
        depositINR={96000}
        tenantName="Amir Khan"
        ownerName="Lakshmi Devi"
        startDate="2024-06-01"
        endDate="2025-05-31"
        viewerRole={UserRole.TENANT}
        onPress={() => undefined}
      />
      <AgreementCard
        id="4"
        propertyAddress="Flat 3C, Brigade Gateway, Rajajinagar, Bengaluru"
        status={AgreementStatus.CLOSED}
        rentINR={45000}
        depositINR={135000}
        tenantName="Deepa Raj"
        ownerName="Vijay Sharma"
        startDate="2024-01-01"
        endDate="2024-12-31"
        viewerRole={UserRole.TENANT}
        onPress={() => undefined}
      />
    </ScrollView>
  );
};

// ──────────────────────────── ReputationBadge ────────────────────────────

export const ReputationBadgeStories = (): React.ReactElement => (
  <View style={styles.container}>
    <ReputationBadge score={4.5} reviews={12} />
    <ReputationBadge score={3.0} reviews={5} />
    <ReputationBadge score={5.0} reviews={1} />
    <ReputationBadge hasReviews={false} />
    <ReputationBadge score={4.2} reviews={8} />
    <ReputationBadge hasReviews={false} />
  </View>
);

// ──────────────────────────── StatusChip ────────────────────────────

export const StatusChipStories = (): React.ReactElement => (
  <View style={styles.container}>
    {Object.values(AgreementStatus).map((status) => (
      <StatusChip key={status} status={status} />
    ))}
  </View>
);

// ──────────────────────────── OtpInput ────────────────────────────

function OtpInputDemo(): React.ReactElement {
  const [otp, setOtp] = React.useState('');
  return (
    <View style={styles.container}>
      <OtpInput value={otp} onChange={setOtp} />
      <OtpInput value="12345" onChange={() => undefined} />
      <OtpInput value="123" onChange={() => undefined} error />
    </View>
  );
}

export const OtpInputStories = (): React.ReactElement => <OtpInputDemo />;

const styles = StyleSheet.create({
  container: {
    padding: spacing['2xl'],
    gap: spacing.base,
  },
});
