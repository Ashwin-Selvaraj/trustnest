// TrustNest marketplace screens — A through G + Notifications
// Wired into the 4-tab nav.

const SC = window.TN.color;
const SF = window.TN.font;
const SR = window.TN.radius;

// helpers
function pickRole() {
  const roles = (window.SAMPLE_USER && window.SAMPLE_USER.roles) || ['tenant'];
  if (roles.includes('owner') && roles.includes('tenant')) return 'both';
  if (roles.includes('owner')) return 'owner';
  return 'tenant';
}

function tabNav(nav, active) {
  const role = pickRole();
  const notifCount = (window.SAMPLE_NOTIFICATIONS || []).filter((n) => n.unread).length;
  return (
    <TabBar
      active={active} role={role} notifCount={notifCount}
      onChange={(t) => {
        if (t === active) return;
        if (t === 'home') nav && nav.go('home');
        else if (t === 'browse') nav && nav.go('browse');
        else if (t === 'notifications') nav && nav.go('notifications');
        else if (t === 'profile') nav && nav.go('profile');
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN A — Browse (tenant view) / Properties (owner view)
// ─────────────────────────────────────────────────────────────
const BHK_FILTERS = ['All BHK', '1 BHK', '2 BHK', '3 BHK', '4+ BHK'];
const PRICE_FILTERS = ['Under ₹20k', '₹20–40k', '₹40–60k', '₹60k+'];
const FURNISH_FILTERS = ['Furnished', 'Semi', 'Unfurnished'];

function BrowseScreen({ nav, view = 'auto', state = 'populated', initialSegment, forceRole, bodyState = 'populated' }) {
  const role = forceRole || pickRole();
  // owner-default: My Listings; tenant-default: Browse listings
  const defaultSeg = role === 'tenant' ? 'browse' : 'browse';
  const [seg, setSeg] = React.useState(initialSegment || defaultSeg);
  const [filter, setFilter] = React.useState('All BHK');
  const [favs, setFavs] = React.useState({});
  const [showKycGate, setShowKycGate] = React.useState(false);

  // Determine which segments to show
  let segments = null;
  if (role === 'owner') {
    segments = [
      { id: 'mine', label: 'My Listings' },
      { id: 'browse', label: 'Browse' },
    ];
    if (!initialSegment && seg === 'browse') {
      // owner default override
    }
  } else if (role === 'both') {
    segments = [
      { id: 'browse', label: 'Browse' },
      { id: 'mine', label: 'My Listings' },
      { id: 'interests', label: 'My Interests' },
    ];
  } else {
    segments = [
      { id: 'browse', label: 'Browse' },
      { id: 'interests', label: 'My Interests' },
    ];
  }

  return (
    <Screen bg={SC.surface} padBottom={0}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${SC.border}`,
        padding: '8px 20px 14px', flexShrink: 0,
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: SF.weights.bold,
          color: SC.text, margin: '4px 0 14px', letterSpacing: -0.7,
        }}>{role === 'tenant' ? 'Browse' : 'Properties'}</h1>
        <SearchBar />
        {/* Segmented control (if not tenant-only with single segment) */}
        {segments && (
          <div style={{ marginTop: 12, marginLeft: -20, marginRight: -20, marginBottom: -14 }}>
            <SegmentedControl value={seg} onChange={setSeg} segments={segments} />
          </div>
        )}
      </div>

      {/* Filter chips — only on browse segment */}
      {seg === 'browse' && (
        <div style={{
          background: '#fff', padding: '12px 0', borderBottom: `1px solid ${SC.border}`, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px',
            scrollbarWidth: 'none',
          }}>
            {[...BHK_FILTERS, ...PRICE_FILTERS, ...FURNISH_FILTERS].map((f) => (
              <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</FilterChip>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      {seg === 'browse' && state === 'empty' && <BrowseEmpty />}
      {seg === 'browse' && state === 'loading' && <BrowseLoading />}
      {seg === 'browse' && state === 'populated' && (
        <ScrollBody padding={16} gap={16} bg={SC.surface}>
          {window.SAMPLE_PROPERTIES.map((p) => (
            <PropertyCard key={p.id} property={p}
              favourited={!!favs[p.id]}
              onFavourite={() => setFavs((f) => ({ ...f, [p.id]: !f[p.id] }))}
              onView={() => nav && nav.go('property', { id: p.id })}
            />
          ))}
          <div style={{ height: 80 }} />
        </ScrollBody>
      )}

      {seg === 'mine' && <MyListingsBody nav={nav} state={bodyState} />}
      {seg === 'interests' && <MyInterestsBody nav={nav} state={bodyState} />}

      {/* Add-property FAB (only on owner My Listings) */}
      {seg === 'mine' && (
        <FAB onClick={() => {
          if ((window.SAMPLE_USER?.kyc) && false) setShowKycGate(true);
          else nav && nav.go('add-property');
        }} style={{ bottom: 96 }} />
      )}

      <KycGateModal
        open={showKycGate}
        onClose={() => setShowKycGate(false)}
        onCompleteKyc={() => { setShowKycGate(false); nav && nav.go('kyc-intro'); }}
        mode="publish"
      />

      {tabNav(nav, 'browse')}
    </Screen>
  );
}

function BrowseEmpty() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 40, textAlign: 'center', gap: 12,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 22, background: SC.surface,
        border: `1px solid ${SC.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <circle cx="18" cy="18" r="11" stroke={SC.textDis} strokeWidth="2.2"/>
          <path d="M27 27l10 10" stroke={SC.textDis} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 17, fontWeight: SF.weights.bold, color: SC.text, letterSpacing: -0.3 }}>
        No properties found
      </div>
      <div style={{ fontSize: 14, color: SC.textSec }}>Try adjusting your filters.</div>
    </div>
  );
}

function BrowseLoading() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function SkeletonCard() {
  const shimmer = {
    background: 'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
    backgroundSize: '400px 100%',
    animation: 'tn-shimmer 1.4s linear infinite',
  };
  return (
    <div style={{
      background: '#fff', border: `1px solid ${SC.border}`,
      borderRadius: SR.md, overflow: 'hidden',
    }}>
      <div style={{ height: 180, ...shimmer }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 16, width: '70%', borderRadius: 4, ...shimmer }} />
        <div style={{ height: 12, width: '50%', borderRadius: 4, ...shimmer }} />
        <div style={{ display: 'flex', gap: 14, paddingTop: 6 }}>
          <div style={{ flex: 1, height: 18, borderRadius: 4, ...shimmer }} />
          <div style={{ flex: 1, height: 18, borderRadius: 4, ...shimmer }} />
          <div style={{ flex: 1, height: 18, borderRadius: 4, ...shimmer }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 44, borderRadius: 8, ...shimmer }} />
          <div style={{ width: 48, height: 44, borderRadius: 8, ...shimmer }} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MyListingsBody (segment of Browse for owners)
// ─────────────────────────────────────────────────────────────
function MyListingsBody({ nav, state = 'populated' }) {
  if (state === 'empty') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px 120px', textAlign: 'center', gap: 14,
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: 22, background: SC.primaryLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M6 42V20L24 8L42 20V42M16 42V28H32V42" stroke={SC.primary} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: SF.weights.bold, color: SC.text, letterSpacing: -0.3 }}>
            No properties listed yet
          </div>
          <div style={{ fontSize: 14, color: SC.textSec, marginTop: 6, maxWidth: 280, lineHeight: 1.45 }}>
            Add your first property to start receiving tenant interest.
          </div>
        </div>
        <Button onClick={() => nav && nav.go('add-property')} style={{ minWidth: 200, marginTop: 4 }}>
          Add Property
        </Button>
      </div>
    );
  }
  return (
    <ScrollBody padding={16} gap={12} bg={SC.surface}>
      {window.SAMPLE_MY_LISTINGS.map((l) => (
        <MyListingCard key={l.id} listing={l}
          onView={() => nav && nav.go('property-owner', { id: l.id })}
          onEdit={() => nav && nav.go('add-property', { editId: l.id })}
        />
      ))}
      <div style={{ height: 80 }} />
    </ScrollBody>
  );
}

// ─────────────────────────────────────────────────────────────
// MyInterestsBody — tenant segment of Browse
// ─────────────────────────────────────────────────────────────
function MyInterestsBody({ nav, state = 'populated' }) {
  if (state === 'empty') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px 120px', textAlign: 'center', gap: 14,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 22, background: SC.surface,
          border: `1px solid ${SC.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M22 36C8 26 13 14 18.5 14c2 0 3 1 3.5 2.5C22.5 15 23.5 14 25.5 14c5.5 0 10.5 12-3.5 22Z" stroke={SC.textDis} strokeWidth="2"/>
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: SF.weights.bold, color: SC.text, letterSpacing: -0.3 }}>
          No interests yet
        </div>
        <div style={{ fontSize: 14, color: SC.textSec, maxWidth: 280, lineHeight: 1.45 }}>
          When you express interest in a listing, you'll see it here.
        </div>
      </div>
    );
  }
  return (
    <ScrollBody padding={16} gap={10} bg={SC.surface}>
      {window.SAMPLE_MY_INTERESTS.map((i) => (
        <InterestStatusCard key={i.id} interest={i}
          onView={() => nav && nav.go('property', { id: i.propertyId })}
          onOpenAgreement={() => nav && nav.go('detail', { id: i.agreementId })}
        />
      ))}
      <div style={{ height: 80 }} />
    </ScrollBody>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN B — Property Detail (tenant view)
// ─────────────────────────────────────────────────────────────
function PropertyDetailScreen({ nav, propertyId = 'p1', initialState = 'idle', kycState = 'verified' }) {
  const p = window.SAMPLE_PROPERTIES.find((x) => x.id === propertyId) || window.SAMPLE_PROPERTIES[0];
  const [favourited, setFavourited] = React.useState(false);
  const [interestState, setInterestState] = React.useState(initialState); // idle | sent
  const [showKycGate, setShowKycGate] = React.useState(false);

  const handleExpressInterest = () => {
    if (kycState !== 'verified') { setShowKycGate(true); return; }
    setInterestState('sent');
  };

  return (
    <Screen bg={SC.surface} padBottom={0} padTop={0}>
      <ScrollBody padding={0} gap={0} bg={SC.surface}>
        {/* Photo gallery (full bleed) — has its own top spacing for safe area */}
        <div style={{ position: 'relative' }}>
          <PhotoGallery property={p} height={280} />
          {/* status bar safe area gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 90,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)',
            pointerEvents: 'none',
          }} />
          {/* back + heart buttons */}
          <div style={{ position: 'absolute', top: 50, left: 12 }}>
            <CircleIconButton onClick={() => nav && nav.back()}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 2L4 7l6 5" stroke={SC.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </CircleIconButton>
          </div>
          <div style={{ position: 'absolute', top: 50, right: 12 }}>
            <CircleIconButton onClick={() => setFavourited((f) => !f)}>
              <IconHeart filled={favourited} color={favourited ? SC.danger : SC.text} size={18} />
            </CircleIconButton>
          </div>
        </div>

        {/* Title + key stats */}
        <div style={{ padding: '16px 20px 4px', background: SC.surface }}>
          <h2 style={{ fontSize: 20, fontWeight: SF.weights.bold, color: SC.text, margin: '4px 0', letterSpacing: -0.5 }}>
            {p.title}
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, color: SC.textSec }}>
            <IconPin size={14} /> {p.address.split(',').slice(0, -1).join(',').trim() || p.locality}
          </div>
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#fff', borderRadius: SR.md, border: `1px solid ${SC.border}` }}>
            <StatTriplet items={[
              { value: `${window.formatINR(p.rent)} / mo`, label: 'Rent' },
              { value: window.formatINR(p.deposit), label: 'Deposit' },
              { value: `${p.sqft} sqft`, label: 'Built-up' },
            ]} />
          </div>
        </div>

        {/* Property details card */}
        <div style={{ padding: '12px 20px' }}>
          <DetailCard title="Property details">
            <DetailGrid items={[
              ['Furnishing', p.furnishingLabel],
              ['Type', `${p.bhk} BHK Apartment`],
              ['Preferred tenants', p.tenantPref],
              ['Available from', p.available],
              ['Floor', `${p.floor} of ${p.totalFloors}`],
              ['Parking', p.parking],
            ]} />
          </DetailCard>
        </div>

        {/* Amenities */}
        <div style={{ padding: '0 20px 12px' }}>
          <DetailCard title="Amenities">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(p.amenities || []).map((a) => (
                <AttributeChip key={a} icon={<AmenityIcon name={a} />}>{a}</AttributeChip>
              ))}
            </div>
          </DetailCard>
        </div>

        {/* About the owner */}
        <div style={{ padding: '0 20px 12px' }}>
          <DetailCard title="About the owner">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar name={p.owner.name} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: SF.weights.semibold, color: SC.text, letterSpacing: -0.2 }}>{p.owner.name}</div>
                <div style={{ fontSize: 13, color: SC.textSec }}>Property Owner</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Stars value={p.owner.score} size={13} />
                  <span style={{ fontSize: 13, fontWeight: SF.weights.semibold, color: SC.text }}>{p.owner.score.toFixed(1)}</span>
                  <span style={{ fontSize: 13, color: SC.textSec }}>· {p.owner.reviews} reviews</span>
                </div>
                <div style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, color: SC.success, fontWeight: SF.weights.semibold,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill={SC.success} opacity="0.15"/>
                    <path d="M4 7L6 9L10 5" stroke={SC.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  KYC Verified
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: SC.textDis }}>Member since {p.owner.joined}</div>
              </div>
            </div>
          </DetailCard>
        </div>

        {/* Rent breakdown */}
        <div style={{ padding: '0 20px 12px' }}>
          <DetailCard title="Rent breakdown" padding={0}>
            <div style={{ padding: '0 16px' }}>
              <InfoRow label="Monthly rent" value={window.formatINR(p.rent)} />
              <InfoRow label="Maintenance" value={`${window.formatINR(p.maintenance || 0)} (approx)`} />
              <InfoRow label="Security deposit" value={window.formatINR(p.deposit)} />
              <InfoRow label="Deposit refund" value="Via secure escrow at lease end" isLast />
            </div>
            <div style={{ padding: 12 }}>
              <Banner variant="info">
                Deposit is held in secure escrow — not paid directly to the owner.
              </Banner>
            </div>
          </DetailCard>
        </div>

        <div style={{ height: 16 }} />
      </ScrollBody>

      {/* Inline success banner above sticky bar */}
      {interestState === 'sent' && (
        <div style={{
          flexShrink: 0, padding: '0 12px 8px', background: SC.surface,
        }}>
          <Banner variant="success">
            Your interest has been sent to the owner. You'll be notified when they respond.
          </Banner>
        </div>
      )}

      {/* Sticky CTA */}
      <StickyBar
        left={
          <div>
            <div style={{ fontSize: 17, fontWeight: SF.weights.bold, color: SC.text, letterSpacing: -0.3 }}>
              {window.formatINR(p.rent)} <span style={{ fontWeight: SF.weights.medium, color: SC.textSec, fontSize: 13 }}>/ mo</span>
            </div>
            <div style={{ fontSize: 13, color: SC.textSec }}>{window.formatINR(p.deposit)} deposit</div>
          </div>
        }
        right={
          interestState === 'sent' ? (
            <Button variant="secondary" disabled>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
                <circle cx="7" cy="7" r="6" fill={SC.success} opacity="0.2"/>
                <path d="M4 7L6 9L10 5" stroke={SC.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Interest Sent
            </Button>
          ) : (
            <Button onClick={handleExpressInterest}>Express Interest</Button>
          )
        }
      />

      <KycGateModal
        open={showKycGate}
        onClose={() => setShowKycGate(false)}
        onCompleteKyc={() => { setShowKycGate(false); nav && nav.go('kyc-intro'); }}
      />
    </Screen>
  );
}

function DetailCard({ title, children, padding = 14 }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${SC.border}`, borderRadius: SR.md,
      overflow: 'hidden', fontFamily: SF.family,
    }}>
      <div style={{
        padding: '12px 14px 6px',
        fontSize: 11, fontWeight: SF.weights.semibold, color: SC.textSec,
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>{title}</div>
      <div style={{ padding: padding === 0 ? 0 : `0 ${padding}px ${padding}px` }}>{children}</div>
    </div>
  );
}

function DetailGrid({ items }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      rowGap: 12, columnGap: 16, padding: '4px 2px',
    }}>
      {items.map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: 12, color: SC.textSec, fontFamily: SF.family }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: SF.weights.semibold, color: SC.text, marginTop: 2, fontFamily: SF.family }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function AmenityIcon({ name, color = SC.textSec }) {
  // simple iconography for amenities — squares and circles
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="2" stroke={color} strokeWidth="1.2"/>
      <circle cx="6" cy="6" r="4.5" stroke={color} strokeWidth="1.2" opacity="0.35"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN E — Property Detail (owner view of own listing)
// Reuses Screen B but swaps sticky bar + adds Interested Tenants section.
// ─────────────────────────────────────────────────────────────
function PropertyDetailOwnerScreen({ nav, propertyId = 'p1' }) {
  const p = window.SAMPLE_MY_LISTINGS.find((x) => x.id === propertyId)
    || window.SAMPLE_PROPERTIES.find((x) => x.id === propertyId)
    || window.SAMPLE_PROPERTIES[0];
  const interests = (window.SAMPLE_INTERESTS || []).filter((i) => i.state === 'pending').slice(0, 3);
  const totalInterests = (window.SAMPLE_INTERESTS || []).filter((i) => i.state === 'pending').length;
  const [paused, setPaused] = React.useState(p.status === 'PAUSED');

  return (
    <Screen bg={SC.surface} padBottom={0} padTop={0}>
      <ScrollBody padding={0} gap={0} bg={SC.surface}>
        <div style={{ position: 'relative' }}>
          <PhotoGallery property={p} height={260} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 90,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.18), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'absolute', top: 50, left: 12 }}>
            <CircleIconButton onClick={() => nav && nav.back()}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 2L4 7l6 5" stroke={SC.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </CircleIconButton>
          </div>
          <div style={{
            position: 'absolute', top: 50, right: 12,
            display: 'flex', gap: 8,
          }}>
            <ListingStatusChip status={paused ? 'PAUSED' : p.status} />
          </div>
        </div>

        <div style={{ padding: '16px 20px 4px', background: SC.surface }}>
          <h2 style={{ fontSize: 20, fontWeight: SF.weights.bold, color: SC.text, margin: '4px 0', letterSpacing: -0.5 }}>
            {p.title}
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, color: SC.textSec }}>
            <IconPin size={14} /> {p.locality}
          </div>
        </div>

        {/* Interested tenants — owner-only section */}
        <div style={{ padding: '12px 20px 0' }}>
          <DetailCard title="Interested tenants">
            {totalInterests === 0 ? (
              <div style={{ fontSize: 13, color: SC.textSec, lineHeight: 1.5 }}>
                No interest yet — your listing is live and visible to tenants.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {interests.map((i, idx) => (
                  <InterestedTenantRow key={i.id} interest={i} isLast={idx === interests.length - 1} />
                ))}
                {totalInterests > 3 && (
                  <button onClick={() => nav && nav.go('interests', { id: p.id })} style={{
                    border: 'none', background: 'transparent', color: SC.primary,
                    fontSize: 13, fontWeight: SF.weights.semibold, cursor: 'pointer',
                    padding: '12px 0 0', textAlign: 'left', fontFamily: SF.family,
                  }}>View all {totalInterests} →</button>
                )}
                {totalInterests <= 3 && totalInterests > 0 && (
                  <button onClick={() => nav && nav.go('interests', { id: p.id })} style={{
                    border: 'none', background: 'transparent', color: SC.primary,
                    fontSize: 13, fontWeight: SF.weights.semibold, cursor: 'pointer',
                    padding: '12px 0 0', textAlign: 'left', fontFamily: SF.family,
                  }}>Manage interests →</button>
                )}
              </div>
            )}
          </DetailCard>
        </div>

        {/* Reuse property details */}
        <div style={{ padding: '12px 20px' }}>
          <DetailCard title="Property details">
            <DetailGrid items={[
              ['Furnishing', p.furnishingLabel || 'Semi-furnished'],
              ['Type', `${p.bhk || 3} BHK Apartment`],
              ['Preferred tenants', p.tenantPref || 'All'],
              ['Available from', p.available || '01 Feb 2025'],
              ['Floor', `${p.floor || '—'} of ${p.totalFloors || '—'}`],
              ['Parking', p.parking || '—'],
            ]} />
          </DetailCard>
        </div>

        <div style={{ padding: '0 20px 12px' }}>
          <DetailCard title="Rent breakdown" padding={0}>
            <div style={{ padding: '0 16px' }}>
              <InfoRow label="Monthly rent" value={window.formatINR(p.rent)} />
              <InfoRow label="Maintenance" value={`${window.formatINR(p.maintenance || 0)} (approx)`} />
              <InfoRow label="Security deposit" value={window.formatINR(p.deposit)} isLast />
            </div>
          </DetailCard>
        </div>

        <div style={{ height: 16 }} />
      </ScrollBody>

      <StickyBar
        left={null}
        right={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <Button variant="secondary" onClick={() => nav && nav.go('add-property', { editId: p.id })} style={{ flex: 1 }} fullWidth>
              Edit Listing
            </Button>
            <Button variant="secondary" onClick={() => setPaused((x) => !x)} style={{ flex: 1 }} fullWidth>
              {paused ? 'Activate' : 'Pause'}
            </Button>
          </div>
        }
      />
    </Screen>
  );
}

function InterestedTenantRow({ interest, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
      borderBottom: isLast ? 'none' : `1px solid ${SC.border}`,
    }}>
      <Avatar name={interest.name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: SF.weights.semibold, color: SC.text }}>{interest.name}</div>
        <div style={{ marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <KycBadge state={interest.kyc} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Stars value={interest.score} size={11} />
            <span style={{ fontSize: 12, color: SC.text, fontWeight: SF.weights.semibold }}>{interest.score.toFixed(1)}</span>
          </span>
        </div>
      </div>
      <button style={{
        border: 'none', background: 'transparent', color: SC.success,
        fontSize: 13, fontWeight: SF.weights.semibold, cursor: 'pointer',
        padding: '6px 8px', fontFamily: SF.family,
      }}>Accept</button>
      <button style={{
        border: 'none', background: 'transparent', color: SC.danger,
        fontSize: 13, fontWeight: SF.weights.semibold, cursor: 'pointer',
        padding: '6px 4px', fontFamily: SF.family,
      }}>Decline</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN F — Interest Requests (owner)
// ─────────────────────────────────────────────────────────────
function InterestRequestsScreen({ nav, propertyId = 'p1' }) {
  const p = window.SAMPLE_MY_LISTINGS.find((x) => x.id === propertyId)
    || window.SAMPLE_PROPERTIES.find((x) => x.id === propertyId)
    || window.SAMPLE_PROPERTIES[0];
  const [interests, setInterests] = React.useState(window.SAMPLE_INTERESTS);

  const update = (id, state) => setInterests((arr) => arr.map((i) => i.id === id ? { ...i, state } : i));

  return (
    <Screen>
      <div style={{
        height: 52, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 8px', borderBottom: `1px solid ${SC.border}`,
        background: '#fff', flexShrink: 0, position: 'relative',
      }}>
        <button onClick={() => nav && nav.back()} style={{
          position: 'absolute', left: 4, top: 4, bottom: 4,
          width: 44, border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          padding: '0 8px', cursor: 'pointer', color: SC.primary,
        }}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10l8 8" stroke={SC.primary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ textAlign: 'center', fontSize: 15, fontWeight: SF.weights.semibold, color: SC.text }}>
          Interested Tenants
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: SC.textSec, marginTop: 2 }}>{p.title}</div>
      </div>
      <ScrollBody padding={16} gap={12} bg={SC.surface}>
        {interests.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8,
          }}>
            <div style={{ fontSize: 15, color: SC.text, fontWeight: SF.weights.semibold }}>No interest requests yet</div>
            <div style={{ fontSize: 13, color: SC.textSec }}>Your listing is visible to tenants.</div>
          </div>
        ) : (
          interests.map((i) => (
            <TenantInterestCard
              key={i.id} interest={i}
              onAccept={() => update(i.id, 'accepted')}
              onDecline={() => update(i.id, 'declined')}
              onUndo={() => update(i.id, 'pending')}
            />
          ))
        )}
        <div style={{ height: 16 }} />
      </ScrollBody>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN D — Add Property (owner)
// ─────────────────────────────────────────────────────────────
function AddPropertyScreen({ nav, kycVerified = true }) {
  const [form, setForm] = React.useState({
    title: '', address: '', locality: '',
    bhk: null, furnishing: null,
    rent: '', deposit: '', maintenance: '',
    negotiable: false,
    available: '', minLease: '',
    tenants: [],
    amenities: [],
    photos: 0,
  });
  const [errors, setErrors] = React.useState({});
  const [more, setMore] = React.useState(false);
  const [showKycGate, setShowKycGate] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm((f) => {
    const arr = f[k] || [];
    return { ...f, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
  });
  const togglePhoto = (delta) => setForm((f) => ({ ...f, photos: Math.max(0, Math.min(10, f.photos + delta)) }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Add a title';
    if (!form.address.trim()) e.address = 'Full address required';
    if (!form.locality.trim()) e.locality = 'Locality is required';
    if (!form.bhk) e.bhk = 'Pick a property type';
    if (!form.furnishing) e.furnishing = 'Pick furnishing status';
    if (!form.rent) e.rent = 'Monthly rent required';
    if (!form.deposit) e.deposit = 'Security deposit required';
    if (!form.available) e.available = 'Available-from date required';
    if (form.photos < 1) e.photos = 'Add at least one photo';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublish = () => {
    if (!kycVerified) { setShowKycGate(true); return; }
    if (!validate()) return;
    setPublishing(true);
    setTimeout(() => { setPublishing(false); nav && nav.back(); }, 1000);
  };

  return (
    <Screen padBottom={0}>
      <NavHeader title="Add Property" onBack={() => nav && nav.back()}
        right={
          <button style={{
            border: 'none', background: 'transparent', color: SC.primary,
            fontSize: 15, fontWeight: SF.weights.semibold, cursor: 'pointer',
            fontFamily: SF.family, padding: 8,
          }}>Save Draft</button>
        }
      />
      <ScrollBody padding={20} gap={22}>
        {!kycVerified && (
          <Banner variant="warning" title="Verify your identity to publish">
            Complete KYC to publish your listing — drafts can still be saved.
          </Banner>
        )}

        <div>
          <SectionHeader>Property basics</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput label="Property title" placeholder="3 BHK Apartment in Whitefield" value={form.title} onChange={set('title')} error={errors.title} />
            <TextInput label="Full address" multiline rows={2}
              placeholder="Flat 7B, Mahindra Windchimes, ITPL Road, Whitefield, Bengaluru 560066"
              value={form.address} onChange={set('address')} error={errors.address}
            />
            <TextInput label="Locality / Area" placeholder="Whitefield" value={form.locality} onChange={set('locality')}
              hint="Tenants search by this" error={errors.locality}
            />
          </div>
        </div>

        <div>
          <SectionHeader>Property type</SectionHeader>
          <PillRow options={BHK_FILTERS.slice(1)} value={form.bhk} onChange={set('bhk')} />
          {errors.bhk && <ErrorText>{errors.bhk}</ErrorText>}
        </div>

        <div>
          <SectionHeader>Furnishing status</SectionHeader>
          <PillRow options={['Unfurnished', 'Semi-furnished', 'Fully furnished']} value={form.furnishing} onChange={set('furnishing')} />
          {errors.furnishing && <ErrorText>{errors.furnishing}</ErrorText>}
        </div>

        <div>
          <SectionHeader>Financials</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput label="Monthly rent" prefix="₹" placeholder="25,000" keyboardType="numeric" value={form.rent} onChange={set('rent')} error={errors.rent} />
            <TextInput label="Security deposit" prefix="₹" placeholder="75,000" keyboardType="numeric"
              hint="Typically 2–3× monthly rent" value={form.deposit} onChange={set('deposit')} error={errors.deposit}
            />
            <TextInput label="Maintenance charges" prefix="₹" placeholder="1,500" keyboardType="numeric"
              hint="Optional — shown as approx" value={form.maintenance} onChange={set('maintenance')}
            />
            <ToggleRow label="Rent is negotiable" checked={form.negotiable} onChange={set('negotiable')} />
          </div>
        </div>

        <div>
          <SectionHeader>Lease details</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput label="Available from" placeholder="2025-02-01" hint="Format: YYYY-MM-DD"
              value={form.available} onChange={set('available')} error={errors.available} />
            <TextInput label="Minimum lease period" placeholder="11" hint="Months" keyboardType="numeric"
              value={form.minLease} onChange={set('minLease')} />
          </div>
        </div>

        <div>
          <SectionHeader>Preferred tenants</SectionHeader>
          <PillRow
            options={['Anyone', 'Family', 'Working professionals', 'Students']}
            multi value={form.tenants} onChange={(v) => toggleArr('tenants', v)}
          />
        </div>

        <div>
          <SectionHeader>Amenities</SectionHeader>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
          }}>
            {['Lift', 'Power backup', 'Security', 'Gym', 'Pool', 'Club house',
              'Park', '2-wheeler parking', '4-wheeler parking', 'Water 24/7',
              'Gas pipeline', 'Intercom'].map((a) => {
              const on = form.amenities.includes(a);
              return (
                <button key={a} onClick={() => toggleArr('amenities', a)} style={{
                  padding: '10px 6px', cursor: 'pointer', fontFamily: SF.family,
                  background: on ? SC.primaryLight : '#fff',
                  border: on ? `1.5px solid ${SC.primary}` : `1px solid ${SC.border}`,
                  borderRadius: SR.sm,
                  fontSize: 12, fontWeight: SF.weights.medium,
                  color: on ? SC.primary : SC.text,
                  lineHeight: 1.2,
                }}>{a}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionHeader>Photos</SectionHeader>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
          }}>
            {/* Add cell */}
            <button onClick={() => togglePhoto(1)} style={{
              width: '100%', aspectRatio: '1 / 1',
              background: SC.surface, border: `1.5px dashed ${SC.borderStrong}`,
              borderRadius: SR.sm, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              color: SC.textSec, fontFamily: SF.family, fontSize: 12, fontWeight: SF.weights.medium,
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 4V18M4 11H18" stroke={SC.textSec} strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add photos
            </button>
            {Array.from({ length: form.photos }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '1 / 1', borderRadius: SR.sm, overflow: 'hidden',
                position: 'relative',
              }}>
                <PropertyPhoto hue={210 + i * 35} height={100} radius={SR.sm} photos={1} current={1} fit="all" />
                <button onClick={() => togglePhoto(-1)} style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(17,24,39,0.7)', border: 'none', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
                {i === 0 && (
                  <div style={{
                    position: 'absolute', bottom: 4, left: 4,
                    padding: '2px 6px', background: SC.primary, color: '#fff',
                    fontSize: 9, fontWeight: SF.weights.semibold, borderRadius: 3,
                    fontFamily: SF.family,
                  }}>Cover</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: SC.textSec, marginTop: 8 }}>
            First photo will be the cover image. Minimum 1 required, max 10.
          </div>
          {errors.photos && <ErrorText>{errors.photos}</ErrorText>}
        </div>

        <button onClick={() => setMore(!more)} style={{
          border: 'none', background: 'transparent', color: SC.primary,
          padding: '4px 0', fontSize: 14, fontWeight: SF.weights.semibold,
          cursor: 'pointer', fontFamily: SF.family,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {more ? 'Hide' : 'Show'} more details
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: more ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            <path d="M2 4l3 3 3-3" stroke={SC.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {more && (
          <div>
            <SectionHeader>Optional details</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TextInput label="Floor number" placeholder="7" keyboardType="numeric" />
              <TextInput label="Total floors" placeholder="12" keyboardType="numeric" />
              <TextInput label="Property age (years)" placeholder="4" keyboardType="numeric" />
              <TextInput label="Facing direction" placeholder="East" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <Button fullWidth onClick={handlePublish} disabled={!kycVerified} loading={publishing}>
            {publishing ? 'Publishing…' : 'Publish Listing'}
          </Button>
          {!kycVerified && (
            <div style={{ fontSize: 13, color: SC.textSec, textAlign: 'center' }}>
              Complete KYC to publish your listing.
            </div>
          )}
          <Button variant="secondary" fullWidth onClick={() => nav && nav.back()}>Save as Draft</Button>
        </div>
        <div style={{ height: 16 }} />
      </ScrollBody>

      <KycGateModal
        open={showKycGate}
        onClose={() => setShowKycGate(false)}
        onCompleteKyc={() => { setShowKycGate(false); nav && nav.go('kyc-intro'); }}
        mode="publish"
      />
    </Screen>
  );
}

// PillRow — single- or multi-select chip row
function PillRow({ options, value, onChange, multi = false }) {
  const isActive = (o) => multi ? (value || []).includes(o) : value === o;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: '9px 14px', cursor: 'pointer',
          background: isActive(o) ? SC.primary : '#fff',
          color: isActive(o) ? '#fff' : SC.text,
          border: isActive(o) ? `1px solid ${SC.primary}` : `1px solid ${SC.border}`,
          borderRadius: 999,
          fontSize: 13, fontWeight: SF.weights.medium, fontFamily: SF.family,
          transition: 'background 0.12s, color 0.12s',
        }}>{o}</button>
      ))}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: '#fff',
      border: `1px solid ${SC.border}`, borderRadius: SR.md,
    }}>
      <span style={{ fontSize: 15, color: SC.text, fontFamily: SF.family }}>{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ErrorText({ children }) {
  return <div style={{ fontSize: 13, color: SC.danger, marginTop: 6, fontFamily: SF.family }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────
// Notifications (placeholder Tab 3)
// ─────────────────────────────────────────────────────────────
function NotificationsScreen({ nav }) {
  const notifs = window.SAMPLE_NOTIFICATIONS || [];
  return (
    <Screen bg={SC.surface} padBottom={0}>
      <div style={{ padding: '8px 20px 16px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 30, fontWeight: SF.weights.bold, color: SC.text, margin: 0, letterSpacing: -0.8 }}>
          Notifications
        </h1>
      </div>
      <ScrollBody padding={16} gap={10} bg={SC.surface}>
        {notifs.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40, gap: 10, textAlign: 'center',
          }}>
            <div style={{ fontSize: 17, fontWeight: SF.weights.bold, color: SC.text }}>You're all caught up</div>
            <div style={{ fontSize: 14, color: SC.textSec }}>New activity will show up here.</div>
          </div>
        ) : (
          notifs.map((n) => <NotificationRow key={n.id} notification={n} />)
        )}
        <div style={{ height: 16 }} />
      </ScrollBody>
      {tabNav(nav, 'notifications')}
    </Screen>
  );
}

function NotificationRow({ notification }) {
  const n = notification;
  const iconCfg = {
    interest_accepted: { bg: SC.successLight, fg: SC.success, sym: '✓' },
    new_interest:      { bg: SC.primaryLight, fg: SC.primary, sym: '◆' },
    kyc_verified:      { bg: SC.successLight, fg: SC.success, sym: '✓' },
    payment:           { bg: SC.primaryLight, fg: SC.primary, sym: '₹' },
    lease_ending:      { bg: SC.warningLight, fg: SC.warning, sym: '!' },
  }[n.kind] || { bg: SC.surface, fg: SC.textSec, sym: '•' };
  return (
    <div style={{
      background: '#fff', border: `1px solid ${SC.border}`,
      borderRadius: SR.md, padding: 14,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      position: 'relative', fontFamily: SF.family,
    }}>
      {n.unread && (
        <span style={{
          position: 'absolute', top: 14, left: 14,
          width: 8, height: 8, borderRadius: 4, background: SC.primary,
        }} />
      )}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: iconCfg.bg, color: iconCfg.fg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: SF.weights.bold,
        marginLeft: n.unread ? 12 : 0,
      }}>{iconCfg.sym}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: SF.weights.semibold,
          color: SC.text, letterSpacing: -0.2,
        }}>{n.title}</div>
        <div style={{ fontSize: 13, color: SC.textSec, lineHeight: 1.45, marginTop: 4 }}>{n.body}</div>
        <div style={{ fontSize: 11, color: SC.textDis, marginTop: 6 }}>{n.time}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BrowseScreen, PropertyDetailScreen, PropertyDetailOwnerScreen,
  InterestRequestsScreen, AddPropertyScreen, NotificationsScreen,
  pickRole, tabNav,
});
