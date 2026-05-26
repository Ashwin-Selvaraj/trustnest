// TrustNest Profile detail screens — 4A Personal Info, 4B Identity Verification
// Drill-in views from the Profile tab that surface all collected user data.

const PC = window.TN.color;
const PF = window.TN.font;
const PR = window.TN.radius;

// ─────────────────────────────────────────────────────────────
// SCREEN 4A — Personal Information
// Editable view of everything captured during Profile Setup.
// ─────────────────────────────────────────────────────────────
function PersonalInfoScreen({ nav, user = window.SAMPLE_USER, initialEditing = false }) {
  const u = user || window.SAMPLE_USER;
  const [editing, setEditing] = React.useState(initialEditing);
  const [form, setForm] = React.useState({
    fullName: u.fullName,
    roles: { owner: u.roles.includes('owner'), tenant: u.roles.includes('tenant') },
  });
  const [saving, setSaving] = React.useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setEditing(false); }, 600);
  };

  if (editing) {
    return (
      <Screen>
        <NavHeader
          onBack={() => setEditing(false)}
          title="Edit Personal Info"
          right={null}
        />
        <ScrollBody padding={20} gap={20}>
          <Banner variant="info">
            Your name appears on every rental agreement. Updates apply to new agreements only — existing ones keep the name you signed with.
          </Banner>

          <TextInput
            label="Full Name"
            value={form.fullName}
            onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            hint="Enter your name exactly as it appears on your government ID."
          />

          <div>
            <div style={{
              fontSize: PF.sizes.sm, fontWeight: PF.weights.semibold,
              color: '#374151', textTransform: 'uppercase',
              letterSpacing: 0.8, fontFamily: PF.family, marginBottom: 10,
            }}>I am a…</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SelectableCard
                selected={form.roles.owner}
                onSelect={() => setForm((f) => ({ ...f, roles: { ...f.roles, owner: !f.roles.owner } }))}
                icon={
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 19V8L11 3L19 8V19M8 19V13H14V19" stroke={form.roles.owner ? PC.primary : PC.text} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
                  </svg>
                }
                title="Property Owner"
                subtitle="I own properties and want to rent them out"
              />
              <SelectableCard
                selected={form.roles.tenant}
                onSelect={() => setForm((f) => ({ ...f, roles: { ...f.roles, tenant: !f.roles.tenant } }))}
                icon={
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="6" width="16" height="12" rx="2" stroke={form.roles.tenant ? PC.primary : PC.text} strokeWidth="1.8"/>
                    <path d="M8 6V5a2 2 0 012-2h2a2 2 0 012 2v1" stroke={form.roles.tenant ? PC.primary : PC.text} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                }
                title="Tenant"
                subtitle="I'm looking to rent a property"
              />
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button fullWidth loading={saving}
              disabled={!form.fullName.trim() || (!form.roles.owner && !form.roles.tenant)}
              onClick={handleSave}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <div style={{ height: 16 }} />
        </ScrollBody>
      </Screen>
    );
  }

  return (
    <Screen bg={PC.surface}>
      <NavHeader
        onBack={() => nav && nav.back()}
        title="Personal Information"
        bg={PC.surface}
        right={
          <button onClick={() => setEditing(true)} style={{
            border: 'none', background: 'transparent', color: PC.primary,
            fontSize: PF.sizes.base, fontWeight: PF.weights.semibold,
            fontFamily: PF.family, cursor: 'pointer', padding: '8px 4px',
          }}>Edit</button>
        }
      />
      <ScrollBody padding={20} gap={14} bg={PC.surface}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 4px' }}>
          <Avatar name={u.fullName} size={72} />
          <div style={{ fontSize: PF.sizes.lg, fontWeight: PF.weights.bold, color: PC.text, letterSpacing: -0.4 }}>
            {u.fullName}
          </div>
        </div>

        <Card title="Account" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Legal name" value={u.fullName} />
            <InfoRowVerified
              label="Phone number"
              value={`+91 ${u.phone}`}
              verifiedAt={u.phoneVerifiedAt}
            />
            <InfoRow label="Acting as" value={rolesValueLabel(u.roles)} />
            <InfoRow label="Member since" value={u.joinedAt} isLast />
          </div>
        </Card>

        <Card title="On your agreements">
          <div style={{ fontSize: PF.sizes.sm, color: PC.textSec, lineHeight: 1.5 }}>
            Every rental agreement you sign will use the name{' '}
            <span style={{ color: PC.text, fontWeight: PF.weights.semibold }}>{u.fullName}</span>
            {' '}and phone{' '}
            <span style={{ color: PC.text, fontWeight: PF.weights.semibold }}>+91 {u.phone}</span>. Changes
            here won't affect agreements you've already signed.
          </div>
        </Card>

        <Card title="Danger zone" padding={0}>
          <div style={{ padding: '16px' }}>
            <Button variant="secondary" fullWidth onClick={() => {}}>
              Delete account
            </Button>
            <div style={{ fontSize: PF.sizes.sm, color: PC.textSec, marginTop: 10, lineHeight: 1.45 }}>
              Only available once you have no active or pending agreements.
            </div>
          </div>
        </Card>

        <div style={{ height: 8 }} />
      </ScrollBody>
    </Screen>
  );
}

function InfoRowVerified({ label, value, verifiedAt, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${PC.border}`,
      gap: 16,
    }}>
      <span style={{ fontSize: PF.sizes.md, color: PC.textSec, fontFamily: PF.family }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: PF.sizes.md, fontWeight: PF.weights.medium, color: PC.text, fontFamily: PF.family }}>{value}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: PF.sizes.xs, color: PC.success, fontWeight: PF.weights.semibold,
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="5" fill={PC.success} opacity="0.15"/>
            <path d="M3 5.5L4.5 7L8 3.8" stroke={PC.success} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Verified {verifiedAt}
        </span>
      </div>
    </div>
  );
}

function rolesValueLabel(roles) {
  if (!roles || !roles.length) return '—';
  if (roles.length === 2) return 'Tenant & Property Owner';
  return roles[0] === 'owner' ? 'Property Owner' : 'Tenant';
}

// ─────────────────────────────────────────────────────────────
// SCREEN 4B — Identity Verification details
// Audit trail of what was submitted, when, and who reviewed.
// ─────────────────────────────────────────────────────────────
function KycDetailsScreen({ nav, user = window.SAMPLE_USER, state = 'verified' }) {
  const u = user || window.SAMPLE_USER;
  const k = u.kyc || {};

  const statusBlock = {
    verified: {
      bg: PC.successLight, border: PC.successBorder, fg: PC.successDark,
      title: 'Identity verified',
      body: `Your ${k.docLabel || 'ID'} was successfully verified. You can now create and sign rental agreements.`,
    },
    pending: {
      bg: PC.warningLight, border: '#FDE68A', fg: '#78350F',
      title: 'Verification in progress',
      body: "We're reviewing your documents. This usually takes 2–4 hours. You'll get an SMS once it's done.",
    },
    rejected: {
      bg: PC.dangerLight, border: PC.dangerBorder, fg: PC.dangerDeep,
      title: 'Verification rejected',
      body: 'The photo of your ID was unclear or did not match the selfie. Re-submit with a clearer document photo and good lighting.',
    },
  }[state];

  return (
    <Screen bg={PC.surface}>
      <NavHeader onBack={() => nav && nav.back()} title="Identity Verification" bg={PC.surface} />
      <ScrollBody padding={20} gap={14} bg={PC.surface}>
        {/* status hero */}
        <div style={{
          background: statusBlock.bg,
          border: `1px solid ${statusBlock.border}`,
          borderRadius: PR.md, padding: 18,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <KycStatusIcon state={state} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: PF.sizes.md, fontWeight: PF.weights.bold, color: statusBlock.fg, letterSpacing: -0.2 }}>
              {statusBlock.title}
            </div>
            <div style={{ fontSize: PF.sizes.sm, color: statusBlock.fg, opacity: 0.85, marginTop: 6, lineHeight: 1.5 }}>
              {statusBlock.body}
            </div>
          </div>
        </div>

        {/* Audit trail */}
        <Card title="Submission details" padding={0}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="ID type submitted" value={k.docLabel || 'Aadhaar Card'} />
            {k.aadhaarLast4 && (
              <InfoRow
                label="ID number"
                value={`XXXX XXXX ${k.aadhaarLast4}`}
              />
            )}
            <InfoRow label="Submitted at" value={k.submittedAt || '15 Jan 2025, 3:42 PM'} />
            {state === 'verified' && (
              <InfoRow label="Verified at" value={k.verifiedAt || '16 Jan 2025, 9:18 AM'} />
            )}
            {state === 'rejected' && (
              <InfoRow label="Reviewed at" value={k.verifiedAt || '16 Jan 2025, 9:18 AM'} />
            )}
            <InfoRowReviewer
              label="Reviewed by"
              isLast
              text={state === 'pending' ? 'TrustNest verification team' : 'TrustNest verification team'}
              hint={state === 'pending' ? 'Auto + manual review' : 'Auto-matched via UIDAI'}
            />
          </div>
        </Card>

        {/* Documents on file */}
        <Card title="Documents on file" padding={0}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DocRow
              kind="ID front"
              sub={`${k.docLabel || 'Aadhaar Card'} · front side`}
              variant="id-front"
            />
            {k.docType === 'aadhaar' && (
              <DocRow
                kind="ID back"
                sub={`${k.docLabel || 'Aadhaar Card'} · back side`}
                variant="id-back"
              />
            )}
            <DocRow
              kind="Selfie"
              sub="Liveness check"
              variant="selfie"
              isLast
            />
          </div>
        </Card>

        <div style={{
          padding: '10px 4px', fontSize: PF.sizes.sm, color: PC.textSec,
          lineHeight: 1.5, display: 'flex', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <rect x="3" y="7" width="10" height="6" rx="1.5" stroke={PC.textSec} strokeWidth="1.4"/>
            <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke={PC.textSec} strokeWidth="1.4"/>
          </svg>
          Your documents are encrypted at rest and never shared with landlords, tenants, or third parties.
        </div>

        {state === 'rejected' && (
          <Button fullWidth onClick={() => nav && nav.go('kyc-document')}>
            Re-submit documents
          </Button>
        )}
        {state === 'pending' && (
          <Button variant="secondary" fullWidth disabled>
            Submitted — awaiting review
          </Button>
        )}
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

function InfoRowReviewer({ label, text, hint, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${PC.border}`,
      gap: 16,
    }}>
      <span style={{ fontSize: PF.sizes.md, color: PC.textSec, fontFamily: PF.family }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: PF.sizes.md, fontWeight: PF.weights.medium, color: PC.text }}>{text}</span>
        {hint && <span style={{ fontSize: PF.sizes.xs, color: PC.textSec }}>{hint}</span>}
      </div>
    </div>
  );
}

function DocRow({ kind, sub, variant, isLast = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : `1px solid ${PC.border}`,
    }}>
      <DocThumb variant={variant} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: PF.sizes.md, fontWeight: PF.weights.semibold, color: PC.text, letterSpacing: -0.2 }}>{kind}</div>
        <div style={{ fontSize: PF.sizes.sm, color: PC.textSec, marginTop: 2 }}>{sub}</div>
      </div>
      <button style={{
        border: 'none', background: 'transparent', color: PC.primary,
        fontSize: PF.sizes.sm, fontWeight: PF.weights.semibold,
        fontFamily: PF.family, cursor: 'pointer', padding: 6,
        display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        View
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
          <path d="M1 1l4 4-4 4" stroke={PC.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function DocThumb({ variant }) {
  // Each thumb is a small (56×40 or 56×56) miniaturized rendering — not the
  // actual photo, just a recognisable placeholder so users see "yes, a
  // document is on file" without us inventing fake images.
  if (variant === 'selfie') {
    return (
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 38%, #475569 0%, #1E293B 70%)',
        border: `2px solid ${PC.border}`,
        overflow: 'hidden', flexShrink: 0, position: 'relative',
      }}>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="28" cy="22" r="10" fill="rgba(255,255,255,0.2)" />
          <path d="M10 56C10 42 18 36 28 36 38 36 46 42 46 56Z" fill="rgba(255,255,255,0.2)" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{
      width: 56, height: 40, borderRadius: 6, flexShrink: 0,
      background: variant === 'id-back' ? '#E0F2FE' : '#FEF3C7',
      border: `1px solid ${PC.border}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {variant === 'id-front' && (
        <>
          <div style={{ position: 'absolute', top: 5, left: 5, width: 14, height: 18, background: '#FBBF24', borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: 6, left: 22, right: 4, height: 3, background: '#92400E', opacity: 0.6, borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: 13, left: 22, right: 6, height: 2, background: '#92400E', opacity: 0.4, borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: 18, left: 22, right: 10, height: 2, background: '#92400E', opacity: 0.4, borderRadius: 1 }} />
          <div style={{ position: 'absolute', bottom: 4, left: 5, right: 5, height: 4, background: '#92400E', opacity: 0.35, borderRadius: 1 }} />
        </>
      )}
      {variant === 'id-back' && (
        <>
          <div style={{ position: 'absolute', top: 5, left: 5, right: 5, height: 8, background: 'repeating-linear-gradient(90deg, #0C4A6E 0, #0C4A6E 2px, transparent 2px, transparent 4px)', opacity: 0.5, borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: 17, left: 5, right: 14, height: 2, background: '#0C4A6E', opacity: 0.4, borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: 22, left: 5, right: 18, height: 2, background: '#0C4A6E', opacity: 0.4, borderRadius: 1 }} />
          <div style={{ position: 'absolute', bottom: 4, left: 5, right: 5, height: 6, background: '#0C4A6E', opacity: 0.3, borderRadius: 1 }} />
        </>
      )}
    </div>
  );
}

Object.assign(window, {
  PersonalInfoScreen, KycDetailsScreen,
});
