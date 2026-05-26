// TrustNest design tokens — verbatim from spec
window.TN = {
  color: {
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    primaryBorder: '#BFDBFE',
    bg: '#FFFFFF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
    borderStrong: '#D1D5DB',
    text: '#111827',
    textSec: '#6B7280',
    textDis: '#9CA3AF',
    success: '#16A34A',
    successLight: '#F0FDF4',
    successBorder: '#BBF7D0',
    successDark: '#166534',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',
    dangerBorder: '#FECACA',
    dangerDark: '#991B1B',
    dangerDeep: '#7F1D1D',
    statusGrey: '#6B7280',
    statusGreyBg: '#F3F4F6',
  },
  font: {
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
    sizes: { xs: 11, sm: 13, md: 15, base: 17, lg: 20, xl: 24, xxl: 30 },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 12: 48 },
  radius: { xs: 4, sm: 8, md: 12, lg: 16, full: 9999 },
  shadow: {
    card: '0 1px 2px rgba(17,24,39,0.04), 0 1px 3px rgba(17,24,39,0.06)',
    fab: '0 4px 12px rgba(37,99,235,0.35), 0 2px 4px rgba(37,99,235,0.2)',
    sheet: '0 8px 24px rgba(17,24,39,0.10)',
  },
};

// INR formatter
window.formatINR = (n) => {
  if (n == null) return '';
  const s = Math.round(n).toString();
  if (s.length <= 3) return '₹' + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return '₹' + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
};
