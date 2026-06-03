import { StyleSheet, Platform } from 'react-native';

export const LIGHT_COLORS = {
  // Brand Colors
  primary: '#185955',        // Hoosier Deep Forest Teal/Sage
  accent: '#968469',         // Southern Indiana Warm Sand / Bronze Clay
  background: '#e8e2d3',     // Southern Indiana Premium Warm Sand Clay Background
  cardSurface: '#FFFFFF',    // Card Canvas White
  
  // Text Colors
  textPrimary: '#1B3432',    // Dark Forest Slate-Teal Text
  textSecondary: '#5A716E',  // Muted Sage-Teal Text
  textLight: '#8BA39F',      // Soft Sage Gray Text
  textOnDark: '#FFFFFF',     // Contrast White
  
  // Decorative
  border: '#E6ECEB',         // Sleek Soft Sage-Tinted Border
  success: '#2D7F67',        // Rich Forest Green/Teal Success
  warning: '#D4A373',        // Warm Sand Gold Warning
};

export const DARK_COLORS = {
  // Brand Colors
  primary: '#7FB3B0',        // Soft Pastel Sage Teal
  accent: '#C5B499',         // Muted Warm Sand / Bronze
  background: '#0E2523',     // Deep Dark Forest Teal-Charcoal
  cardSurface: '#183633',    // Rich Card Canvas Forest Teal
  
  // Text Colors
  textPrimary: '#EAF2F1',    // Warm Alabaster White Text
  textSecondary: '#8BA39F',  // Elegant Sage Gray Text
  textLight: '#5A716E',      // Slate Muted Teal-Gray Text
  textOnDark: '#FFFFFF',
  
  // Decorative
  border: '#254541',         // Subtle Boundary Slate Teal Border
  success: '#52B788',        // Soft Mint Emerald Success
  warning: '#E9D8A6',        // Soft Peach Amber Warning
};

// Expose static COLORS as LIGHT_COLORS for backwards compatibility
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Dynamic typography generator
export const getTypography = (colors) => ({
  headerLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerMedium: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bodyRegular: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    color: colors.textLight,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textOnDark,
  },
});

// Fallback static TYPOGRAPHY using LIGHT_COLORS
export const TYPOGRAPHY = getTypography(LIGHT_COLORS);

export const SHADOWS = {
  light: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    ...Platform.select({
      android: { elevation: 0 },
      default: { elevation: 2 },
    }),
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    ...Platform.select({
      android: { elevation: 0 },
      default: { elevation: 4 },
    }),
  },
  accent: {
    shadowColor: '#8B1E3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    ...Platform.select({
      android: { elevation: 0 },
      default: { elevation: 4 },
    }),
  },
};

// Dynamic style sheet generator
export const getGlobalStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  headerContainer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: colors.accent,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeContainer: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
});

// Expose static GLOBAL_STYLES for light mode fallback
export const GLOBAL_STYLES = getGlobalStyles(LIGHT_COLORS);
