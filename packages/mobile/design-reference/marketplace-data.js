// TrustNest marketplace — sample listings, interests, notifications.

window.SAMPLE_PROPERTIES = [
  {
    id: 'p1',
    title: '3 BHK Apartment in Whitefield',
    locality: 'Whitefield, Bengaluru',
    address: 'Flat 7B, Mahindra Windchimes, ITPL Road, Whitefield, Bengaluru 560066',
    rent: 25000, deposit: 75000, maintenance: 1500, sqft: 1200,
    bhk: 3, furnishingLabel: 'Semi-furnished', furnishing: 'semi',
    tenantPref: 'Family preferred', floor: '7', totalFloors: 12, parking: '1 covered',
    age: '4 years', facing: 'East',
    available: '01 Feb 2025',
    photos: 4, negotiable: true, status: 'ACTIVE',
    photoHue: 215,
    amenities: ['Lift', 'Power backup', 'Security', 'Gym', 'Swimming pool', 'Club house', 'Park'],
    owner: { name: 'Rajesh Kumar', initial: 'R', kyc: 'verified', score: 4.7, reviews: 14, joined: 'Jan 2024' },
    interests: 3,
  },
  {
    id: 'p2',
    title: '2 BHK in Koramangala',
    locality: 'Koramangala 4th Block, Bengaluru',
    address: 'F-12, Casa Grande, 80 Feet Road, Koramangala, Bengaluru 560034',
    rent: 38000, deposit: 110000, maintenance: 2200, sqft: 950,
    bhk: 2, furnishingLabel: 'Fully furnished', furnishing: 'full',
    tenantPref: 'All', floor: '4', totalFloors: 6, parking: '1 covered',
    age: '2 years', facing: 'North',
    available: '15 Feb 2025',
    photos: 6, negotiable: false, status: 'ACTIVE',
    photoHue: 165,
    amenities: ['Lift', 'Power backup', 'Security', '24/7 water', 'Intercom'],
    owner: { name: 'Priya Sharma', initial: 'P', kyc: 'verified', score: 4.9, reviews: 23, joined: 'Mar 2023' },
    interests: 7,
  },
  {
    id: 'p3',
    title: '1 BHK near Indiranagar Metro',
    locality: 'Indiranagar, Bengaluru',
    address: '12, 100 Feet Road, Indiranagar, Bengaluru 560038',
    rent: 18500, deposit: 55000, maintenance: 800, sqft: 620,
    bhk: 1, furnishingLabel: 'Semi-furnished', furnishing: 'semi',
    tenantPref: 'Working professionals', floor: '2', totalFloors: 4, parking: '2-wheeler only',
    age: '8 years', facing: 'West',
    available: '20 Jan 2025',
    photos: 3, negotiable: true, status: 'ACTIVE',
    photoHue: 35,
    amenities: ['Security', 'Park'],
    owner: { name: 'Vikram Reddy', initial: 'V', kyc: 'verified', score: 4.5, reviews: 6, joined: 'Aug 2024' },
    interests: 0,
  },
  {
    id: 'p4',
    title: '4 BHK Villa in HSR Layout',
    locality: 'HSR Layout Sector 2, Bengaluru',
    address: '47, 12th Main, HSR Layout Sector 2, Bengaluru 560102',
    rent: 72000, deposit: 200000, maintenance: 3000, sqft: 2400,
    bhk: 4, furnishingLabel: 'Unfurnished', furnishing: 'none',
    tenantPref: 'Family', floor: 'Ground', totalFloors: 2, parking: '2 covered',
    age: '6 years', facing: 'South',
    available: '01 Mar 2025',
    photos: 8, negotiable: true, status: 'ACTIVE',
    photoHue: 280,
    amenities: ['Security', 'Park', 'Power backup', '24/7 water', 'Gas pipeline'],
    owner: { name: 'Anjali Kapoor', initial: 'A', kyc: 'verified', score: 4.6, reviews: 11, joined: 'Nov 2023' },
    interests: 2,
  },
];

// Owner's own listings — for "My Listings" screen
window.SAMPLE_MY_LISTINGS = [
  { ...window.SAMPLE_PROPERTIES[0], status: 'ACTIVE', interests: 3 },
  { ...window.SAMPLE_PROPERTIES[1], status: 'ACTIVE', interests: 7, photoHue: 165 },
  {
    id: 'p5', title: '2 BHK in Jayanagar',
    locality: 'Jayanagar 4th Block, Bengaluru',
    rent: 22000, deposit: 66000,
    photos: 0, status: 'DRAFT', interests: 0,
    photoHue: 195,
  },
  {
    id: 'p6', title: 'Studio in HSR Layout',
    locality: 'HSR Layout, Bengaluru',
    rent: 16000, deposit: 48000,
    photos: 3, status: 'PAUSED', interests: 0,
    photoHue: 320,
  },
];

// Tenants who expressed interest in a single owner listing
window.SAMPLE_INTERESTS = [
  {
    id: 'i1', name: 'Aarti Singh', initial: 'A', phoneMasked: '+91 98765 ×××××',
    appliedAt: '2 hours ago', state: 'pending',
    kyc: 'verified', score: 4.9, reviews: 8,
    message: "My family of 4 is relocating to Bengaluru for work. Looking for a long-term lease.",
  },
  {
    id: 'i2', name: 'Rohan Mehta', initial: 'R', phoneMasked: '+91 98765 ×××××',
    appliedAt: '5 hours ago', state: 'pending',
    kyc: 'verified', score: 4.8, reviews: 12,
    message: 'Working professional, prefer to move in by mid-February. Happy to share references.',
  },
  {
    id: 'i3', name: 'Karthik Iyer', initial: 'K', phoneMasked: '+91 98765 ×××××',
    appliedAt: 'Yesterday', state: 'accepted',
    kyc: 'verified', score: 4.6, reviews: 5,
    message: '',
  },
];

// Tenant's interest in listings — for "My Interests" screen
window.SAMPLE_MY_INTERESTS = [
  {
    id: 'my-i1', propertyId: 'p2', title: '2 BHK in Koramangala',
    locality: 'Koramangala 4th Block, Bengaluru', rent: 38000,
    appliedAt: '3 hours ago', state: 'PENDING', photoHue: 165,
  },
  {
    id: 'my-i2', propertyId: 'p1', title: '3 BHK in Whitefield',
    locality: 'Whitefield, Bengaluru', rent: 25000,
    appliedAt: 'Yesterday', state: 'ACCEPTED', photoHue: 215,
    agreementId: 'agr_002',
  },
  {
    id: 'my-i3', propertyId: 'p3', title: '1 BHK in Indiranagar',
    locality: 'Indiranagar, Bengaluru', rent: 18500,
    appliedAt: '2 days ago', state: 'DECLINED', photoHue: 35,
  },
];

// Notifications
window.SAMPLE_NOTIFICATIONS = [
  { id: 'n1', kind: 'interest_accepted', title: 'Your interest was accepted', body: 'Priya Sharma accepted your interest in 2 BHK in Koramangala. An agreement draft has been created.', time: '2h ago', unread: true },
  { id: 'n2', kind: 'new_interest', title: 'New tenant interest', body: 'Aarti Singh expressed interest in your 3 BHK in Whitefield listing.', time: '5h ago', unread: true },
  { id: 'n3', kind: 'kyc_verified', title: 'Identity verified', body: 'Your Aadhaar Card was successfully verified. You can now create rental agreements.', time: 'Yesterday', unread: true },
  { id: 'n4', kind: 'payment', title: 'Deposit confirmed', body: '₹84,000 has been locked in escrow for your Indiranagar agreement.', time: '3 days ago', unread: false },
  { id: 'n5', kind: 'lease_ending', title: 'Lease ending soon', body: 'Your lease at Jayanagar ends in 30 days. Owner can release your deposit anytime after.', time: '1 week ago', unread: false },
];
