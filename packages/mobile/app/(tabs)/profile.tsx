/**
 * Profile screen — redesigned to match the 4-state design reference.
 *
 * Sections:
 *   1. Avatar hero (name · phone · role)
 *   2. Personal Information (tappable → edit-profile)
 *   3. Identity Verification (tappable → kyc-intro; 3 KYC states)
 *   4. Reputation Score
 *   5. Agreement Overview (status counters grid)
 *   6. Sign Out
 */

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  Avatar, ReputationBadge,
  colors, spacing, fontSize, fontWeight, borderRadius,
} from '@trustnest/ui-kit';
import { KycStatus, KycMethod, AgreementStatus, UserRole } from '@trustnest/shared';
import { useAuth } from '@/store/auth.store';
import { useUserContext } from '@/store/user-context';
import { usersApi } from '@/api/users';
import { agreementsApi } from '@/api/agreements';
import type { ReputationScore } from '@/types/api';

// ─── Chevron icon ─────────────────────────────────────────────────────────────

function ChevronRight(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4l4 4-4 4"
        stroke={colors.textSec}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Section card with optional tappable header ───────────────────────────────

function SectionCard({
  title,
  onPress,
  children,
}: {
  title:    string;
  onPress?: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={cardSt.card}>
      {onPress ? (
        <TouchableOpacity style={cardSt.headerRow} onPress={onPress} activeOpacity={0.7}>
          <Text style={cardSt.headerText}>{title}</Text>
          <ChevronRight />
        </TouchableOpacity>
      ) : (
        <View style={cardSt.headerRow}>
          <Text style={cardSt.headerText}>{title}</Text>
        </View>
      )}
      <View style={cardSt.divider} />
      <View style={cardSt.body}>{children}</View>
    </View>
  );
}

const cardSt = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical:   spacing.sm,
  },
  headerText: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.semibold,
    color:         colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  divider: { height: 1, backgroundColor: colors.border },
  body:    { padding: spacing.base, gap: spacing.sm },
});

// ─── Label / value row ────────────────────────────────────────────────────────

function CardRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={rowSt.row}>
      <Text style={rowSt.label}>{label}</Text>
      <Text style={rowSt.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const rowSt = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textSec, flexShrink: 0 },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, textAlign: 'right', flex: 1 },
});

// ─── KYC status icon ──────────────────────────────────────────────────────────

function KycIcon({ state }: { state: 'verified' | 'pending' | 'rejected' }): React.ReactElement {
  if (state === 'verified') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx={10} cy={10} r={9} fill={colors.successLight} stroke={colors.success} strokeWidth={1.5} />
        <Path d="M6 10l3 3 5-5" stroke={colors.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (state === 'pending') {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx={10} cy={10} r={9} fill={colors.warningLight} stroke={colors.warning} strokeWidth={1.5} />
        <Path d="M10 6v4l2.5 2.5" stroke={colors.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} fill={colors.dangerLight} stroke={colors.danger} strokeWidth={1.5} />
      <Path d="M7 7l6 6M13 7l-6 6" stroke={colors.danger} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ─── KYC section body ─────────────────────────────────────────────────────────

function KycRow({
  kycStatus,
  kycMethod,
  kycSubmittedAt,
}: {
  kycStatus:      KycStatus;
  kycMethod:      KycMethod | null;
  kycSubmittedAt: string | null;
}): React.ReactElement {
  const state: 'verified' | 'pending' | 'rejected' =
    kycStatus === KycStatus.VERIFIED ? 'verified' :
    kycStatus === KycStatus.REJECTED ? 'rejected' : 'pending';

  const labelText  = state === 'verified' ? 'KYC Verified' : state === 'pending' ? 'KYC Pending' : 'KYC Rejected';
  const labelColor = state === 'verified' ? colors.success  : state === 'pending' ? colors.warning  : colors.danger;
  const bgColor    = state === 'verified' ? colors.successLight : state === 'pending' ? colors.warningLight : colors.dangerLight;

  const docLabel = kycMethod === KycMethod.PAN ? 'PAN Card' : 'Aadhaar Card';
  const submittedText = kycSubmittedAt
    ? new Date(kycSubmittedAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <View style={kycSt.row}>
      <View style={[kycSt.iconBox, { backgroundColor: bgColor }]}>
        <KycIcon state={state} />
      </View>
      <View style={kycSt.textCol}>
        <Text style={[kycSt.label, { color: labelColor }]}>{labelText}</Text>
        {kycMethod ? (
          <Text style={kycSt.meta} numberOfLines={2}>
            {docLabel}{submittedText ? ` · Submitted ${submittedText}` : ''}
          </Text>
        ) : null}
        {state === 'pending' ? (
          <Text style={kycSt.hint}>
            {'Review usually completes within 2–4 hours. You\'ll get an SMS once it\'s done.'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const kycSt = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textCol: { flex: 1, gap: 3 },
  label:   { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  meta:    { fontSize: fontSize.xs, color: colors.textSec, lineHeight: 18 },
  hint:    { fontSize: fontSize.xs, color: colors.textSec, lineHeight: 18, marginTop: 2 },
});

// ─── Agreement overview grid ──────────────────────────────────────────────────

interface AgCounts { active: number; pending: number; closed: number; disputed: number }

function AgGrid({ counts }: { counts: AgCounts }): React.ReactElement {
  const items = [
    { label: 'Active',          count: counts.active,   dot: colors.success },
    { label: 'Pending deposit', count: counts.pending,  dot: colors.warning },
    { label: 'Closed',          count: counts.closed,   dot: colors.textSec },
    { label: 'Disputed',        count: counts.disputed, dot: colors.danger  },
  ];
  return (
    <View style={agSt.grid}>
      {items.map((item) => (
        <View key={item.label} style={agSt.cell}>
          <View style={agSt.cellTop}>
            <View style={[agSt.dot, { backgroundColor: item.dot }]} />
            <Text style={[agSt.cellLabel, item.count > 0 && { color: item.dot }]}>
              {item.label}
            </Text>
          </View>
          <Text style={agSt.cellCount}>
            {item.count} {item.count === 1 ? 'agreement' : 'agreements'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const agSt = StyleSheet.create({
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell:      { width: '47.5%', backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: 4 },
  cellTop:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  cellLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSec, flex: 1 },
  cellCount: { fontSize: fontSize.xs, color: colors.textSec, paddingLeft: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.ReactElement {
  const { state, signOut } = useAuth();
  const { data: ctx }      = useUserContext();
  const { user }           = state;

  const [reputation, setReputation] = React.useState<ReputationScore | null>(null);
  const [repLoading, setRepLoading] = React.useState(true);
  const [agCounts, setAgCounts]     = React.useState<AgCounts>({ active: 0, pending: 0, closed: 0, disputed: 0 });
  const [agLoading, setAgLoading]   = React.useState(true);

  React.useEffect(() => {
    if (!user) return;

    setRepLoading(true);
    usersApi.getReputation(user.id)
      .then(setReputation)
      .catch(() => setReputation(null))
      .finally(() => setRepLoading(false));

    agreementsApi.list(1, 100).then((res) => {
      const c: AgCounts = { active: 0, pending: 0, closed: 0, disputed: 0 };
      res.data.forEach((a) => {
        if (a.status === AgreementStatus.ACTIVE || a.status === AgreementStatus.RELEASING) c.active++;
        else if (a.status === AgreementStatus.PENDING_DEPOSIT) c.pending++;
        else if (a.status === AgreementStatus.CLOSED) c.closed++;
        else if (a.status === AgreementStatus.DISPUTED) c.disputed++;
      });
      setAgCounts(c);
    }).catch(() => {}).finally(() => setAgLoading(false));
  }, [user]);

  const handleSignOut = (): void => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const kycStatus      = user?.kycStatus ?? KycStatus.PENDING;
  const kycMethod      = user?.kycMethod ?? null;
  const kycSubmittedAt = ctx.kycSubmittedAt;

  const roleLabel = (): string => {
    switch (user?.role) {
      case UserRole.OWNER: return 'Property Owner';
      case UserRole.BOTH:  return 'Tenant & Owner';
      default:             return 'Tenant';
    }
  };

  const roleEmoji = (): string => {
    switch (user?.role) {
      case UserRole.OWNER: return '🏠';
      case UserRole.BOTH:  return '🔄';
      default:             return '🧳';
    }
  };

  const displayName  = user?.fullName ?? ctx.fullName  ?? 'Your Name';
  const displayPhone = user?.phone    ?? ctx.phone     ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── 1. Avatar hero ───────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Avatar name={displayName} size={72} />
        <Text style={styles.heroName}>{displayName}</Text>
        {displayPhone ? <Text style={styles.heroPhone}>{displayPhone}</Text> : null}
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{roleEmoji()} {roleLabel()}</Text>
        </View>
      </View>

      {/* ── 2. Personal Information ──────────────────────────────────────── */}
      <SectionCard title="Personal Information" onPress={() => router.push('/(auth)/edit-profile')}>
        <CardRow label="Legal name" value={displayName} />
        <View style={styles.rowDiv} />
        {displayPhone ? (
          <>
            <CardRow label="Phone" value={displayPhone} />
            <View style={styles.rowDiv} />
          </>
        ) : null}
        <CardRow label="Acting as" value={roleLabel()} />
      </SectionCard>

      {/* ── 3. Identity Verification ────────────────────────────────────── */}
      <SectionCard title="Identity Verification" onPress={() => router.push('/(auth)/kyc-intro')}>
        <KycRow kycStatus={kycStatus} kycMethod={kycMethod} kycSubmittedAt={kycSubmittedAt} />
      </SectionCard>

      {/* ── 4. Reputation Score ─────────────────────────────────────────── */}
      <SectionCard title="Reputation Score">
        {repLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : reputation && (reputation.totalReviews ?? 0) > 0 ? (
          <ReputationBadge
            score={reputation.averageScore}
            reviews={reputation.totalReviews}
            hasReviews
          />
        ) : (
          <View style={styles.noRepRow}>
            <ReputationBadge hasReviews={false} />
            <View style={styles.noRepRight}>
              <Text style={styles.noRepTitle}>No reviews yet</Text>
              <Text style={styles.noRepSub}>
                Your reputation grows with each completed lease.
              </Text>
            </View>
          </View>
        )}
      </SectionCard>

      {/* ── 5. Agreement Overview ────────────────────────────────────────── */}
      <SectionCard title="Agreement Overview">
        {agLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <AgGrid counts={agCounts} />
            <Text style={styles.agHint}>
              Tap an agreement on the home screen for details.
            </Text>
          </>
        )}
      </SectionCard>

      {/* ── 6. Sign Out ──────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content:   { padding: spacing.base, paddingBottom: spacing['2xl'], gap: spacing.md },

  hero: {
    alignItems:      'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    gap:             spacing.xs,
  },
  heroName:  { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.xs },
  heroPhone: { fontSize: fontSize.sm, color: colors.textSec },
  rolePill:  {
    marginTop:         2,
    paddingVertical:   4,
    paddingHorizontal: spacing.sm,
    backgroundColor:  colors.primaryLight,
    borderRadius:     borderRadius.full,
  },
  rolePillText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.primary },

  rowDiv: { height: 1, backgroundColor: colors.border, marginHorizontal: -spacing.base },

  noRepRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noRepRight: { flex: 1, gap: 3 },
  noRepTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
  noRepSub:   { fontSize: fontSize.sm, color: colors.textSec, lineHeight: 18 },

  agHint: {
    fontSize:   fontSize.xs,
    color:      colors.textSec,
    textAlign:  'center',
    lineHeight: 18,
    marginTop:  spacing.xs,
  },

  signOutBtn: {
    height:          52,
    borderRadius:    borderRadius.lg,
    borderWidth:     1.5,
    borderColor:     colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       spacing.xs,
  },
  signOutText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text },
});
