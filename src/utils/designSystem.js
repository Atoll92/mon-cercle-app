// Design System Configuration
// This file contains all design tokens and system configuration to ensure consistency

// Spacing scale (8px base)
export const spacing = {
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  xxl: 48,  // 48px
  xxxl: 64, // 64px
};

// Typography scale
export const typography = {
  // Font families
  fontFamily: {
    primary: '"Inter", "Helvetica", "Arial", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: '50%',
  pill: 9999,
};

// Shadows
export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
  base: '0 4px 12px rgba(0, 0, 0, 0.08)',
  md: '0 8px 24px rgba(0, 0, 0, 0.12)',
  lg: '0 16px 32px rgba(0, 0, 0, 0.16)',
  xl: '0 24px 48px rgba(0, 0, 0, 0.20)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
};

// Transitions
export const transitions = {
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Z-index scale
export const zIndex = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
};

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};

// Component specific styles
export const components = {
  // Button styles
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    padding: {
      sm: '0 12px',
      md: '0 16px',
      lg: '0 24px',
    },
    fontSize: {
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },
  
  // Card styles
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    shadow: shadows.base,
  },
  
  // Input styles
  input: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    borderRadius: borderRadius.sm,
  },
  
  // Modal styles
  modal: {
    maxWidth: {
      sm: 400,
      md: 600,
      lg: 800,
      xl: 1000,
    },
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  
  // Avatar styles
  avatar: {
    size: {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 64,
    },
  },
  
  // Chip styles
  chip: {
    height: {
      sm: 24,
      md: 32,
    },
    padding: {
      sm: '0 8px',
      md: '0 12px',
    },
  },
};

// Animation presets
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideIn: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  pulse: {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
};

// Consistent component patterns
export const patterns = {
  // Loading states
  loading: {
    skeleton: {
      animation: 'pulse 1.5s ease-in-out infinite',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  },
  
  // Empty states
  emptyState: {
    padding: `${spacing.xxl}px ${spacing.lg}px`,
    textAlign: 'center',
    color: 'text.secondary',
  },
  
  // Error states
  errorState: {
    padding: `${spacing.xl}px ${spacing.lg}px`,
    textAlign: 'center',
    color: 'error.main',
  },
  
  // Hover states
  hover: {
    transform: 'translateY(-2px)',
    shadow: shadows.md,
  },
  
  // Focus states
  focus: {
    outline: '2px solid',
    outlineOffset: 2,
  },
};

// Color opacity levels
export const opacity = {
  5: 0.05,
  10: 0.1,
  20: 0.2,
  30: 0.3,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  70: 0.7,
  80: 0.8,
  90: 0.9,
  95: 0.95,
};

// Consistent spacing patterns
export const layout = {
  containerPadding: {
    mobile: spacing.md,
    desktop: spacing.lg,
  },
  sectionSpacing: {
    mobile: spacing.xl,
    desktop: spacing.xxl,
  },
  cardSpacing: spacing.md,
  listSpacing: spacing.sm,
};

// Icon sizes
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

// Common aspect ratios
export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  portrait: '3 / 4',
  landscape: '4 / 3',
  wide: '21 / 9',
};