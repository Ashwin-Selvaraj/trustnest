// Interactive prototype host — wraps screens in iOS frame with stack navigation
// Provides a `nav` object: { go(route, params), back(), reset(route) }

function Prototype({ initial = 'phone', width = 393, height = 852 }) {
  const [stack, setStack] = React.useState([{ route: initial, params: {} }]);
  const [animating, setAnimating] = React.useState(null); // {dir, fromKey}

  const nav = React.useMemo(() => ({
    go: (route, params = {}) => setStack((s) => [...s, { route, params }]),
    back: () => setStack((s) => s.length > 1 ? s.slice(0, -1) : s),
    reset: (route, params = {}) => setStack([{ route, params }]),
    top: () => stack[stack.length - 1],
  }), [stack]);

  const top = stack[stack.length - 1];
  const screen = renderScreen(top, nav);

  // IOS frame wraps it. We give the device a slight container padding so
  // the rounded outer corners don't clip away the shadow.
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 0, background: 'transparent' }}>
      <IOSDevice width={width} height={height}>
        <div key={stack.length + ':' + top.route} style={{ height: '100%', width: '100%', animation: 'tn-slide-in 0.28s cubic-bezier(.2,.7,.3,1)' }}>
          {screen}
        </div>
      </IOSDevice>
    </div>
  );
}

function renderScreen({ route, params }, nav) {
  switch (route) {
    case 'phone': return <PhoneEntryScreen nav={nav} />;
    case 'otp': return <OtpScreen nav={nav} phone={params.phone || '98765 43210'} />;
    case 'profile-setup': return <ProfileSetupScreen nav={nav} />;
    case 'kyc-intro': return <KycIntroScreen nav={nav} />;
    case 'kyc-document': return <KycDocumentScreen nav={nav} />;
    case 'kyc-upload': return <KycUploadScreen nav={nav} docType={params.docType} />;
    case 'kyc-selfie': return <KycSelfieScreen nav={nav} docType={params.docType} />;
    case 'kyc-submitted': return <KycSubmittedScreen nav={nav} docType={params.docType} />;
    case 'home': return <HomeScreen nav={nav} />;
    case 'browse': return <BrowseScreen nav={nav} />;
    case 'notifications': return <NotificationsScreen nav={nav} />;
    case 'property': return <PropertyDetailScreen nav={nav} propertyId={params.id} />;
    case 'property-owner': return <PropertyDetailOwnerScreen nav={nav} propertyId={params.id} />;
    case 'add-property': return <AddPropertyScreen nav={nav} />;
    case 'interests': return <InterestRequestsScreen nav={nav} propertyId={params.id} />;
    case 'profile': return <ProfileScreen nav={nav} />;
    case 'personal-info': return <PersonalInfoScreen nav={nav} />;
    case 'kyc-details': return <KycDetailsScreen nav={nav} state={params.state || 'verified'} />;
    case 'create': return <CreateAgreementScreen nav={nav} />;
    case 'detail': return <AgreementDetailScreen nav={nav} agreementId={params.id} />;
    case 'payment': return <PaymentScreen nav={nav} agreementId={params.id} />;
    case 'dispute': return <DisputeScreen nav={nav} />;
    case 'confirm': return <ConfirmAgreementScreen nav={nav} agreementId={params.id} />;
    default: return <div style={{ padding: 40 }}>Unknown route: {route}</div>;
  }
}

// Static-frame variant for canvas previews — no navigation, pure state
function StaticFrame({ children, width = 393, height = 852 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <IOSDevice width={width} height={height}>
        {children}
      </IOSDevice>
    </div>
  );
}

Object.assign(window, { Prototype, StaticFrame, renderScreen });
