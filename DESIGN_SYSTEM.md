# Conclav Design System

This document outlines the design system principles and usage guidelines to ensure consistency across the entire application.

## Core Principles

1. **Consistency**: Every UI element follows the same design patterns
2. **Scalability**: Design tokens that work across all screen sizes
3. **Accessibility**: WCAG compliant color contrasts and interactions
4. **Performance**: Optimized animations and transitions
5. **Maintainability**: Centralized design tokens for easy updates

## Design Tokens

### Spacing Scale (8px base)
```javascript
xs: 4px    // Tight spacing
sm: 8px    // Default spacing unit
md: 16px   // Standard component padding
lg: 24px   // Section spacing
xl: 32px   // Large gaps
xxl: 48px  // Hero sections
xxxl: 64px // Maximum spacing
```

### Typography Scale
```javascript
// Font sizes
xs: 12px   // Captions, labels
sm: 14px   // Body small, buttons
base: 16px // Body default
lg: 18px   // Body large
xl: 20px   // H5
2xl: 24px  // H4
3xl: 30px  // H3
4xl: 36px  // H2
5xl: 48px  // H1

// Font weights
light: 300
regular: 400
medium: 500
semibold: 600
bold: 700

// Line heights
tight: 1.25   // Headings
normal: 1.5   // Body text
relaxed: 1.75 // Long-form content
```

### Color System

#### Dynamic Colors
- **Primary**: Network background color or default blue (#1976d2)
- **Secondary**: Automatically generated complementary color
- **Background**: Adapts to network theme
- **Text**: Contrast-adjusted based on background

#### Semantic Colors
- **Success**: Green shades for positive actions
- **Warning**: Orange shades for cautions
- **Error**: Red shades for errors
- **Info**: Blue shades for information

### Border Radius Scale
```javascript
none: 0
sm: 4px    // Inputs, small buttons
base: 8px  // Cards, containers
md: 12px   // Modals, large cards
lg: 16px   // Hero sections
xl: 24px   // Special elements
pill: 9999px // Pills, chips
```

### Shadows
```javascript
xs: '0 1px 2px rgba(0, 0, 0, 0.05)'    // Subtle elevation
sm: '0 2px 4px rgba(0, 0, 0, 0.06)'    // Buttons, inputs
base: '0 4px 12px rgba(0, 0, 0, 0.08)' // Cards default
md: '0 8px 24px rgba(0, 0, 0, 0.12)'   // Hover states
lg: '0 16px 32px rgba(0, 0, 0, 0.16)'  // Modals
xl: '0 24px 48px rgba(0, 0, 0, 0.20)'  // Dropdowns
```

## Component Guidelines

### Buttons
```javascript
// Sizes
Small: 32px height, 12px padding
Medium: 40px height, 16px padding (default)
Large: 48px height, 24px padding

// Variants
- Contained: Primary actions
- Outlined: Secondary actions
- Text: Tertiary actions

// States
- Hover: Lift effect with shadow
- Focus: 2px outline with offset
- Disabled: 50% opacity
```

### Cards
```javascript
// Standard card
padding: 24px
borderRadius: 12px
shadow: base (0 4px 12px)

// Hover effect
shadow: md (0 8px 24px)
transform: translateY(-2px)
```

### Forms
```javascript
// Input fields
height: 40px (medium)
borderRadius: 4px
padding: 0 16px

// Labels
fontSize: 14px
marginBottom: 8px
fontWeight: 500
```

### Modals
```javascript
// Sizing
Small: 400px max-width
Medium: 600px max-width
Large: 800px max-width

// Styling
padding: 32px
borderRadius: 16px
backdrop: rgba(0, 0, 0, 0.5)
```

## Animation Patterns

### Transitions
```javascript
// Durations
fast: 150ms   // Hover states
base: 200ms   // Default transitions
slow: 300ms   // Complex animations

// Easing
easeIn: cubic-bezier(0.4, 0, 1, 1)
easeOut: cubic-bezier(0, 0, 0.2, 1)
easeInOut: cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations
- **Fade In**: Opacity 0 to 1
- **Slide In**: TranslateY with fade
- **Scale In**: Scale 0.95 to 1 with fade
- **Hover Lift**: TranslateY(-2px) with shadow

## Layout Patterns

### Container Padding
- Mobile: 16px
- Desktop: 24px

### Section Spacing
- Mobile: 32px between sections
- Desktop: 48px between sections

### Grid System
- 12 column grid
- Gutters: 16px (mobile), 24px (desktop)

## Usage in Components

### Accessing Design Tokens
```javascript
import { useTheme } from '../components/ThemeProvider';

const MyComponent = () => {
  const { designSystem } = useTheme();
  
  return (
    <Box sx={{
      padding: designSystem.spacing.md,
      borderRadius: designSystem.borderRadius.base,
      boxShadow: designSystem.shadows.base,
    }}>
      Content
    </Box>
  );
};
```

### Using Theme Colors
```javascript
const { networkTheme, isBackgroundDark } = useTheme();

<Typography
  sx={{
    color: isBackgroundDark ? '#ffffff' : '#000000'
  }}
>
  Adaptive text color
</Typography>
```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Test in both light and dark modes**
3. **Ensure proper color contrast** for accessibility
4. **Use semantic HTML** elements
5. **Follow the component patterns** for consistency
6. **Test responsive behavior** on all screen sizes
7. **Optimize animations** for performance

## Component Checklist

When creating new components:
- [ ] Use design system spacing values
- [ ] Apply consistent border radius
- [ ] Add proper shadows for elevation
- [ ] Include hover/focus states
- [ ] Support dark mode
- [ ] Test color contrast
- [ ] Add smooth transitions
- [ ] Follow typography scale
- [ ] Ensure responsive design
- [ ] Document props and usage

## Future Considerations

- Component library documentation
- Storybook integration
- Visual regression testing
- Design token automation
- Accessibility audit tools