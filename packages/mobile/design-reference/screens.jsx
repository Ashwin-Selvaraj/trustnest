// TrustNest screens — all 9 screens per spec
// Each screen is the *inner content* of an iPhone — no status bar, no device chrome.
// Inner viewport dimensions: 393 × 852 minus status bar (~50) and home indicator (~34)
// → effective content area ~768px

const C2 = window.TN.color;
const F2 = window.TN.font;
const R2 = window.TN.radius;

// ─────────────────────────────────────────────────────────────
// Wrapper — sets up the in-frame layout
// Provides safe-area aware container
// ─────────────────────────────────────────────────────────────
function Screen({ children, bg = '#fff', padTop = 50, padBottom = 34, hideHomeBar = false }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg,
      display: 'flex', flexDirection: 'column',
      paddingTop: padTop, paddingBottom: hideHomeBar ? 0 : padBottom,
      boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
      fontFamily: F2.family,
    }}>
      {children}
    </div>
  );
}

function ScrollBody({ children, padding = 20, gap = 16, bg, style = {} }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden',
      padding, background: bg,
      display: 'flex', flexDirection: 'column', gap,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 1 — Phone Entry
// ─────────────────────────────────────────────────────────────
function PhoneEntryScreen({ nav, initialState = 'default' }) {
  const [phone, setPhone] = React.useState(initialState === 'error' ? '12345' : '');
  const [loading, setLoading] = React.useState(initialState === 'loading');
  const [error, setError] = React.useState(initialState === 'error' ? 'Enter a valid 10-digit Indian mobile number.' : null);

  const handleSubmit = () => {
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      nav && nav.go('otp', { phone });
    }, 900);
  };

  return (
    <Screen padTop={60}>
      <div style={{
        flex: 1, padding: '0 24px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        <Logo size={64} />
        <h1 style={{
          fontSize: F2.sizes.xxl, fontWeight: F2.weights.bold,
          color: C2.text, margin: '24px 0 8px', letterSpacing: -0.8,
        }}>TrustNest</h1>
        <p style={{
          fontSize: F2.sizes.md, color: C2.textSec,
          textAlign: 'center', lineHeight: 1.45,
          margin: '0 0 40px', maxWidth: 280,
        }}>Transparent rental agreements,<br/>powered by secure escrow.</p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TextInput
            label="Mobile Number"
            placeholder="98765 43210"
            value={phone}
            onChange={(v) => { setPhone(v); if (error) setError(null); }}
            hint={error ? null : "We'll send a 6-digit OTP to this number"}
            error={error}
            keyboardType="phone"
            prefix="+91"
            maxLength={11}
          />
          <Button fullWidth loading={loading} onClick={handleSubmit}>
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </Button>
        </div>
      </div>
      <div style={{
        padding: '16px 32px 8px', textAlign: 'center',
        fontSize: F2.sizes.xs, color: C2.textDis, lineHeight: 1.5,
      }}>
        By continuing, you agree to our{' '}
        <span style={{ color: C2.primary, fontWeight: F2.weights.medium }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: C2.primary, fontWeight: F2.weights.medium }}>Privacy Policy</span>.
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2 — OTP Verification
// ─────────────────────────────────────────────────────────────
function OtpScreen({ nav, phone = '98765 43210', initialState = 'default' }) {
  const [otp, setOtp] = React.useState(initialState === 'error' ? '123456' : initialState === 'filled' ? '482917' : '');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(initialState === 'error' ? 'Incorrect code. Please try again.' : null);
  const [seconds, setSeconds] = React.useState(45);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      nav && nav.go('profile-setup');
    }, 900);
  };

  return (
    <Screen>
      <NavHeader title="" onBack={() => nav && nav.back()} />
      <div style={{
        flex: 1, padding: '32px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <h2 style={{
          fontSize: F2.sizes.xl, fontWeight: F2.weights.bold,
          color: C2.text, margin: '8px 0 6px', letterSpacing: -0.5,
        }}>Enter OTP</h2>
        <p style={{
          fontSize: F2.sizes.md, color: C2.textSec, marginTop: 0,
          marginBottom: 36, textAlign: 'center',
        }}>Sent to <span style={{ color: C2.text, fontWeight: F2.weights.medium }}>+91 {phone}</span></p>

        <OtpInput value={otp} onChange={(v) => { setOtp(v); if (error) setError(null); }} error={!!error} autoFocus />

        {error && (
          <div style={{
            marginTop: 16, fontSize: F2.sizes.sm, color: C2.danger,
            fontFamily: F2.family,
          }}>{error}</div>
        )}

        <div style={{ width: '100%', marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Button fullWidth loading={loading} onClick={handleVerify} disabled={otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify OTP'}
          </Button>
          <div style={{ textAlign: 'center', fontSize: F2.sizes.md, color: C2.textSec }}>
            Didn't receive it?{' '}
            {seconds > 0 ? (
              <span style={{ color: C2.primary, fontWeight: F2.weights.medium }}>
                Resend in 0:{seconds.toString().padStart(2, '0')}
              </span>
            ) : (
              <span
                onClick={() => setSeconds(45)}
                style={{ color: C2.primary, fontWeight: F2.weights.semibold, cursor: 'pointer' }}>
                Resend OTP
              </span>
            )}
          </div>
        </div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────────────────────
window.SAMPLE_AGREEMENTS = [
  {
    id: 'agr_001',
    address: '12 MG Road, Indiranagar, Bengaluru 560038',
    status: 'ACTIVE',
    rent: 28000,
    deposit: 84000,
    tenant: 'Rohan Mehta',
    owner: 'Priya Sharma',
    startDate: '01 Jan 2025',
    endDate: '31 Dec 2025',
    tokenId: '#0142',
    tenantConfirmed: '15 Dec 2024',
    ownerConfirmed: '15 Dec 2024',
  },
  {
    id: 'agr_002',
    address: 'A-704, Sunrise Apartments, Powai, Mumbai 400076',
    status: 'PENDING_DEPOSIT',
    rent: 42000,
    deposit: 125000,
    tenant: 'Rohan Mehta',
    owner: 'Vikram Reddy',
    startDate: '15 Mar 2025',
    endDate: '14 Mar 2026',
    tokenId: '#0178',
    tenantConfirmed: '02 Mar 2025',
    ownerConfirmed: '02 Mar 2025',
  },
  {
    id: 'agr_003',
    address: 'F-12, Hauz Khas Enclave, New Delhi 110016',
    status: 'DRAFT',
    rent: 35000,
    deposit: 105000,
    tenant: 'Rohan Mehta',
    owner: 'Anjali Kapoor',
    startDate: '01 Apr 2025',
    endDate: '31 Mar 2026',
    tokenId: '—',
    tenantConfirmed: null,
    ownerConfirmed: null,
  },
  {
    id: 'agr_004',
    address: 'No. 47, 4th Cross, Jayanagar, Bengaluru 560011',
    status: 'CLOSED',
    rent: 22000,
    deposit: 66000,
    tenant: 'Rohan Mehta',
    owner: 'Karthik Iyer',
    startDate: '01 Feb 2024',
    endDate: '31 Jan 2025',
    tokenId: '#0098',
    tenantConfirmed: '20 Jan 2024',
    ownerConfirmed: '20 Jan 2024',
  },
];

// ─────────────────────────────────────────────────────────────
// SCREEN 3 — Home / Agreement List
// ─────────────────────────────────────────────────────────────
function HomeScreen({ nav, state = 'populated' }) {
  const isEmpty = state === 'empty';
  const isLoading = state === 'loading';
  const isError = state === 'error';

  return (
    <Screen bg={C2.surface} padBottom={0}>
      <div style={{
        padding: '8px 20px 16px', flexShrink: 0, background: C2.surface,
      }}>
        <h1 style={{
          fontSize: 30, fontWeight: F2.weights.bold,
          color: C2.text, margin: 0, letterSpacing: -0.8,
        }}>My Agreements</h1>
        <div style={{ marginTop: 4, fontSize: F2.sizes.sm, color: C2.textSec }}>
          {isEmpty || isLoading || isError ? '\u00A0' : `${window.SAMPLE_AGREEMENTS.length} rental agreements`}
        </div>
      </div>

      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 }}>
          <Spinner color={C2.primary} size={24} />
          <span style={{ fontSize: F2.sizes.sm, color: C2.textSec }}>Loading your agreements…</span>
        </div>
      ) : isError ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', gap: 8 }}>
          <div style={{ fontSize: F2.sizes.md, color: C2.danger, fontWeight: F2.weights.semibold }}>Couldn't load agreements</div>
          <span style={{ fontSize: F2.sizes.sm, color: C2.textSec }}>Check your connection and{' '}
            <span style={{ color: C2.primary, fontWeight: F2.weights.semibold, textDecoration: 'underline' }}>tap to retry</span>.
          </span>
        </div>
      ) : isEmpty ? (
        <EmptyAgreements nav={nav} />
      ) : (
        <ScrollBody padding={20} gap={12} bg={C2.surface}>
          {window.SAMPLE_AGREEMENTS.map((a) => (
            <AgreementCard key={a.id} agreement={a} viewerRole="tenant"
              onClick={() => nav && nav.go('detail', { id: a.id })} />
          ))}
          <div style={{ height: 60 }} />
        </ScrollBody>
      )}

      {!isEmpty && !isLoading && !isError && (
        <FAB onClick={() => nav && nav.go('create')} style={{ bottom: 96 }} />
      )}

      <TabBar active="home" role={(window.SAMPLE_USER?.roles || ['tenant']).includes('owner') ? ((window.SAMPLE_USER?.roles || []).includes('tenant') ? 'both' : 'owner') : 'tenant'} notifCount={3} onChange={(t) => { if (t === 'home') return; if (t === 'browse') nav && nav.go('browse'); else if (t === 'notifications') nav && nav.go('notifications'); else if (t === 'profile') nav && nav.go('profile'); }} />
    </Screen>
  );
}

function EmptyAgreements({ nav }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px 100px', gap: 16, textAlign: 'center',
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: 22,
        background: C2.primaryLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="8" y="6" width="28" height="34" rx="3" stroke={C2.primary} strokeWidth="2"/>
          <path d="M14 14h16M14 20h16M14 26h10" stroke={C2.primary} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: F2.sizes.lg, fontWeight: F2.weights.bold, color: C2.text, letterSpacing: -0.4 }}>
          No agreements yet
        </div>
        <div style={{ fontSize: F2.sizes.md, color: C2.textSec, marginTop: 6, lineHeight: 1.45, maxWidth: 280 }}>
          Create your first rental agreement to get started — it takes about a minute.
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <Button onClick={() => nav && nav.go('create')} style={{ minWidth: 200 }}>
          Create Agreement
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 4 — Profile
// Pulls together everything we collected during onboarding so the
// user can see (and tap to manage) their own data.
// ─────────────────────────────────────────────────────────────
function ProfileScreen({
  nav,
  kycState = 'verified',
  hasReputation = true,
  user = window.SAMPLE_USER,
}) {
  const u = user || window.SAMPLE_USER;
  const roles = u.roles || ['tenant'];
  const docName = u.kyc?.docLabel || 'Aadhaar Card';
  const kycSubLine = (() => {
    if (kycState === 'verified') return `${docName} · Verified ${u.kyc?.verifiedAt || '16 Jan 2025'}`;
    if (kycState === 'pending')  return `${docName} · Submitted ${u.kyc?.submittedAt || '15 Jan 2025'}`;
    if (kycState === 'rejected') return `${docName} · Submitted ${u.kyc?.submittedAt || '15 Jan 2025'}`;
    return 'Not started';
  })();

  return (
    <Screen bg={C2.surface} padBottom={0}>
      <div style={{ padding: '8px 20px 16px', flexShrink: 0 }}>
        <h1 style={{
          fontSize: 30, fontWeight: F2.weights.bold,
          color: C2.text, margin: 0, letterSpacing: -0.8,
        }}>Profile</h1>
      </div>
      <ScrollBody padding={20} gap={14} bg={C2.surface}>
        {/* Avatar / identity card — taps into Personal Info */}
        <Card padding={20}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Avatar name={u.fullName} size={80} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: F2.sizes.lg, fontWeight: F2.weights.bold, color: C2.text, letterSpacing: -0.4 }}>{u.fullName}</div>
              <div style={{ fontSize: F2.sizes.sm, color: C2.textSec, marginTop: 2 }}>+91 {u.phone}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {roles.includes('owner') && <RoleChip role="owner" />}
              {roles.includes('tenant') && <RoleChip role="tenant" />}
            </div>
          </div>
        </Card>

        {/* Personal Information — collected during Profile Setup */}
        <TappableCard title="Personal Information" onClick={() => nav && nav.go('personal-info')}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Legal name" value={u.fullName} />
            <InfoRow label="Phone" value={`+91 ${u.phone}`} />
            <InfoRow label="Acting as" value={rolesLabel(roles)} isLast />
          </div>
        </TappableCard>

        {/* Identity Verification — collected during KYC */}
        <TappableCard
          title="Identity Verification"
          onClick={() => nav && nav.go('kyc-details', { state: kycState })}
        >
          <div style={{ padding: '12px 16px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <KycStatusIcon state={kycState} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <KycBadge state={kycState} />
              </div>
              <div style={{
                fontSize: F2.sizes.sm, color: C2.textSec, marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{kycSubLine}</div>
            </div>
          </div>
          {kycState === 'pending' && (
            <div style={{
              borderTop: `1px solid ${C2.border}`,
              padding: '10px 16px', fontSize: F2.sizes.sm, color: C2.textSec, lineHeight: 1.45,
            }}>
              Review usually completes within 2–4 hours. You'll get an SMS once it's done.
            </div>
          )}
          {kycState === 'rejected' && (
            <div style={{
              borderTop: `1px solid ${C2.border}`,
              padding: '10px 16px', fontSize: F2.sizes.sm, color: C2.danger, lineHeight: 1.45,
            }}>
              Your last submission was rejected — tap to re-submit with a clearer photo.
            </div>
          )}
        </TappableCard>

        {/* Reputation */}
        <Card title="Reputation Score">
          <ReputationBadge score={4.8} reviews={12} hasReviews={hasReputation} />
        </Card>

        {/* Agreement overview */}
        <Card title="Agreement Overview">
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 10, marginBottom: 12,
          }}>
            <StatusSample status="ACTIVE" count={1} />
            <StatusSample status="PENDING_DEPOSIT" count={1} />
            <StatusSample status="CLOSED" count={1} />
            <StatusSample status="DISPUTED" count={0} />
          </div>
          <div style={{ fontSize: F2.sizes.sm, color: C2.textSec }}>
            Tap an agreement on the home screen for details.
          </div>
        </Card>

        <Button variant="secondary" fullWidth onClick={() => nav && nav.reset('phone')}>
          Sign Out
        </Button>
        <div style={{ height: 24 }} />
      </ScrollBody>
      <TabBar active="profile" role={(u.roles||['tenant']).includes('owner') ? (u.roles.includes('tenant') ? 'both' : 'owner') : 'tenant'} notifCount={3} onChange={(t) => { if (t === 'profile') return; if (t === 'home') nav && nav.go('home'); else if (t === 'browse') nav && nav.go('browse'); else if (t === 'notifications') nav && nav.go('notifications'); }} />
    </Screen>
  );
}

// Wraps Card with a click-affordance: chevron, hover bg, full-row press.
function TappableCard({ title, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: R2.md, border: `1px solid ${C2.border}`,
        overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.12s, transform 0.08s',
        fontFamily: F2.family,
      }}
      onMouseDown={(e) => onClick && (e.currentTarget.style.background = C2.surface)}
      onMouseUp={(e) => (e.currentTarget.style.background = '#fff')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
    >
      {title && (
        <div style={{
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: F2.sizes.xs, fontWeight: F2.weights.semibold, color: C2.textSec,
          textTransform: 'uppercase', letterSpacing: 0.6,
          borderBottom: `1px solid ${C2.border}`,
        }}>
          <span>{title}</span>
          {onClick && (
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1l6 6-6 6" stroke={C2.textDis} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function RoleChip({ role }) {
  const cfg = role === 'owner'
    ? { label: 'Property Owner', icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 12V6L7 2L12 6V12H8V8H6V12H2Z" stroke={C2.text} strokeWidth="1.6" strokeLinejoin="round"/>
        </svg>
      ) }
    : { label: 'Tenant', icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="4" width="10" height="8" rx="1.5" stroke={C2.text} strokeWidth="1.6"/>
          <path d="M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1" stroke={C2.text} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ) };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', background: '#fff',
      borderRadius: R2.full, border: `1px solid ${C2.border}`,
      fontSize: F2.sizes.sm, fontWeight: F2.weights.medium, color: C2.text,
    }}>
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

function KycStatusIcon({ state }) {
  const cfg = {
    verified: { bg: C2.successLight, fg: C2.success, icon: 'check' },
    pending: { bg: C2.warningLight, fg: C2.warning, icon: 'clock' },
    rejected: { bg: C2.dangerLight, fg: C2.danger, icon: 'x' },
  }[state] || { bg: C2.surface, fg: C2.textSec, icon: 'clock' };
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: cfg.bg, color: cfg.fg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {cfg.icon === 'check' && (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M5 11.5L9 15.5L17 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {cfg.icon === 'clock' && (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M11 6.5V11l3 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {cfg.icon === 'x' && (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M7 7L15 15M15 7L7 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

function rolesLabel(roles) {
  if (!roles || !roles.length) return '—';
  if (roles.length === 2) return 'Tenant & Owner';
  return roles[0] === 'owner' ? 'Property Owner' : 'Tenant';
}

// Sample logged-in user — what we'd populate from the onboarding flow.
window.SAMPLE_USER = {
  fullName: 'Rohan Mehta',
  phone: '98765 43210',
  phoneVerifiedAt: '14 Jan 2025',
  roles: ['tenant'],
  joinedAt: '14 Jan 2025',
  kyc: {
    docType: 'aadhaar',
    docLabel: 'Aadhaar Card',
    submittedAt: '15 Jan 2025, 3:42 PM',
    verifiedAt: '16 Jan 2025, 9:18 AM',
    aadhaarLast4: '1234',
  },
};

function StatusSample({ status, count }) {
  return (
    <div style={{
      padding: 12, background: C2.surface, borderRadius: R2.sm,
      border: `1px solid ${C2.border}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <StatusChip status={status} size="sm" />
      <div style={{ fontSize: F2.sizes.xs, color: C2.textSec, fontFamily: F2.family }}>
        {count} {count === 1 ? 'agreement' : 'agreements'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 5 — Create Agreement
// ─────────────────────────────────────────────────────────────
function CreateAgreementScreen({ nav }) {
  const [form, setForm] = React.useState({
    address: '', rent: '', deposit: '', startDate: '', endDate: '', counterparty: '',
  });
  const [loading, setLoading] = React.useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); nav && nav.go('detail', { id: 'agr_002' }); }, 1000);
  };

  return (
    <Screen>
      <NavHeader title="Create Agreement" onBack={() => nav && nav.back()} />
      <ScrollBody padding={20} gap={24}>
        <div>
          <SectionHeader>Property Details</SectionHeader>
          <TextInput
            label="Property Address" multiline rows={2}
            placeholder="12 MG Road, Bengaluru, Karnataka 560001"
            value={form.address} onChange={set('address')}
          />
        </div>

        <div>
          <SectionHeader>Financials</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextInput
              label="Monthly Rent" prefix="₹" placeholder="25,000"
              keyboardType="numeric"
              value={form.rent} onChange={set('rent')}
            />
            <TextInput
              label="Security Deposit" prefix="₹" placeholder="75,000"
              keyboardType="numeric"
              hint="Typically 2–3 months' rent"
              value={form.deposit} onChange={set('deposit')}
            />
          </div>
        </div>

        <div>
          <SectionHeader>Lease Period</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextInput
              label="Start Date" placeholder="2025-01-01"
              hint="Format: YYYY-MM-DD"
              value={form.startDate} onChange={set('startDate')}
            />
            <TextInput
              label="End Date" placeholder="2025-12-31"
              value={form.endDate} onChange={set('endDate')}
            />
          </div>
        </div>

        <div>
          <SectionHeader>Counterparty</SectionHeader>
          <TextInput
            label="Counterparty Phone" placeholder="98765 43210"
            keyboardType="phone"
            hint="They'll receive an SMS to join and confirm."
            value={form.counterparty} onChange={set('counterparty')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <Button fullWidth loading={loading} onClick={handleCreate}>
            {loading ? 'Creating…' : 'Create Agreement'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => nav && nav.back()}>
            Cancel
          </Button>
        </div>
        <div style={{ height: 8 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 6 — Agreement Detail
// ─────────────────────────────────────────────────────────────
function AgreementDetailScreen({ nav, agreementId = 'agr_001', viewerRole = 'tenant' }) {
  const a = window.SAMPLE_AGREEMENTS.find((x) => x.id === agreementId) || window.SAMPLE_AGREEMENTS[0];

  const renderAction = () => {
    if (a.status === 'DRAFT' && !a.tenantConfirmed) {
      return <Button fullWidth onClick={() => nav && nav.go('confirm', { id: a.id })}>Confirm Agreement</Button>;
    }
    if (a.status === 'PENDING_DEPOSIT' && viewerRole === 'tenant') {
      return <Button fullWidth onClick={() => nav && nav.go('payment', { id: a.id })}>Pay Security Deposit</Button>;
    }
    if (a.status === 'ACTIVE') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {viewerRole === 'owner' && <Button fullWidth>Release Deposit</Button>}
          <Button variant="destructive" fullWidth onClick={() => nav && nav.go('dispute', { id: a.id })}>
            Raise Dispute
          </Button>
        </div>
      );
    }
    if (a.status === 'CLOSED') {
      return <Button variant="secondary" fullWidth>Rate Experience</Button>;
    }
    return null;
  };

  return (
    <Screen bg={C2.surface}>
      <NavHeader title="Agreement" onBack={() => nav && nav.back()} bg={C2.surface} />
      <ScrollBody padding={20} gap={14} bg={C2.surface}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusChip status={a.status} />
          <span style={{
            fontSize: F2.sizes.sm, color: C2.textSec, fontStyle: 'italic',
            fontFamily: F2.family,
          }}>Token {a.tokenId}</span>
        </div>

        <Card title="Property">
          <div style={{ fontSize: F2.sizes.base, fontWeight: F2.weights.semibold, color: C2.text, letterSpacing: -0.3, lineHeight: 1.4 }}>
            {a.address}
          </div>
        </Card>

        <Card title="Parties" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Tenant" value={a.tenant} highlight={viewerRole === 'tenant'} />
            <InfoRow label="Owner" value={a.owner} highlight={viewerRole === 'owner'} isLast />
          </div>
        </Card>

        <Card title="Financials" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Monthly Rent" value={window.formatINR(a.rent)} />
            <InfoRow label="Security Deposit" value={window.formatINR(a.deposit)} isLast />
          </div>
        </Card>

        <Card title="Lease Period" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Start" value={a.startDate} />
            <InfoRow label="End" value={a.endDate} isLast />
          </div>
        </Card>

        <Card title="Confirmations" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Tenant" value={a.tenantConfirmed ? `✓ ${a.tenantConfirmed}` : '⏳ Pending'} />
            <InfoRow label="Owner" value={a.ownerConfirmed ? `✓ ${a.ownerConfirmed}` : '⏳ Pending'} isLast />
          </div>
        </Card>

        <div style={{ paddingTop: 4 }}>{renderAction()}</div>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 7 — UPI Payment
// ─────────────────────────────────────────────────────────────
function PaymentScreen({ nav, agreementId = 'agr_002', initialPaymentState = 'idle' }) {
  const a = window.SAMPLE_AGREEMENTS.find((x) => x.id === agreementId) || window.SAMPLE_AGREEMENTS[1];
  const [state, setState] = React.useState(initialPaymentState);
  const orderId = 'TN-' + Math.random().toString(36).slice(2, 10).toUpperCase();

  const renderBody = () => {
    if (state === 'idle') {
      return <Button fullWidth onClick={() => setState('initiating')}>Initiate Payment</Button>;
    }
    if (state === 'initiating') {
      return <Button fullWidth loading disabled>Opening UPI…</Button>;
    }
    if (state === 'awaiting') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
          <div style={{ fontSize: F2.sizes.base, fontWeight: F2.weights.semibold, color: C2.text }}>
            Open your UPI app to pay
          </div>
          <div style={{ fontSize: F2.sizes.xs, color: C2.textDis, fontFamily: 'ui-monospace, "SF Mono", monospace' }}>
            Order ID: {orderId}
          </div>
          <Button fullWidth onClick={() => setState('polling')}>Open UPI App</Button>
          <Button variant="secondary" fullWidth onClick={() => setState('polling')}>
            I've Paid — Check Status
          </Button>
        </div>
      );
    }
    if (state === 'polling') {
      return (
        <div style={{
          background: C2.primaryLight, border: `1px solid ${C2.primaryBorder}`,
          borderRadius: R2.md, padding: 20, textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <Spinner color={C2.primary} size={28} />
          <div>
            <div style={{ fontSize: F2.sizes.md, fontWeight: F2.weights.semibold, color: '#1E40AF' }}>
              Waiting for payment confirmation…
            </div>
            <div style={{ fontSize: F2.sizes.sm, color: '#3B82F6', marginTop: 4 }}>
              This usually takes 30–60 seconds.
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setState('confirmed')}>
            (Demo) skip to confirmed →
          </Button>
        </div>
      );
    }
    if (state === 'confirmed') {
      return (
        <div style={{
          background: C2.successLight, border: `1px solid ${C2.successBorder}`,
          borderRadius: R2.md, padding: 24, textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: C2.success, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 16L14 22L24 10" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: F2.sizes.lg, fontWeight: F2.weights.bold, color: C2.successDark, letterSpacing: -0.3 }}>
              Payment Confirmed!
            </div>
            <div style={{ fontSize: F2.sizes.sm, color: '#15803D', marginTop: 6, lineHeight: 1.45 }}>
              Your deposit is now locked in secure escrow. It will be returned when your lease ends.
            </div>
          </div>
          <Button fullWidth onClick={() => nav && nav.reset('home')}>View Agreement</Button>
        </div>
      );
    }
  };

  return (
    <Screen bg={C2.surface}>
      <NavHeader title="Pay Deposit" onBack={() => nav && nav.back()} bg={C2.surface} />
      <ScrollBody padding={20} gap={20} bg={C2.surface}>
        {/* Amount card */}
        <div style={{
          background: `linear-gradient(135deg, ${C2.primary} 0%, #1D4ED8 100%)`,
          borderRadius: R2.lg, padding: '28px 20px',
          textAlign: 'center', color: '#fff',
          boxShadow: '0 10px 24px rgba(37,99,235,0.25)',
        }}>
          <div style={{ fontSize: F2.sizes.sm, opacity: 0.85, fontWeight: F2.weights.medium, letterSpacing: 0.3 }}>
            Security Deposit
          </div>
          <div style={{
            fontSize: 40, fontWeight: 800, letterSpacing: -1,
            marginTop: 8, marginBottom: 12,
            fontVariantNumeric: 'tabular-nums',
          }}>{window.formatINR(a.deposit)}</div>
          <div style={{
            fontSize: F2.sizes.xs, opacity: 0.75, lineHeight: 1.5,
            maxWidth: 260, margin: '0 auto',
          }}>
            This amount will be locked in a secure escrow and returned at lease end, minus any agreed deductions.
          </div>
        </div>

        {renderBody()}

        {state !== 'confirmed' && (
          <Button variant="secondary" fullWidth onClick={() => nav && nav.back()}>
            Cancel
          </Button>
        )}
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 8 — Raise Dispute
// ─────────────────────────────────────────────────────────────
function DisputeScreen({ nav }) {
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const count = reason.length;
  const minOk = count >= 20;
  return (
    <Screen>
      <NavHeader title="Raise Dispute" onBack={() => nav && nav.back()} />
      <ScrollBody padding={20} gap={20}>
        <Banner variant="danger" title="Raise a Formal Dispute">
          Raising a dispute will freeze the escrow. An admin will review your case and determine how the deposit is distributed.
        </Banner>

        <TextInput
          label="Reason for Dispute"
          multiline rows={6}
          placeholder="Describe what happened…"
          value={reason} onChange={setReason}
          hint={`${count} characters (minimum 20)`}
          error={count > 0 && !minOk ? null : null}
        />

        <div>
          <div style={{
            fontSize: F2.sizes.sm, fontWeight: F2.weights.semibold,
            color: '#374151', marginBottom: 10, fontFamily: F2.family,
          }}>What to include</div>
          <ul style={{
            margin: 0, padding: 0, listStyle: 'none',
            display: 'flex', flexDirection: 'column', gap: 8,
            fontSize: F2.sizes.sm, color: C2.textSec,
          }}>
            {[
              'Date when the issue started',
              'What was agreed vs. what happened',
              'Any evidence — photos, messages (upload after submitting)',
              'Amount you believe you are owed',
            ].map((t) => (
              <li key={t} style={{ display: 'flex', gap: 10, lineHeight: 1.45 }}>
                <span style={{ color: C2.textDis }}>•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <Button
            variant="destructive" fullWidth
            disabled={!minOk}
            loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => { setLoading(false); nav && nav.back(); }, 900);
            }}
          >
            {loading ? 'Submitting…' : 'Submit Dispute'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => nav && nav.back()}>
            Cancel
          </Button>
        </div>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 9 — Confirm Agreement
// ─────────────────────────────────────────────────────────────
function ConfirmAgreementScreen({ nav, agreementId = 'agr_003' }) {
  const a = window.SAMPLE_AGREEMENTS.find((x) => x.id === agreementId) || window.SAMPLE_AGREEMENTS[2];
  const [agreed, setAgreed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  return (
    <Screen>
      <NavHeader title="Confirm Agreement" onBack={() => nav && nav.back()} />
      <ScrollBody padding={20} gap={16}>
        <Banner variant="info">
          Review the agreement terms carefully before confirming. Your signature is legally binding.
        </Banner>

        <Card title="Property">
          <div style={{ fontSize: F2.sizes.base, fontWeight: F2.weights.semibold, color: C2.text, letterSpacing: -0.3, lineHeight: 1.4 }}>
            {a.address}
          </div>
        </Card>

        <Card title="Parties" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Tenant" value={a.tenant} highlight />
            <InfoRow label="Owner" value={a.owner} isLast />
          </div>
        </Card>

        <Card title="Financials" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Monthly Rent" value={window.formatINR(a.rent)} />
            <InfoRow label="Security Deposit" value={window.formatINR(a.deposit)} isLast />
          </div>
        </Card>

        <Card title="Lease Period" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Start" value={a.startDate} />
            <InfoRow label="End" value={a.endDate} isLast />
          </div>
        </Card>

        <div style={{
          background: C2.surface, border: `1px solid ${C2.border}`,
          borderRadius: R2.md, padding: 14,
        }}>
          <Checkbox checked={agreed} onChange={setAgreed}>
            <span style={{ fontSize: F2.sizes.md, color: C2.text, lineHeight: 1.45 }}>
              I have read and agree to the terms of this rental agreement.
            </span>
          </Checkbox>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <Button fullWidth disabled={!agreed} loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => { setLoading(false); nav && nav.go('detail', { id: a.id }); }, 900);
            }}>
            {loading ? 'Signing…' : 'Confirm & Sign'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => nav && nav.back()}>
            Cancel
          </Button>
        </div>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

Object.assign(window, {
  Screen, ScrollBody,
  PhoneEntryScreen, OtpScreen, HomeScreen, ProfileScreen,
  CreateAgreementScreen, AgreementDetailScreen, PaymentScreen,
  DisputeScreen, ConfirmAgreementScreen,
});
