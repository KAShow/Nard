export const colors = {
  // Primary - ألوان النرد المرحة
  primary: '#FF6B35',      // برتقالي دافئ
  primaryDark: '#E85A2A',
  primaryLight: '#FF8F66',
  
  // Secondary
  secondary: '#FFD23F',    // أصفر ذهبي
  secondaryDark: '#E6BC38',
  
  // Accent
  accent: '#3BCEAC',       // تركواز
  accentDark: '#2FB896',
  
  // Background
  background: '#FFF8F0',   // كريمي فاتح
  surface: '#FFFFFF',
  surfaceLight: '#FFF5EB',
  
  // Text
  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',
  
  // Status
  success: '#00B894',
  error: '#D63031',
  warning: '#FDCB6E',
  info: '#74B9FF',
  
  // Borders & Dividers
  border: '#DFE6E9',
  divider: '#F0F3F4',
  
  // Special
  badge: '#6C5CE7',
  dice: '#A29BFE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
