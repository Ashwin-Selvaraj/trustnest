// ─── Components ───────────────────────────────────────────────────────────────

export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar';

export { Banner } from './components/Banner';
export type { BannerProps, BannerVariant } from './components/Banner';

export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Card } from './components/Card';
export type { CardProps } from './components/Card';

export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export { FAB } from './components/FAB';
export type { FABProps } from './components/FAB';

export { InfoRow } from './components/InfoRow';
export type { InfoRowProps } from './components/InfoRow';

export { KycBadge } from './components/KycBadge';
export type { KycBadgeProps, KycState } from './components/KycBadge';

export { Logo } from './components/Logo';
export type { LogoProps } from './components/Logo';

export { NavHeader } from './components/NavHeader';
export type { NavHeaderProps } from './components/NavHeader';

export { OtpInput } from './components/OtpInput';
export type { OtpInputProps } from './components/OtpInput';

export { ProgressBar } from './components/ProgressBar';
export type { ProgressBarProps } from './components/ProgressBar';

export { ReputationBadge } from './components/ReputationBadge';
export type { ReputationBadgeProps } from './components/ReputationBadge';

export { SectionHeader } from './components/SectionHeader';
export type { SectionHeaderProps } from './components/SectionHeader';

export { SelectableCard } from './components/SelectableCard';
export type { SelectableCardProps } from './components/SelectableCard';

export { StatusChip } from './components/StatusChip';
export type { StatusChipProps } from './components/StatusChip';

export { TabBar } from './components/TabBar';
export type { TabBarProps, TabId } from './components/TabBar';

export { TextInput, formatINR, parseINR } from './components/TextInput';
export type { TextInputProps } from './components/TextInput';

export { AgreementCard } from './components/AgreementCard';
export type { AgreementCardProps } from './components/AgreementCard';

export { PropertyCard } from './components/PropertyCard';
export type { PropertyCardProps } from './components/PropertyCard';

export { PhotoGallery } from './components/PhotoGallery';
export type { PhotoGalleryProps } from './components/PhotoGallery';

export { FilterBar } from './components/FilterBar';
export type { FilterBarProps, FilterItem } from './components/FilterBar';

export { InterestStatusChip } from './components/InterestStatusChip';
export type { InterestStatusChipProps } from './components/InterestStatusChip';

export { TenantSummaryCard } from './components/TenantSummaryCard';
export type { TenantSummaryCardProps } from './components/TenantSummaryCard';

// ─── Re-export shared enums used by marketplace components ───────────────────

export { InterestStatus, BhkType, FurnishingStatus, PropertyStatus } from '@trustnest/shared';

// ─── Design Tokens ────────────────────────────────────────────────────────────

export { colors, spacing, borderRadius, typography } from './theme';
export { fontSize, fontWeight, shadow } from './theme';
