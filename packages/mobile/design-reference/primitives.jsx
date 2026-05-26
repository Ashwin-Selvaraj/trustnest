// TrustNest UI primitives — match component library spec exactly
// All components are React (not RN), but styled to match RN/iOS look.

const { useState, useEffect, useRef } = React;
const C = window.TN.color;
const F = window.TN.font;
const R = window.TN.radius;

// ─────────────────────────────────────────────────────────────
// Button — primary | secondary | destructive
// ─────────────────────────────────────────────────────────────
function Button({
  variant = 'primary', children, fullWidth = false, loading = false,
  disabled = false, onClick, size = 'md', style = {},
}) {
  const [pressed, setPressed] = useState(false);
  const variants = {
    primary: { bg: C.primary, fg: '#fff', border: C.primary, pressed: '#1D4ED8' },
    secondary: { bg: '#fff', fg: C.text, border: C.borderStrong, pressed: C.surface },
    destructive: { bg: C.danger, fg: '#fff', border: C.danger, pressed: '#B91C1C' },
    ghost: { bg: 'transparent', fg: C.primary, border: 'transparent', pressed: C.primaryLight },
  };
  const v = variants[variant];
  const isDisabled = disabled || loading;
  const h = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      disabled={isDisabled}
      style={{
        height: h,
        width: fullWidth ? '100%' : 'auto',
        minWidth: fullWidth ? 0 : 120,
        padding: '0 20px',
        background: pressed && !isDisabled ? v.pressed : v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: R.md,
        fontFamily: F.family,
        fontSize: F.sizes.base,
        fontWeight: F.weights.semibold,
        letterSpacing: -0.2,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled && !loading ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background 0.12s, transform 0.08s',
        transform: pressed && !isDisabled ? 'scale(0.985)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {loading && <Spinner color={v.fg} />}
      {children}
    </button>
  );
}

function Spinner({ color = '#fff', size = 16 }) {
  return (
    <span
      style={{
        display: 'inline-block', width: size, height: size,
        border: `2px solid ${color}`, borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'tn-spin 0.7s linear infinite',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// TextInput
// ─────────────────────────────────────────────────────────────
function TextInput({
  label, hint, error, value, onChange, placeholder, prefix,
  multiline = false, rows = 1, keyboardType = 'default', maxLength,
  autoFocus = false,
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? C.danger : focused ? C.primary : C.borderStrong;
  const Tag = multiline ? 'textarea' : 'input';
  const inputType = keyboardType === 'phone' ? 'tel' : keyboardType === 'numeric' ? 'text' : 'text';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label style={{
          fontSize: F.sizes.sm, fontWeight: F.weights.medium, color: C.text,
          fontFamily: F.family, letterSpacing: -0.1,
        }}>{label}</label>
      )}
      <div style={{
        display: 'flex', alignItems: multiline ? 'flex-start' : 'center',
        border: `1.5px solid ${borderColor}`,
        background: '#fff',
        borderRadius: R.md,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(220,38,38,0.12)' : 'rgba(37,99,235,0.12)'}` : 'none',
        overflow: 'hidden',
      }}>
        {prefix && (
          <span style={{
            paddingLeft: 14, paddingRight: 4,
            fontSize: F.sizes.base, fontWeight: F.weights.medium, color: C.textSec,
            fontFamily: F.family, alignSelf: 'center',
            paddingTop: multiline ? 14 : 0,
          }}>{prefix}</span>
        )}
        <Tag
          type={inputType}
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          rows={multiline ? rows : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: multiline ? '12px 14px' : '12px 14px',
            paddingLeft: prefix ? 4 : 14,
            fontSize: F.sizes.base, fontFamily: F.family, color: C.text,
            letterSpacing: -0.2,
            resize: multiline ? 'vertical' : 'none',
            minHeight: multiline ? rows * 22 : 'auto',
            lineHeight: multiline ? 1.45 : 'normal',
          }}
        />
      </div>
      {error ? (
        <span style={{ fontSize: F.sizes.sm, color: C.danger, fontFamily: F.family }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: F.sizes.sm, color: C.textSec, fontFamily: F.family }}>{hint}</span>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusChip
// ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  DRAFT:           { fg: '#374151', bg: '#F3F4F6', label: 'Draft' },
  PENDING_DEPOSIT: { fg: C.warning, bg: C.warningLight, label: 'Pending deposit' },
  ACTIVE:          { fg: C.success, bg: C.successLight, label: 'Active' },
  RELEASING:       { fg: C.primary, bg: C.primaryLight, label: 'Releasing' },
  CLOSED:          { fg: '#374151', bg: '#F3F4F6', label: 'Closed' },
  DISPUTED:        { fg: C.danger, bg: C.dangerLight, label: 'Disputed' },
};

function StatusChip({ status, size = 'md' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  const small = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 8px' : '4px 10px',
      background: s.bg, color: s.fg,
      borderRadius: R.full,
      fontSize: small ? F.sizes.xs : F.sizes.sm,
      fontWeight: F.weights.semibold,
      letterSpacing: 0.1,
      fontFamily: F.family,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: s.fg,
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// AgreementCard
// ─────────────────────────────────────────────────────────────
function AgreementCard({ agreement, viewerRole = 'tenant', onClick }) {
  const { address, status, rent, deposit, tenant, owner, startDate, endDate, tokenId } = agreement;
  const counterpartyLabel = viewerRole === 'tenant' ? 'Your owner' : 'Your tenant';
  const counterpartyName = viewerRole === 'tenant' ? owner : tenant;
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: R.md,
        border: `1px solid ${C.border}`,
        padding: 16, cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: window.TN.shadow.card,
        transition: 'transform 0.1s, box-shadow 0.15s',
        fontFamily: F.family,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          fontSize: F.sizes.base, fontWeight: F.weights.semibold, color: C.text,
          letterSpacing: -0.3, lineHeight: 1.3, flex: 1,
        }}>{address}</div>
        <StatusChip status={status} size="sm" />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: F.sizes.xs, color: C.textSec, fontWeight: F.weights.medium, textTransform: 'uppercase', letterSpacing: 0.4 }}>Rent / mo</div>
          <div style={{ fontSize: F.sizes.md, fontWeight: F.weights.semibold, color: C.text, marginTop: 2 }}>
            {window.formatINR(rent)}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: F.sizes.xs, color: C.textSec, fontWeight: F.weights.medium, textTransform: 'uppercase', letterSpacing: 0.4 }}>Deposit</div>
          <div style={{ fontSize: F.sizes.md, fontWeight: F.weights.semibold, color: C.text, marginTop: 2 }}>
            {window.formatINR(deposit)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: F.sizes.xs, color: C.textSec }}>{counterpartyLabel}</span>
          <span style={{ fontSize: F.sizes.sm, fontWeight: F.weights.medium, color: C.text }}>{counterpartyName}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ fontSize: F.sizes.xs, color: C.textSec }}>Lease</span>
          <span style={{ fontSize: F.sizes.sm, fontWeight: F.weights.medium, color: C.text }}>{startDate} – {endDate}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ReputationBadge
// ─────────────────────────────────────────────────────────────
function ReputationBadge({ score, reviews, hasReviews = true }) {
  const filled = Math.round((score || 0) * 2) / 2;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, fontFamily: F.family,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: R.md,
        background: `linear-gradient(135deg, ${C.primary} 0%, #1E40AF 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', flexShrink: 0,
        boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
      }}>
        <SbtMark />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hasReviews ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: F.sizes.xxl, fontWeight: F.weights.bold, color: C.text, letterSpacing: -0.6, lineHeight: 1 }}>
                {score.toFixed(1)}
              </span>
              <span style={{ fontSize: F.sizes.md, color: C.textSec }}>/ 5.0</span>
            </div>
            <Stars value={filled} />
            <span style={{ fontSize: F.sizes.sm, color: C.textSec, marginTop: 2 }}>{reviews} reviews · verified on-record</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: F.sizes.base, fontWeight: F.weights.semibold, color: C.text }}>No reviews yet</span>
            <span style={{ fontSize: F.sizes.sm, color: C.textSec }}>Your reputation grows with each completed lease.</span>
          </>
        )}
      </div>
    </div>
  );
}

function SbtMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 3L24 8.5V19.5L14 25L4 19.5V8.5L14 3Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" opacity="0.95"/>
      <path d="M14 9.5L18.5 12V17L14 19.5L9.5 17V12L14 9.5Z" fill="#fff" opacity="0.95"/>
    </svg>
  );
}

function Stars({ value = 0, size = 14 }) {
  const stars = [1, 2, 3, 4, 5].map((i) => {
    const f = Math.max(0, Math.min(1, value - (i - 1)));
    return (
      <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
        <Star color={C.border} size={size} />
        {f > 0 && (
          <span style={{ position: 'absolute', inset: 0, width: `${f * 100}%`, overflow: 'hidden' }}>
            <Star color="#F59E0B" size={size} />
          </span>
        )}
      </span>
    );
  });
  return <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>;
}

function Star({ color = '#F59E0B', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ display: 'block' }}>
      <path d="M7 1L8.8 5L13 5.6L10 8.8L10.8 13L7 11L3.2 13L4 8.8L1 5.6L5.2 5L7 1Z" fill={color}/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// OtpInput
// ─────────────────────────────────────────────────────────────
function OtpInput({ value = '', onChange, length = 6, error = false, autoFocus = false }) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const handleChange = (i, val) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = digits.slice();
    next[i] = v || ' ';
    const result = next.join('').replace(/\s+$/, '');
    onChange && onChange(result);
    if (v && i < length - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (text) {
      onChange && onChange(text);
      const focusIdx = Math.min(text.length, length - 1);
      setTimeout(() => inputsRef.current[focusIdx]?.focus(), 0);
      e.preventDefault();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handlePaste}>
      {digits.map((d, i) => {
        const filled = d.trim() !== '';
        return (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={d.trim()}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            inputMode="numeric"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            style={{
              width: 48, height: 56,
              borderRadius: R.md,
              border: `1.5px solid ${error ? C.danger : filled ? C.primary : C.borderStrong}`,
              background: error ? C.dangerLight : '#fff',
              textAlign: 'center',
              fontSize: 26, fontWeight: F.weights.semibold,
              color: error ? C.danger : C.text,
              fontFamily: F.family,
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
              boxShadow: filled && !error ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// InfoRow — used in Agreement Detail
// ─────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight = false, isLast = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
      gap: 16,
    }}>
      <span style={{ fontSize: F.sizes.md, color: C.textSec, fontFamily: F.family }}>{label}</span>
      <span style={{
        fontSize: F.sizes.md, fontWeight: F.weights.medium,
        color: highlight ? C.primary : C.text,
        fontFamily: F.family, textAlign: 'right',
        background: highlight ? C.primaryLight : 'transparent',
        padding: highlight ? '2px 8px' : 0,
        borderRadius: highlight ? R.sm : 0,
      }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card — generic white card section
// ─────────────────────────────────────────────────────────────
function Card({ title, children, style = {}, padding = 16 }) {
  return (
    <div style={{
      background: '#fff', borderRadius: R.md, border: `1px solid ${C.border}`,
      overflow: 'hidden', fontFamily: F.family, ...style,
    }}>
      {title && (
        <div style={{
          padding: '12px 16px',
          fontSize: F.sizes.xs, fontWeight: F.weights.semibold, color: C.textSec,
          textTransform: 'uppercase', letterSpacing: 0.6,
          borderBottom: `1px solid ${C.border}`,
        }}>{title}</div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SectionHeader — uppercase form section label
// ─────────────────────────────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: F.sizes.sm, fontWeight: F.weights.semibold,
      color: C.textSec, textTransform: 'uppercase',
      letterSpacing: 0.8, marginBottom: 12, marginTop: 4,
      fontFamily: F.family,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// NavHeader — back button + title
// ─────────────────────────────────────────────────────────────
function NavHeader({ title, onBack, right, bg = '#fff' }) {
  return (
    <div style={{
      height: 52, display: 'flex', alignItems: 'center',
      padding: '0 8px',
      borderBottom: `1px solid ${C.border}`, background: bg, flexShrink: 0,
      position: 'relative',
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 44, height: 44, border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          padding: '0 8px', cursor: 'pointer', color: C.primary, gap: 2,
          fontSize: F.sizes.base, fontFamily: F.family, fontWeight: F.weights.medium,
        }}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10l8 8" stroke={C.primary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <div style={{
        position: 'absolute', left: 0, right: 0, textAlign: 'center',
        fontSize: F.sizes.base, fontWeight: F.weights.semibold, color: C.text,
        fontFamily: F.family, pointerEvents: 'none', letterSpacing: -0.3,
      }}>{title}</div>
      <div style={{ flex: 1 }} />
      {right && <div style={{ paddingRight: 12 }}>{right}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TabBar — bottom tabs (4 tabs)
// Tab 2 label depends on role: tenant-only → "Browse"; owner / both → "Properties"
// ─────────────────────────────────────────────────────────────
function TabBar({ active, onChange, role = 'tenant', notifCount = 0 }) {
  const browseLabel = role === 'owner' || role === 'both' ? 'Properties' : 'Browse';
  const tabs = [
    { id: 'home', label: 'Home', icon: <IconHome /> },
    { id: 'browse', label: browseLabel, icon: <IconBrowse /> },
    { id: 'notifications', label: 'Alerts', icon: <IconBell />, badge: notifCount },
    { id: 'profile', label: 'Profile', icon: <IconPerson /> },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      paddingBottom: 22, paddingTop: 8, flexShrink: 0,
      display: 'flex',
    }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange && onChange(t.id)}
            style={{
              flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: isActive ? C.primary : C.textSec,
              padding: '6px 0',
              fontFamily: F.family, position: 'relative',
            }}>
            <span style={{ position: 'relative' }}>
              {React.cloneElement(t.icon, { color: isActive ? C.primary : C.textSec })}
              {t.badge > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -8,
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 8, background: C.danger, color: '#fff',
                  fontSize: 10, fontWeight: F.weights.bold,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid #fff', fontFamily: F.family,
                }}>{t.badge > 9 ? '9+' : t.badge}</span>
              )}
            </span>
            <span style={{ fontSize: 10, fontWeight: F.weights.medium }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function IconHome({ color = C.textSec }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 11L12 3L21 11V20a1 1 0 01-1 1h-5v-7h-4v7H4a1 1 0 01-1-1V11z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}
function IconPerson({ color = C.textSec }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function IconBrowse({ color = C.textSec }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8"/>
      <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function IconBell({ color = C.textSec }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M6 9a6 6 0 0112 0v4l2 3H4l2-3V9Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M10 19a2 2 0 004 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// FAB — floating action button
// ─────────────────────────────────────────────────────────────
function FAB({ onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', right: 20, bottom: 96,
      width: 56, height: 56, borderRadius: 28,
      background: C.primary, border: 'none',
      boxShadow: window.TN.shadow.fab,
      cursor: 'pointer', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10,
      ...style,
    }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 4V18M4 11H18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// KYC Badge
// ─────────────────────────────────────────────────────────────
function KycBadge({ state = 'pending' }) {
  const map = {
    pending: { icon: <KycIconClock />, label: 'KYC Pending', fg: C.warning, bg: C.warningLight },
    verified: { icon: <KycIconCheck />, label: 'KYC Verified', fg: C.success, bg: C.successLight },
    rejected: { icon: <KycIconX />, label: 'KYC Rejected', fg: C.danger, bg: C.dangerLight },
  };
  const m = map[state];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px',
      background: m.bg, color: m.fg,
      borderRadius: R.full,
      fontSize: F.sizes.sm, fontWeight: F.weights.semibold,
      fontFamily: F.family,
    }}>
      {m.icon}
      {m.label}
    </span>
  );
}
function KycIconClock() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M7 4V7L9 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>;
}
function KycIconCheck() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.15"/>
    <path d="M4 7L6.2 9.2L10 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function KycIconX() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.15"/>
    <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>;
}

// ─────────────────────────────────────────────────────────────
// Banner — info / warning
// ─────────────────────────────────────────────────────────────
function Banner({ variant = 'info', title, children, icon }) {
  const variants = {
    info:    { bg: C.primaryLight, border: C.primaryBorder, fg: C.text, accent: C.primary },
    warning: { bg: C.warningLight, border: '#FDE68A', fg: '#78350F', accent: C.warning },
    danger:  { bg: C.dangerLight, border: C.dangerBorder, fg: C.dangerDeep, accent: C.danger },
    success: { bg: C.successLight, border: C.successBorder, fg: C.successDark, accent: C.success },
  };
  const v = variants[variant];
  const defaultIcon = {
    info: <BannerIconInfo color={v.accent} />,
    warning: <BannerIconWarn color={v.accent} />,
    danger: <BannerIconWarn color={v.accent} />,
    success: <BannerIconCheck color={v.accent} />,
  }[variant];
  return (
    <div style={{
      background: v.bg, border: `1px solid ${v.border}`,
      borderRadius: R.md, padding: 14,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      fontFamily: F.family,
    }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>{icon || defaultIcon}</div>
      <div style={{ flex: 1, fontSize: F.sizes.sm, lineHeight: 1.5, color: v.fg }}>
        {title && <div style={{ fontWeight: F.weights.semibold, fontSize: F.sizes.md, marginBottom: 2, color: variant === 'danger' ? C.dangerDark : v.fg }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
function BannerIconInfo({ color }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" fill={color} opacity="0.15"/>
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M10 9V14M10 6.5V6.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
function BannerIconWarn({ color }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L19 17H1L10 2Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 8V12M10 14.5V14.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>;
}
function BannerIconCheck({ color }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="9" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
    <path d="M5.5 10L8.5 13L14.5 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

// ─────────────────────────────────────────────────────────────
// Avatar — circle with initial
// ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 80 }) {
  const initial = (name || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${C.primary} 0%, #1E40AF 100%)`,
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: F.weights.semibold,
      fontFamily: F.family, letterSpacing: -0.5,
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
    }}>{initial}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, children }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
      fontFamily: F.family, fontSize: F.sizes.md, color: C.text, lineHeight: 1.4,
      userSelect: 'none',
    }}>
      <span
        onClick={(e) => { e.preventDefault(); onChange && onChange(!checked); }}
        style={{
          width: 22, height: 22, borderRadius: 6,
          background: checked ? C.primary : '#fff',
          border: `1.5px solid ${checked ? C.primary : C.borderStrong}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1,
          transition: 'background 0.12s, border-color 0.12s',
        }}>
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L6 10L11 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span onClick={(e) => { e.preventDefault(); onChange && onChange(!checked); }} style={{ flex: 1 }}>{children}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Logo — TrustNest "house" mark (no emoji — drawn primitive)
// ─────────────────────────────────────────────────────────────
function Logo({ size = 64 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${C.primary} 0%, #1E40AF 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(37,99,235,0.35), 0 2px 4px rgba(37,99,235,0.2)',
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none">
        <path d="M16 4L28 13V27a1 1 0 01-1 1H5a1 1 0 01-1-1V13L16 4Z" fill="#fff" opacity="0.95"/>
        <path d="M12 28V19h8v9" stroke={C.primary} strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="16" cy="14" r="1.5" fill={C.primary}/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SelectableCard — large radio-style card with icon, title, subtitle
// Used for role pick (2B) and ID type pick (2D). Selected state:
//   border 2px primary, blue check at top-right.
// ─────────────────────────────────────────────────────────────
function SelectableCard({
  selected = false, onSelect, icon, title, subtitle, badge, disabled = false,
}) {
  return (
    <button
      onClick={() => !disabled && onSelect && onSelect()}
      disabled={disabled}
      style={{
        position: 'relative', textAlign: 'left',
        width: '100%', padding: selected ? 15 : 16,
        background: '#fff',
        border: selected ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
        borderRadius: R.md,
        display: 'flex', gap: 14, alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.12s, box-shadow 0.12s, background 0.12s',
        boxShadow: selected ? '0 0 0 4px rgba(37,99,235,0.10)' : 'none',
        fontFamily: F.family, color: 'inherit',
      }}
    >
      {icon && (
        <div style={{
          width: 44, height: 44, borderRadius: R.md,
          background: selected ? C.primaryLight : C.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.12s',
        }}>{icon}</div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: F.sizes.base, fontWeight: F.weights.semibold, color: C.text, letterSpacing: -0.2 }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: F.sizes.xs, fontWeight: F.weights.semibold,
              color: C.success, background: C.successLight,
              padding: '2px 8px', borderRadius: R.full,
              letterSpacing: 0.2,
            }}>{badge}</span>
          )}
        </div>
        {subtitle && (
          <span style={{ fontSize: F.sizes.sm, color: C.textSec, lineHeight: 1.4 }}>{subtitle}</span>
        )}
      </div>
      {/* check indicator — always rendered for layout stability */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: selected ? C.primary : 'transparent',
        border: selected ? 'none' : `1.5px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.12s, border-color 0.12s',
      }}>
        {selected && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L6 10L11 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// ProgressBar — slim, 4px, used during KYC stepper
// ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  const pct = Math.max(0, Math.min(1, step / total)) * 100;
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 4, borderRadius: 2, background: C.border, overflow: 'hidden',
      }}>
        <div style={{
          width: pct + '%', height: '100%', background: C.primary,
          borderRadius: 2,
          transition: 'width 0.35s cubic-bezier(.2,.7,.3,1)',
        }} />
      </div>
      <div style={{
        marginTop: 8, fontSize: F.sizes.xs, color: C.textSec,
        fontFamily: F.family, fontWeight: F.weights.medium,
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>Step {step} of {total}</div>
    </div>
  );
}

// Export everything
Object.assign(window, {
  Button, Spinner, TextInput, StatusChip, AgreementCard, ReputationBadge,
  Stars, OtpInput, InfoRow, Card, SectionHeader, NavHeader, TabBar,
  FAB, KycBadge, Banner, Avatar, Checkbox, Logo, STATUS_STYLES,
  IconHome, IconPerson, IconBrowse, IconBell, SelectableCard, ProgressBar,
});
