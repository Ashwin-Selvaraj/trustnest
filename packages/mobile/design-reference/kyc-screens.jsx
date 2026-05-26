// TrustNest KYC onboarding screens — 2B through 2G
// Flow: OTP → profile-setup → kyc-intro → kyc-document → kyc-upload → kyc-selfie → kyc-submitted → home

const KC = window.TN.color;
const KF = window.TN.font;
const KR = window.TN.radius;

// ─── Icons used in role / doc / selfie cards ─────────────────
function IconBuilding({ color = KC.text, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 21V8L12 3L21 8V21M9 21V14H15V21" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="12" cy="10" r="1" fill={color}/>
    </svg>
  );
}
function IconBriefcase({ color = KC.text, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke={color} strokeWidth="1.8"/>
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function IconIdCard({ color = KC.primary, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="5" width="19" height="14" rx="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="8.5" cy="11.5" r="2" stroke={color} strokeWidth="1.6"/>
      <path d="M13 10h6M13 13h4M5.5 16.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconCamera({ color = KC.primary, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 8a2 2 0 012-2h2l1.5-2h7L15 6h4a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8Z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12.5" r="3.5" stroke={color} strokeWidth="1.6"/>
    </svg>
  );
}
function IconClock({ color = KC.primary, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconPassport({ color = KC.text, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="11" r="3" stroke={color} strokeWidth="1.6"/>
      <path d="M8 17h8" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function IconUpload({ color = KC.textDis, size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 21V8M16 8l-5 5M16 8l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 22v3a2 2 0 002 2h16a2 2 0 002-2v-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2B — Profile Setup
// ─────────────────────────────────────────────────────────────
function ProfileSetupScreen({ nav, initialName = '', initialRole = 'none' }) {
  const [name, setName] = React.useState(initialName);
  const [roles, setRoles] = React.useState({
    owner: initialRole === 'owner' || initialRole === 'both',
    tenant: initialRole === 'tenant' || initialRole === 'both',
  });
  const [loading, setLoading] = React.useState(false);
  const canContinue = name.trim().length > 1 && (roles.owner || roles.tenant);

  return (
    <Screen>
      <NavHeader onBack={() => nav && nav.back()} title="" />
      <ScrollBody padding={24} gap={20}>
        <div>
          <h2 style={{ fontSize: KF.sizes.xl, fontWeight: KF.weights.bold, color: KC.text, margin: '4px 0 6px', letterSpacing: -0.5 }}>
            Set up your profile
          </h2>
          <p style={{ fontSize: KF.sizes.md, color: KC.textSec, margin: 0, lineHeight: 1.45 }}>
            This name will appear on all your rental agreements.
          </p>
        </div>

        <TextInput
          label="Full Name"
          placeholder="Rajesh Kumar"
          value={name}
          onChange={setName}
          hint="Enter your name exactly as it appears on your government ID."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            fontSize: KF.sizes.sm, fontWeight: KF.weights.semibold,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: 0.8, fontFamily: KF.family,
          }}>I am a…</div>
          <SelectableCard
            selected={roles.owner}
            onSelect={() => setRoles((r) => ({ ...r, owner: !r.owner }))}
            icon={<IconBuilding color={roles.owner ? KC.primary : KC.text} />}
            title="Property Owner"
            subtitle="I own properties and want to rent them out"
          />
          <SelectableCard
            selected={roles.tenant}
            onSelect={() => setRoles((r) => ({ ...r, tenant: !r.tenant }))}
            icon={<IconBriefcase color={roles.tenant ? KC.primary : KC.text} />}
            title="Tenant"
            subtitle="I'm looking to rent a property"
          />
          {roles.owner && roles.tenant && (
            <div style={{ fontSize: KF.sizes.sm, color: KC.textSec, paddingLeft: 4, lineHeight: 1.4 }}>
              You'll be able to act in both roles.
            </div>
          )}
        </div>

        <div style={{ paddingTop: 4 }}>
          <Button
            fullWidth disabled={!canContinue} loading={loading}
            onClick={() => {
              setLoading(true);
              setTimeout(() => { setLoading(false); nav && nav.go('kyc-intro'); }, 500);
            }}
          >Continue</Button>
        </div>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2C — KYC Intro
// ─────────────────────────────────────────────────────────────
function KycIntroScreen({ nav }) {
  return (
    <Screen>
      <NavHeader onBack={() => nav && nav.back()} title="" />
      <ScrollBody padding={24} gap={20}>
        <div>
          <h2 style={{ fontSize: KF.sizes.xl, fontWeight: KF.weights.bold, color: KC.text, margin: '4px 0 6px', letterSpacing: -0.5 }}>
            Verify your identity
          </h2>
          <p style={{ fontSize: KF.sizes.md, color: KC.textSec, margin: 0, lineHeight: 1.45 }}>
            Required to create or sign rental agreements.
          </p>
        </div>

        <Banner variant="info">
          Your documents are encrypted and stored securely. We never share them with third parties.
        </Banner>

        <div>
          <div style={{
            fontSize: KF.sizes.sm, fontWeight: KF.weights.semibold,
            color: '#374151', textTransform: 'uppercase',
            letterSpacing: 0.8, fontFamily: KF.family, marginBottom: 12,
          }}>What you'll need</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <KycChecklistRow icon={<IconIdCard />} text={<>Any one: <b>Aadhaar</b>, <b>PAN</b> or <b>Passport</b></>} />
            <KycChecklistRow icon={<IconCamera />} text="A selfie to match your ID photo" />
            <KycChecklistRow icon={<IconClock />} text="About 5 minutes to complete" />
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button fullWidth onClick={() => nav && nav.go('kyc-document')}>Start Verification</Button>
          <Button variant="secondary" fullWidth onClick={() => nav && nav.reset('home')}>
            I'll do this later
          </Button>
        </div>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

function KycChecklistRow({ icon, text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 14, background: '#fff',
      border: `1px solid ${KC.border}`,
      borderRadius: KR.md,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: KR.sm,
        background: KC.primaryLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ fontSize: KF.sizes.md, color: KC.text, lineHeight: 1.4 }}>
        {text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2D — Document Selection
// ─────────────────────────────────────────────────────────────
function KycDocumentScreen({ nav, initialSelected = null }) {
  const [docType, setDocType] = React.useState(initialSelected);

  return (
    <Screen>
      <NavHeader onBack={() => nav && nav.back()} title="Identity Verification" />
      <div style={{ padding: '12px 20px 0' }}>
        <ProgressBar step={1} total={3} />
      </div>
      <ScrollBody padding={20} gap={16} style={{ paddingTop: 16 }}>
        <div>
          <h2 style={{ fontSize: KF.sizes.lg, fontWeight: KF.weights.bold, color: KC.text, margin: '4px 0 4px', letterSpacing: -0.4 }}>
            Choose your ID type
          </h2>
          <p style={{ fontSize: KF.sizes.sm, color: KC.textSec, margin: 0 }}>
            Pick whichever document is most convenient.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SelectableCard
            selected={docType === 'aadhaar'} onSelect={() => setDocType('aadhaar')}
            icon={<IconIdCard color={docType === 'aadhaar' ? KC.primary : KC.text} />}
            title="Aadhaar Card"
            subtitle="Instant OTP-based verification"
            badge="Fastest"
          />
          <SelectableCard
            selected={docType === 'pan'} onSelect={() => setDocType('pan')}
            icon={<IconIdCard color={docType === 'pan' ? KC.primary : KC.text} />}
            title="PAN Card"
            subtitle="Required for deposits above ₹50,000"
          />
          <SelectableCard
            selected={docType === 'passport'} onSelect={() => setDocType('passport')}
            icon={<IconPassport color={docType === 'passport' ? KC.primary : KC.text} />}
            title="Passport"
            subtitle="Accepted for NRIs and foreign nationals"
          />
        </div>

        <div style={{ flex: 1 }} />
        <Button fullWidth disabled={!docType}
          onClick={() => nav && nav.go('kyc-upload', { docType })}>
          Continue
        </Button>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2E — Document Upload
// ─────────────────────────────────────────────────────────────
const DOC_LABELS = {
  aadhaar: { name: 'Aadhaar', requiresBack: true },
  pan: { name: 'PAN Card', requiresBack: false },
  passport: { name: 'Passport', requiresBack: false },
};

function KycUploadScreen({ nav, docType = 'aadhaar', initialState = 'empty' }) {
  const meta = DOC_LABELS[docType] || DOC_LABELS.aadhaar;
  const [front, setFront] = React.useState(initialState === 'one-filled' || initialState === 'both-filled');
  const [back, setBack] = React.useState(initialState === 'both-filled');

  const required = meta.requiresBack ? front && back : front;

  return (
    <Screen>
      <NavHeader onBack={() => nav && nav.back()} title="Identity Verification" />
      <div style={{ padding: '12px 20px 0' }}>
        <ProgressBar step={2} total={3} />
      </div>
      <ScrollBody padding={20} gap={16} style={{ paddingTop: 16 }}>
        <h2 style={{ fontSize: KF.sizes.lg, fontWeight: KF.weights.bold, color: KC.text, margin: '4px 0 4px', letterSpacing: -0.4 }}>
          Upload your {meta.name}
        </h2>
        <p style={{ fontSize: KF.sizes.sm, color: KC.textSec, margin: 0 }}>
          Make sure all text is clearly visible and there's no glare.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <UploadZone
            label={meta.requiresBack ? 'Front side' : 'Document photo'}
            filled={front}
            onUpload={() => setFront(true)}
            onChange={() => setFront(false)}
            sample="ID-front"
          />
          {meta.requiresBack && (
            <UploadZone
              label="Back side"
              filled={back}
              onUpload={() => setBack(true)}
              onChange={() => setBack(false)}
              sample="ID-back"
            />
          )}
        </div>

        <div style={{ flex: 1 }} />
        <Button fullWidth disabled={!required}
          onClick={() => nav && nav.go('kyc-selfie', { docType })}>
          Continue
        </Button>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

function UploadZone({ label, filled, onUpload, onChange, sample }) {
  if (filled) {
    return (
      <div style={{
        height: 140, borderRadius: KR.md, position: 'relative', overflow: 'hidden',
        border: `1px solid ${KC.border}`, background: KC.surface,
      }}>
        {/* fake captured image preview — diagonal stripes that read as a document */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(135deg, #94A3B8, #94A3B8 4px, #CBD5E1 4px, #CBD5E1 10px)`,
          opacity: 0.45,
        }} />
        <div style={{
          position: 'absolute', inset: 14, borderRadius: 8,
          background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 9, color: '#64748B', fontWeight: 600, letterSpacing: 0.5 }}>GOVT OF INDIA</div>
              <div style={{ fontSize: 11, color: '#0F172A', fontWeight: 600, marginTop: 2 }}>RAJESH KUMAR</div>
              <div style={{ fontSize: 8, color: '#64748B', marginTop: 1, fontFamily: 'ui-monospace, monospace' }}>XXXX XXXX 1234</div>
            </div>
            <div style={{ width: 30, height: 36, background: '#E2E8F0', borderRadius: 3 }} />
          </div>
          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 1 }} />
        </div>
        <button
          onClick={onChange}
          style={{
            position: 'absolute', top: 10, right: 10,
            padding: '5px 10px', background: 'rgba(17,24,39,0.85)', color: '#fff',
            border: 'none', borderRadius: 999, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: KF.family,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>Change</button>
        <div style={{
          position: 'absolute', bottom: 10, left: 14,
          padding: '3px 8px', background: KC.success, color: '#fff',
          borderRadius: 999, fontSize: 11, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: KF.family,
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {label}
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={onUpload}
      style={{
        height: 140, width: '100%',
        background: KC.surface,
        border: `1.5px dashed ${KC.borderStrong}`,
        borderRadius: KR.md,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', fontFamily: KF.family,
      }}>
      <IconUpload />
      <div style={{ fontSize: KF.sizes.md, fontWeight: KF.weights.semibold, color: KC.text }}>{label}</div>
      <div style={{ fontSize: KF.sizes.sm, color: KC.textSec }}>
        Tap to take photo or choose from gallery
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2F — Selfie Capture
// ─────────────────────────────────────────────────────────────
function KycSelfieScreen({ nav, docType = 'aadhaar', initialState = 'idle' }) {
  // states: idle | captured
  const [state, setState] = React.useState(initialState);
  const [loading, setLoading] = React.useState(false);

  return (
    <Screen>
      <NavHeader onBack={() => nav && nav.back()} title="Identity Verification" />
      <div style={{ padding: '12px 20px 0' }}>
        <ProgressBar step={3} total={3} />
      </div>
      <ScrollBody padding={20} gap={20} style={{ paddingTop: 16 }}>
        <div>
          <h2 style={{ fontSize: KF.sizes.lg, fontWeight: KF.weights.bold, color: KC.text, margin: '4px 0 4px', letterSpacing: -0.4 }}>
            Take a selfie
          </h2>
          <p style={{ fontSize: KF.sizes.sm, color: KC.textSec, margin: 0 }}>
            Look directly at the camera in good lighting.
          </p>
        </div>

        <SelfieViewfinder captured={state === 'captured'} />

        {state === 'idle' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 4px' }}>
            <SelfieTip text="Remove glasses or hat" />
            <SelfieTip text="Neutral expression" />
            <SelfieTip text="Plain background preferred" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 4px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: KF.sizes.sm, color: KC.success, fontWeight: KF.weights.semibold,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill={KC.success} opacity="0.15"/>
                <path d="M4.5 8L7 10.5L11.5 6" stroke={KC.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Looks good — face clearly visible
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />
        {state === 'idle' ? (
          <Button fullWidth onClick={() => setState('captured')}>
            Capture Photo
          </Button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button fullWidth loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => { setLoading(false); nav && nav.go('kyc-submitted', { docType }); }, 800);
              }}>
              {loading ? 'Submitting…' : 'Use this photo'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setState('idle')}>
              Retake
            </Button>
          </div>
        )}
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

function SelfieViewfinder({ captured }) {
  const size = 260;
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      position: 'relative', height: size + 20, margin: '4px 0',
    }}>
      {/* corner bracket guides */}
      {[[0,0,'tl'],[0,1,'tr'],[1,0,'bl'],[1,1,'br']].map(([y,x,k]) => (
        <div key={k} style={{
          position: 'absolute',
          [y ? 'bottom' : 'top']: 0,
          [x ? 'right' : 'left']: `calc(50% - ${size/2 + 14}px)`,
          width: 18, height: 18,
          borderTop: y ? 'none' : `2.5px solid ${KC.primary}`,
          borderBottom: y ? `2.5px solid ${KC.primary}` : 'none',
          borderLeft: x ? 'none' : `2.5px solid ${KC.primary}`,
          borderRight: x ? `2.5px solid ${KC.primary}` : 'none',
          borderTopLeftRadius: !y && !x ? 4 : 0,
          borderTopRightRadius: !y && x ? 4 : 0,
          borderBottomLeftRadius: y && !x ? 4 : 0,
          borderBottomRightRadius: y && x ? 4 : 0,
        }} />
      ))}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: `3px solid ${captured ? KC.success : KC.primary}`,
        overflow: 'hidden', position: 'relative',
        background: '#111827',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s',
      }}>
        {/* faux camera preview / portrait silhouette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 38%, #475569 0%, #1E293B 60%, #0F172A 100%)' }} />
        {/* head + shoulders silhouette */}
        <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'relative' }}>
          <circle cx="100" cy="78" r="34" fill="rgba(255,255,255,0.18)" />
          <path d="M40 200 C40 150 70 130 100 130 C130 130 160 150 160 200 Z" fill="rgba(255,255,255,0.18)" />
        </svg>
        {captured && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: KC.success, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 9L8 12L13 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function SelfieTip({ text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: KF.sizes.sm, color: KC.textSec, fontFamily: KF.family,
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        background: KC.surface, border: `1px solid ${KC.border}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M2 4.5L4 6.5L7.5 3" stroke={KC.textDis} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2G — KYC Submitted
// ─────────────────────────────────────────────────────────────
function KycSubmittedScreen({ nav, docType = 'aadhaar' }) {
  const docName = (DOC_LABELS[docType] || DOC_LABELS.aadhaar).name + ' Card';
  // (we say "Aadhaar Card" but for PAN/Passport just the name; close enough for prototype)
  const displayName = docType === 'aadhaar' ? 'Aadhaar Card' : docType === 'pan' ? 'PAN Card' : 'Passport';

  return (
    <Screen>
      {/* no back arrow per spec — but include a transparent header so spacing matches other screens */}
      <ScrollBody padding={28} gap={20}>
        <div style={{ height: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: KC.warningLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', inset: -8, borderRadius: '50%',
              border: `1px dashed ${KC.warning}`, opacity: 0.4,
            }} />
            <IconClock color={KC.warning} size={48} />
          </div>
          <div>
            <h2 style={{ fontSize: KF.sizes.xl, fontWeight: KF.weights.bold, color: KC.text, margin: '0 0 8px', letterSpacing: -0.5 }}>
              Verification in progress
            </h2>
            <p style={{ fontSize: KF.sizes.md, color: KC.textSec, margin: 0, lineHeight: 1.5, maxWidth: 280 }}>
              We're reviewing your documents. This usually takes 2–4 hours. You'll get an SMS once it's done.
            </p>
          </div>
        </div>

        <Card padding={0} style={{ marginTop: 8 }}>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="ID type submitted" value={displayName} />
            <InfoRow label="Submitted at" value="15 Jan 2025, 3:42 PM" />
            <InfoRowChip label="Status" status="PENDING_DEPOSIT" customLabel="Pending review" isLast />
          </div>
        </Card>

        <div style={{ flex: 1 }} />
        <Button fullWidth onClick={() => nav && nav.reset('home')}>
          Go to Home
        </Button>
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// Variant of InfoRow that renders a chip instead of plain text
function InfoRowChip({ label, status, customLabel, isLast = false }) {
  // pending review uses warning chip
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${KC.border}`,
      gap: 16,
    }}>
      <span style={{ fontSize: KF.sizes.md, color: KC.textSec, fontFamily: KF.family }}>{label}</span>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', background: KC.warningLight, color: KC.warning,
        borderRadius: 999, fontSize: KF.sizes.sm, fontWeight: KF.weights.semibold,
        fontFamily: KF.family,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: KC.warning }} />
        {customLabel || 'Pending'}
      </span>
    </div>
  );
}

Object.assign(window, {
  ProfileSetupScreen, KycIntroScreen, KycDocumentScreen,
  KycUploadScreen, KycSelfieScreen, KycSubmittedScreen,
  UploadZone, SelfieViewfinder,
});
