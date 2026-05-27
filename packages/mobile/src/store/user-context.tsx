/**
 * UserContext — lightweight in-memory store for onboarding-collected data.
 *
 * Populated step-by-step during profile-setup and the KYC flow, then read by
 * the Profile screen so it always shows the most-recently-entered data even
 * before the backend confirms it.
 *
 * Shape mirrors the fields that each onboarding screen knows about:
 *   phone        — carried forward from OTP params
 *   fullName     — set by profile-setup screen
 *   role         — set by profile-setup screen
 *   kycStatus    — updated by kyc-submitted screen
 *   kycIdType    — 'aadhaar' | 'pan' — set by kyc-document screen
 *   kycSubmittedAt — ISO string, set when user taps Submit
 */

import * as React from 'react';
import { KycStatus } from '@trustnest/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserOnboardingData {
  phone:          string | null;
  fullName:       string | null;
  role:           string | null;
  kycStatus:      KycStatus;
  kycIdType:      'aadhaar' | 'pan' | null;
  kycSubmittedAt: string | null;
}

export interface UserContextValue {
  data: UserOnboardingData;
  setPhone:     (phone: string) => void;
  setProfile:   (fullName: string, role: string) => void;
  setKycDoc:    (idType: 'aadhaar' | 'pan') => void;
  setKycSubmitted: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_DATA: UserOnboardingData = {
  phone:          null,
  fullName:       null,
  role:           null,
  kycStatus:      KycStatus.PENDING,
  kycIdType:      null,
  kycSubmittedAt: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

export const UserContext = React.createContext<UserContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [data, setData] = React.useState<UserOnboardingData>(DEFAULT_DATA);

  const setPhone = React.useCallback((phone: string): void => {
    setData((prev) => ({ ...prev, phone }));
  }, []);

  const setProfile = React.useCallback((fullName: string, role: string): void => {
    setData((prev) => ({ ...prev, fullName, role }));
  }, []);

  const setKycDoc = React.useCallback((idType: 'aadhaar' | 'pan'): void => {
    setData((prev) => ({ ...prev, kycIdType: idType }));
  }, []);

  const setKycSubmitted = React.useCallback((): void => {
    setData((prev) => ({
      ...prev,
      kycStatus:      KycStatus.PENDING,
      kycSubmittedAt: new Date().toISOString(),
    }));
  }, []);

  const value: UserContextValue = {
    data,
    setPhone,
    setProfile,
    setKycDoc,
    setKycSubmitted,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUserContext(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used inside UserContextProvider');
  return ctx;
}
