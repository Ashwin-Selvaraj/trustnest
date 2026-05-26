// TrustNest marketplace primitives
// PropertyPhoto, PropertyCard, FilterChip, SegmentedControl, Toggle, MyListingCard,
// TenantInterestCard, InterestStatusCard, KycGateModal, StickyBar, PhotoGallery.

const MC = window.TN.color;
const MF = window.TN.font;
const MR = window.TN.radius;

// ─────────────────────────────────────────────────────────────
// PropertyPhoto — placeholder image. Per the system: no hand-drawn
// SVG illustrations. Use a tonally-varied gradient + striped overlay
// + simple geometric building silhouette + monospace label.
// ─────────────────────────────────────────────────────────────
function PropertyPhoto({
  hue = 215, height = 180, radius = 12, photos = 1, current = 1,
  topLeftChip, topRightOverlay, footerOverlay, fit = 'top',
}) {
  // Tonal gradient — low-sat, two-stop, varied by hue
  const bg = `linear-gradient(135deg, hsl(${hue} 32% 78%) 0%, hsl(${(hue+30)%360} 28% 62%) 100%)`;
  // Subtle diagonal stripes
  const stripes = `repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 6px, transparent 6px, transparent 14px)`;
  const r = typeof radius === 'number' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius, borderBottomLeftRadius: fit === 'all' ? radius : 0, borderBottomRightRadius: fit === 'all' ? radius : 0 } : {};
  return (
    <div style={{
      position: 'relative', width: '100%', height, overflow: 'hidden',
      background: bg,
      ...r,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: stripes }} />
      {/* simple building silhouette */}
      <BuildingSilhouette hue={hue} />
      {/* label */}
      <div style={{
        position: 'absolute', top: 10, right: 12, padding: '3px 8px',
        background: 'rgba(17,24,39,0.55)', color: '#fff',
        fontSize: 10, fontWeight: MF.weights.medium, borderRadius: 4,
        fontFamily: 'ui-monospace, "SF Mono", monospace', letterSpacing: 0.2,
      }}>{current}/{photos} · photo</div>
      {topLeftChip && (
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>{topLeftChip}</div>
      )}
      {topRightOverlay && (
        <div style={{ position: 'absolute', bottom: 10, right: 12 }}>{topRightOverlay}</div>
      )}
      {footerOverlay}
    </div>
  );
}

// Building silhouette: just rectangles for buildings and tiny rects for windows.
function BuildingSilhouette({ hue = 215 }) {
  const fill = `hsla(${hue} 35% 28% / 0.32)`;
  const winFill = `hsla(${hue} 35% 88% / 0.55)`;
  return (
    <svg
      viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      {/* Three offset blocks */}
      <rect x="20"  y="80"  width="80"  height="140" fill={fill} />
      <rect x="110" y="50"  width="90"  height="170" fill={fill} />
      <rect x="210" y="100" width="60"  height="120" fill={fill} />
      <rect x="280" y="70"  width="100" height="150" fill={fill} />
      {/* Window grid for each block — rendered as small rects */}
      {Array.from({ length: 5 }).map((_, row) => (
        <React.Fragment key={row}>
          <rect x={28 + (row%2)*0}  y={92 + row * 22} width="10" height="8" fill={winFill}/>
          <rect x={44 + (row%2)*0}  y={92 + row * 22} width="10" height="8" fill={winFill}/>
          <rect x={60 + (row%2)*0}  y={92 + row * 22} width="10" height="8" fill={winFill}/>
          <rect x={76 + (row%2)*0}  y={92 + row * 22} width="10" height="8" fill={winFill}/>
        </React.Fragment>
      ))}
      {Array.from({ length: 6 }).map((_, row) => (
        <React.Fragment key={'b'+row}>
          <rect x="120" y={64 + row * 22} width="10" height="8" fill={winFill}/>
          <rect x="138" y={64 + row * 22} width="10" height="8" fill={winFill}/>
          <rect x="156" y={64 + row * 22} width="10" height="8" fill={winFill}/>
          <rect x="174" y={64 + row * 22} width="10" height="8" fill={winFill}/>
        </React.Fragment>
      ))}
      {Array.from({ length: 5 }).map((_, row) => (
        <React.Fragment key={'c'+row}>
          <rect x="218" y={112 + row * 18} width="8" height="6" fill={winFill}/>
          <rect x="232" y={112 + row * 18} width="8" height="6" fill={winFill}/>
          <rect x="246" y={112 + row * 18} width="8" height="6" fill={winFill}/>
        </React.Fragment>
      ))}
      {Array.from({ length: 6 }).map((_, row) => (
        <React.Fragment key={'d'+row}>
          <rect x="290" y={82 + row * 18} width="10" height="6" fill={winFill}/>
          <rect x="308" y={82 + row * 18} width="10" height="6" fill={winFill}/>
          <rect x="326" y={82 + row * 18} width="10" height="6" fill={winFill}/>
          <rect x="344" y={82 + row * 18} width="10" height="6" fill={winFill}/>
          <rect x="362" y={82 + row * 18} width="10" height="6" fill={winFill}/>
        </React.Fragment>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// FilterChip — horizontal scrollable pill
// ─────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: '8px 14px',
        background: active ? MC.primary : '#fff',
        color: active ? '#fff' : MC.text,
        border: active ? `1px solid ${MC.primary}` : `1px solid ${MC.border}`,
        borderRadius: 999,
        fontSize: 12, fontWeight: MF.weights.medium,
        cursor: 'pointer', fontFamily: MF.family,
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// SearchBar — 40px, with leading search icon
// ─────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder = 'Search by area, locality…' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 40, padding: '0 12px',
      background: '#fff',
      border: `1px solid ${MC.border}`,
      borderRadius: 8,
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke={MC.textSec} strokeWidth="1.6"/>
        <path d="M12.5 12.5L16 16" stroke={MC.textSec} strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
      <input
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 14, fontFamily: MF.family, color: MC.text,
          padding: 0,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SegmentedControl — two-way / three-way segment
// ─────────────────────────────────────────────────────────────
function SegmentedControl({ value, onChange, segments }) {
  return (
    <div style={{
      display: 'flex', gap: 0, background: '#fff',
      borderBottom: `1px solid ${MC.border}`,
    }}>
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <button key={s.id} onClick={() => onChange && onChange(s.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer',
            padding: '12px 8px 10px',
            background: 'transparent', fontFamily: MF.family,
            fontSize: 14, fontWeight: active ? MF.weights.semibold : MF.weights.medium,
            color: active ? MC.primary : MC.textSec,
            borderBottom: active ? `2px solid ${MC.primary}` : '2px solid transparent',
            transition: 'color 0.12s',
          }}>{s.label}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toggle / switch — iOS-style
// ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange && onChange(!checked)}
      style={{
        width: 50, height: 30, borderRadius: 999,
        background: checked ? MC.primary : '#D1D5DB',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.18s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 24, height: 24, borderRadius: '50%',
        background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.18s',
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// AttributeChip — small icon+label chip used inside PropertyCard
// ─────────────────────────────────────────────────────────────
function AttributeChip({ icon, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', background: MC.surface,
      border: `1px solid ${MC.border}`, borderRadius: 6,
      fontSize: 12, color: MC.textSec, fontFamily: MF.family,
      whiteSpace: 'nowrap',
    }}>
      {icon}
      {children}
    </span>
  );
}

function IconBhk({ color = MC.textSec, size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 10V5L6 2L10 5V10H7V8H5V10H2Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>;
}
function IconSofa({ color = MC.textSec, size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6V8.5h8V6M2 6V4a1 1 0 011-1h6a1 1 0 011 1v2M3 8.5V10M9 8.5V10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
function IconUsers({ color = MC.textSec, size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <circle cx="5" cy="4" r="1.8" stroke={color} strokeWidth="1.2"/>
    <path d="M1.5 10c0-1.7 1.4-3 3.5-3s3.5 1.3 3.5 3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="9" cy="4.5" r="1.3" stroke={color} strokeWidth="1.2"/>
  </svg>;
}
function IconCalendar({ color = MC.textSec, size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <rect x="1.5" y="2.5" width="9" height="8" rx="1" stroke={color} strokeWidth="1.2"/>
    <path d="M1.5 5h9M4 1.5V3M8 1.5V3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>;
}
function IconHeart({ color = MC.textSec, filled = false, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
    <path d="M12 20.5C-1.5 13 4 4 8.5 4c2 0 3 1 3.5 2.5C12.5 5 13.5 4 15.5 4c4.5 0 10 9-3.5 16.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>;
}
function IconPin({ color = MC.textSec, size = 12 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 1.5C8 1.5 9.5 3 9.5 5c0 2.5-3.5 5.5-3.5 5.5S2.5 7.5 2.5 5C2.5 3 4 1.5 6 1.5Z" stroke={color} strokeWidth="1.2"/>
    <circle cx="6" cy="5" r="1.2" stroke={color} strokeWidth="1.2"/>
  </svg>;
}

// ─────────────────────────────────────────────────────────────
// VerifiedOwnerChip — green chip for verified owners
// ─────────────────────────────────────────────────────────────
function VerifiedOwnerChip() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', background: MC.successLight,
      color: MC.success, border: `1px solid ${MC.successBorder}`,
      borderRadius: 999, fontSize: 11, fontWeight: MF.weights.semibold,
      fontFamily: MF.family, whiteSpace: 'nowrap',
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1L6 3L8.5 3.4L6.8 5.2L7.2 7.5L5 6.5L2.8 7.5L3.2 5.2L1.5 3.4L4 3L5 1Z" fill={MC.success}/>
      </svg>
      Verified Owner
    </span>
  );
}

function NegotiableChip({ negotiable }) {
  if (negotiable) {
    return (
      <span style={{
        padding: '3px 8px', background: MC.success, color: '#fff',
        borderRadius: 999, fontSize: 11, fontWeight: MF.weights.semibold,
        fontFamily: MF.family,
      }}>Negotiable</span>
    );
  }
  return (
    <span style={{
      padding: '3px 8px', background: 'rgba(17,24,39,0.6)', color: '#fff',
      borderRadius: 999, fontSize: 11, fontWeight: MF.weights.semibold,
      fontFamily: MF.family,
    }}>Fixed rent</span>
  );
}

// ─────────────────────────────────────────────────────────────
// StatTriplet — 3 stats separated by thin vertical dividers
// ─────────────────────────────────────────────────────────────
function StatTriplet({ items }) {
  return (
    <div style={{
      display: 'flex', gap: 0, padding: '4px 0',
    }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div style={{ width: 1, alignSelf: 'stretch', background: MC.border, margin: '0 14px' }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: MF.weights.bold, color: MC.text,
              fontFamily: MF.family, letterSpacing: -0.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{it.value}</div>
            <div style={{
              fontSize: 11, color: MC.textSec, marginTop: 2,
              fontFamily: MF.family, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: MF.weights.medium,
            }}>{it.label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PropertyCard — used on Browse screen
// ─────────────────────────────────────────────────────────────
function PropertyCard({ property, onView, onFavourite, favourited = false }) {
  const p = property;
  return (
    <div
      onClick={onView}
      style={{
        background: '#fff', border: `1px solid ${MC.border}`,
        borderRadius: MR.md, overflow: 'hidden',
        boxShadow: window.TN.shadow.card,
        fontFamily: MF.family, cursor: onView ? 'pointer' : 'default',
        transition: 'transform 0.1s, box-shadow 0.15s',
      }}
    >
      <PropertyPhoto
        hue={p.photoHue || 215} height={180} photos={p.photos || 1} current={1}
        topLeftChip={<NegotiableChip negotiable={p.negotiable} />}
      />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: MF.weights.semibold, color: MC.text, letterSpacing: -0.2, lineHeight: 1.3, flex: 1 }}>
            {p.title}
          </div>
          {p.owner?.kyc === 'verified' && <VerifiedOwnerChip />}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: MC.textSec }}>
          <IconPin /> {p.locality}
        </div>
        <StatTriplet items={[
          { value: `${window.formatINR(p.rent)} / mo`, label: 'Rent' },
          { value: window.formatINR(p.deposit), label: 'Deposit' },
          { value: `${p.sqft} sqft`, label: 'Built-up' },
        ]} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <AttributeChip icon={<IconSofa />}>{p.furnishingLabel}</AttributeChip>
          <AttributeChip icon={<IconBhk />}>{p.bhk} BHK</AttributeChip>
          <AttributeChip icon={<IconUsers />}>{p.tenantPref}</AttributeChip>
          <AttributeChip icon={<IconCalendar />}>{p.available === '01 Feb 2025' || new Date(p.available) <= new Date() ? 'Ready to move' : 'From ' + p.available}</AttributeChip>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', background: MC.surface,
          border: `1px solid ${MC.border}`, borderRadius: MR.sm,
        }}>
          <Avatar name={p.owner.name} size={28} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Owner: <span style={{ fontWeight: MF.weights.semibold, color: MC.text }}>{p.owner.name.split(' ')[0]} {p.owner.name.split(' ')[1]?.[0] || ''}.</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Stars value={p.owner.score} size={11} />
            <span style={{ fontSize: 12, fontWeight: MF.weights.semibold, color: MC.text }}>{p.owner.score.toFixed(1)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Button fullWidth onClick={(e) => { e.stopPropagation(); onView && onView(); }}>View Details</Button>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onFavourite && onFavourite(); }}
            style={{
              width: 48, height: 48, border: `1px solid ${MC.border}`,
              borderRadius: MR.sm, background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: favourited ? MC.danger : MC.textSec,
              transition: 'color 0.12s, background 0.12s',
            }}
          >
            <IconHeart filled={favourited} color={favourited ? MC.danger : MC.textSec} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PhotoGallery — full-bleed paged photo strip with dots
// ─────────────────────────────────────────────────────────────
function PhotoGallery({ property, initialIndex = 0, height = 260 }) {
  const [idx, setIdx] = React.useState(initialIndex);
  const count = property.photos || 1;
  return (
    <div style={{ position: 'relative', height }}>
      <PropertyPhoto
        hue={(property.photoHue || 215) + idx * 18}
        height={height} radius={0} photos={count} current={idx + 1}
      />
      {/* swipe affordance — left/right arrows */}
      {idx > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }} style={galleryArrowStyle('left')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {idx < count - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }} style={galleryArrowStyle('right')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {/* dots */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6,
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
            style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
              background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'width 0.2s, background 0.2s',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}
function galleryArrowStyle(side) {
  return {
    position: 'absolute', top: '50%', [side]: 12, transform: 'translateY(-50%)',
    width: 36, height: 36, borderRadius: 18,
    background: 'rgba(17,24,39,0.45)',
    border: 'none', cursor: 'pointer', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  };
}

// ─────────────────────────────────────────────────────────────
// CircleIconButton — for back / heart at top of property detail
// ─────────────────────────────────────────────────────────────
function CircleIconButton({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 18,
      background: 'rgba(255,255,255,0.95)',
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      ...style,
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// StickyBar — bottom action bar with safe-area padding
// ─────────────────────────────────────────────────────────────
function StickyBar({ left, right }) {
  return (
    <div style={{
      flexShrink: 0,
      borderTop: `1px solid ${MC.border}`,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      padding: '12px 16px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {left && <div style={{ flex: 1, minWidth: 0 }}>{left}</div>}
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MyListingCard — for owner's My Listings screen
// ─────────────────────────────────────────────────────────────
const LISTING_STATUS = {
  ACTIVE:   { label: 'Active',  fg: MC.success, bg: MC.successLight, dot: MC.success },
  DRAFT:    { label: 'Draft',   fg: '#374151',  bg: '#F3F4F6',       dot: '#9CA3AF' },
  PAUSED:   { label: 'Paused',  fg: '#374151',  bg: '#F3F4F6',       dot: MC.warning },
  RENTED:   { label: 'Rented',  fg: MC.primary, bg: MC.primaryLight, dot: MC.primary },
};

function ListingStatusChip({ status }) {
  const s = LISTING_STATUS[status] || LISTING_STATUS.DRAFT;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', background: s.bg, color: s.fg,
      borderRadius: 999, fontSize: 11, fontWeight: MF.weights.semibold,
      fontFamily: MF.family,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: s.dot }} />
      {s.label}
    </span>
  );
}

function MyListingCard({ listing, onView, onEdit, onPause, onDelete }) {
  const p = listing;
  return (
    <div style={{
      background: '#fff', border: `1px solid ${MC.border}`,
      borderRadius: MR.md, overflow: 'hidden',
      boxShadow: window.TN.shadow.card,
      fontFamily: MF.family,
    }}>
      <div onClick={onView} style={{ display: 'flex', gap: 12, padding: 12, cursor: onView ? 'pointer' : 'default' }}>
        <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          {p.photos > 0 ? (
            <PropertyPhoto hue={p.photoHue || 215} height={80} radius={8} photos={p.photos} current={1} fit="all" />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 8, background: MC.surface,
              border: `1px dashed ${MC.borderStrong}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: MC.textDis, fontSize: 11, fontWeight: MF.weights.medium,
              fontFamily: MF.family, textAlign: 'center',
            }}>No photo</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: MF.weights.semibold, color: MC.text, letterSpacing: -0.2 }}>{p.title}</div>
            <ListingStatusChip status={p.status} />
          </div>
          <div style={{ fontSize: 14, color: '#374151' }}>{window.formatINR(p.rent)} / mo</div>
          <div style={{ fontSize: 13, color: MC.textSec }}>{window.formatINR(p.deposit)} deposit</div>
          <div style={{
            fontSize: 13, marginTop: 2,
            color: p.interests > 0 ? MC.primary : MC.textDis,
            fontWeight: p.interests > 0 ? MF.weights.semibold : MF.weights.regular,
          }}>
            {p.interests > 0 ? `${p.interests} interested` : '0 interested'}
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex', borderTop: `1px solid #F3F4F6`,
      }}>
        <ListingAction label="Edit" color={MC.primary} onClick={onEdit} />
        <ListingAction label={p.status === 'PAUSED' ? 'Activate' : 'Pause'} color={MC.textSec} onClick={onPause} />
        <ListingAction label="Delete" color={MC.danger} onClick={onDelete} />
      </div>
    </div>
  );
}
function ListingAction({ label, color, onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} style={{
      flex: 1, border: 'none', background: 'transparent',
      padding: '10px 0', cursor: 'pointer',
      color, fontFamily: MF.family,
      fontSize: 13, fontWeight: MF.weights.semibold,
    }}>{label}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// TenantInterestCard — owner sees who's expressed interest
// ─────────────────────────────────────────────────────────────
function TenantInterestCard({ interest, onAccept, onDecline, onUndo, onViewProfile }) {
  const i = interest;
  if (i.state === 'accepted') {
    return (
      <div style={{
        background: MC.successLight, border: `1px solid ${MC.successBorder}`,
        borderRadius: MR.md, padding: 14,
        display: 'flex', gap: 12, alignItems: 'center',
        fontFamily: MF.family,
      }}>
        <Avatar name={i.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: MF.weights.semibold, color: MC.text }}>{i.name}</div>
          <div style={{ fontSize: 13, color: MC.successDark, fontWeight: MF.weights.medium, marginTop: 2 }}>
            Accepted — Agreement created
          </div>
        </div>
        <Button variant="ghost" size="sm">View</Button>
      </div>
    );
  }
  if (i.state === 'declined') {
    return (
      <div style={{
        background: '#F9FAFB', border: `1px solid ${MC.border}`,
        borderRadius: MR.md, padding: 14,
        display: 'flex', gap: 12, alignItems: 'center',
        fontFamily: MF.family, opacity: 0.85,
      }}>
        <Avatar name={i.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: MF.weights.semibold, color: MC.text }}>{i.name}</div>
          <div style={{ fontSize: 13, color: MC.textSec, marginTop: 2 }}>Declined</div>
        </div>
        <button onClick={onUndo} style={{
          border: 'none', background: 'transparent', color: MC.primary,
          fontSize: 13, fontWeight: MF.weights.semibold, cursor: 'pointer',
          fontFamily: MF.family,
        }}>Undo</button>
      </div>
    );
  }
  return (
    <div style={{
      background: '#fff', border: `1px solid ${MC.border}`,
      borderRadius: MR.md, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
      fontFamily: MF.family,
      boxShadow: window.TN.shadow.card,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={i.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: MF.weights.semibold, color: MC.text, letterSpacing: -0.2 }}>{i.name}</div>
          <div style={{ fontSize: 13, color: MC.textSec, marginTop: 2 }}>
            <span style={{ fontFamily: 'ui-monospace, monospace' }}>{i.phoneMasked}</span>
            <span style={{ margin: '0 6px' }}>·</span>
            <span style={{ color: MC.textDis, fontSize: 12 }}>Applied {i.appliedAt}</span>
          </div>
        </div>
        <KycBadge state={i.kyc} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px', background: MC.surface,
        borderRadius: MR.sm, border: `1px solid ${MC.border}`,
      }}>
        <Stars value={i.score} size={13} />
        <span style={{ fontSize: 13, fontWeight: MF.weights.semibold, color: MC.text }}>{i.score.toFixed(1)}</span>
        <span style={{ fontSize: 13, color: MC.textSec }}>· {i.reviews} reviews</span>
      </div>
      {i.message && (
        <div style={{
          fontSize: 13, color: MC.textSec, fontStyle: 'italic',
          lineHeight: 1.5, padding: '0 2px',
        }}>"{i.message}"</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        borderTop: `1px solid #F3F4F6`, paddingTop: 12,
      }}>
        <button onClick={onViewProfile} style={{
          border: 'none', background: 'transparent', color: MC.primary,
          fontSize: 13, fontWeight: MF.weights.semibold, cursor: 'pointer',
          fontFamily: MF.family, padding: '6px 4px',
        }}>View full profile</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={onDecline}>Decline</Button>
          <Button size="sm" onClick={onAccept}>Accept</Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// InterestStatusCard — tenant sees status of their interest
// ─────────────────────────────────────────────────────────────
function InterestStatusCard({ interest, onView, onOpenAgreement }) {
  const i = interest;
  const statusMap = {
    PENDING:  { fg: MC.warning, bg: MC.warningLight, label: 'Pending' },
    ACCEPTED: { fg: MC.success, bg: MC.successLight, label: 'Accepted' },
    DECLINED: { fg: MC.danger,  bg: MC.dangerLight,  label: 'Declined' },
  };
  const s = statusMap[i.state] || statusMap.PENDING;
  return (
    <div onClick={onView} style={{
      background: '#fff', border: `1px solid ${MC.border}`,
      borderRadius: MR.md, padding: 12,
      display: 'flex', gap: 12, alignItems: 'flex-start',
      fontFamily: MF.family, cursor: onView ? 'pointer' : 'default',
      boxShadow: window.TN.shadow.card,
    }}>
      <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <PropertyPhoto hue={i.photoHue || 215} height={72} radius={8} photos={1} current={1} fit="all" />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 14, fontWeight: MF.weights.semibold, color: MC.text, letterSpacing: -0.2 }}>{i.title}</div>
        <div style={{ fontSize: 12, color: MC.textSec }}>{i.locality}</div>
        <div style={{ fontSize: 13, color: '#374151' }}>{window.formatINR(i.rent)} / mo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', background: s.bg, color: s.fg,
            borderRadius: 999, fontSize: 11, fontWeight: MF.weights.semibold,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: s.fg }} />
            {s.label}
          </span>
          <span style={{ fontSize: 11, color: MC.textDis }}>Applied {i.appliedAt}</span>
        </div>
        {i.state === 'ACCEPTED' && (
          <div onClick={(e) => { e.stopPropagation(); onOpenAgreement && onOpenAgreement(); }} style={{
            fontSize: 13, color: MC.primary, fontWeight: MF.weights.semibold,
            marginTop: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            Agreement created — tap to view
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke={MC.primary} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KycGateModal — shown when non-verified user tries to express interest
// ─────────────────────────────────────────────────────────────
function KycGateModal({ open, onClose, onCompleteKyc, mode = 'interest' }) {
  if (!open) return null;
  const copy = mode === 'publish'
    ? {
        title: 'Verify your identity to publish',
        body: 'Listings on TrustNest are published only by verified owners. This protects both you and potential tenants.',
        cta: 'Complete KYC',
      }
    : {
        title: 'Verify your identity to express interest',
        body: 'Complete your KYC to express interest. This protects both you and the owner.',
        cta: 'Complete KYC',
      };
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(17,24,39,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'tn-fade-in 0.18s ease-out',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: '#fff',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '20px 24px 32px',
        fontFamily: MF.family,
        animation: 'tn-sheet-up 0.22s cubic-bezier(.2,.7,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, background: MC.border, borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: MC.warningLight, color: MC.warning,
          margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 4l11 18H3L14 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M14 12v5M14 19v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: MF.weights.bold, color: MC.text, letterSpacing: -0.4 }}>
          {copy.title}
        </div>
        <div style={{ textAlign: 'center', fontSize: 14, color: MC.textSec, marginTop: 8, lineHeight: 1.5 }}>
          {copy.body}
        </div>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button fullWidth onClick={onCompleteKyc}>{copy.cta}</Button>
          <Button variant="secondary" fullWidth onClick={onClose}>Not now</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  PropertyPhoto, BuildingSilhouette,
  FilterChip, SearchBar, SegmentedControl, Toggle,
  AttributeChip, IconBhk, IconSofa, IconUsers, IconCalendar, IconHeart, IconPin,
  VerifiedOwnerChip, NegotiableChip, StatTriplet,
  PropertyCard, PhotoGallery, CircleIconButton, StickyBar,
  MyListingCard, ListingStatusChip, LISTING_STATUS,
  TenantInterestCard, InterestStatusCard, KycGateModal,
});
