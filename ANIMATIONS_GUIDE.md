# Animation Guide

This guide documents all the animations implemented across the Mon Cercle App.

## Animation System Overview

### Core Files

1. **`src/hooks/useAnimation.js`** - Custom animation hooks
   - `useFadeIn` - Fade-in animation with configurable delay
   - `useStaggeredAnimation` - Staggered animations for lists
   - Animation timing constants and easing functions

2. **`src/styles/animations.css`** - CSS animation classes
   - Keyframe animations (fadeIn, fadeInUp, scaleIn, etc.)
   - Transition utility classes
   - Hover effects
   - Skeleton loading animations

3. **`src/components/AnimatedComponents.jsx`** - Reusable animated components
   - `AnimatedBox` - Box with fade-in effect
   - `AnimatedCard` - Card with hover lift effect
   - `AnimatedPaper` - Paper with scale-in effect
   - `AnimatedButton` - Button with enhanced hover
   - `StaggeredListItem` - List items with stagger animation
   - `PageTransition` - Page-level transitions

6. **`src/components/TextCycler.jsx`** - Text cycling animations
   - Cycles through array of text strings
   - Smooth fade transitions between texts
   - Configurable timing and effects

7. **`src/components/ThreeJSBackground.jsx`** - 3D animated background
   - WebGL particle system using Three.js
   - Interactive mouse movement effects
   - Performance-optimized rendering
   - Dynamic color transitions

8. **`src/components/LoadingSkeleton.jsx`** - Loading skeleton components
   - `CardSkeleton` - Card loading state
   - `ListItemSkeleton` - List item loading state
   - `NewsItemSkeleton` - News item loading state
   - `ProfileSkeleton` - Profile loading state
   - And more...

9. **`src/hooks/useScrollAnimation.js`** - Scroll-triggered animations
   - `useScrollAnimation` - Intersection Observer based animations
   - `useParallax` - Parallax scroll effects

10. **`src/utils/animationHelpers.js`** - Animation utilities
    - `preventResizeAnimations` - Prevents janky animations during resize
    - `smoothScrollTo` - Smooth scroll to element
    - `observeEntranceAnimations` - Add animations when elements enter viewport

## Animation Implementations

### 1. Page Transitions
- All major pages wrapped with `<PageTransition>` component
- Smooth fade-in effect when navigating between pages
- Duration: 300ms with ease-out timing

### 2. List Animations
- Events list: Staggered fade-in with 50ms delay between items
- News feed: Cards animate in with fade-up effect
- Members list: Virtualized list with smooth scroll

### 3. Modal Animations
- Dialogs use `Zoom` transition component
- Duration: 300ms
- Smooth scale and fade effect

### 4. Hover Effects
- Cards: Lift effect on hover (translateY: -4px)
- Buttons: Scale and shadow enhancement
- List items: Background color transitions

### 5. Loading States
- Skeleton loaders with shimmer effect
- Smooth transitions from loading to loaded state
- Consistent timing across all loading states

### 6. Chat Animations
- Messages fade in from bottom
- Smooth scroll when new messages arrive
- Typing indicators with pulse animation

### 7. Form Interactions
- Input fields: Focus transitions with border color
- Submit buttons: Loading state animations
- Error/success messages: Fade in/out

### 8. Shimmer Effects
- Dynamic shimmer based on scroll position
- Time-based shimmer animations
- Used in landing pages and text highlights
- Synchronized across multiple components

### 9. Text Cycling
- Smooth text transitions in headers
- Fade effect between text changes
- Used for dynamic content display

### 10. 3D Background
- Particle system with WebGL
- Mouse-responsive animations
- Continuous motion effects
- Performance optimized with Three.js

### 11. Media Viewers
- Image viewer with zoom animations
- Smooth transitions between images
- PDF page turn animations
- Modal open/close effects

## Usage Examples

### Using Fade-In Hook
```jsx
import { useFadeIn } from '../hooks/useAnimation';

function MyComponent() {
  const fadeRef = useFadeIn(200); // 200ms delay
  
  return <div ref={fadeRef}>Content</div>;
}
```

### Using Animated Components
```jsx
import { AnimatedCard, StaggeredListItem } from '../components/AnimatedComponents';

// Card with hover effect
<AnimatedCard>
  Card content
</AnimatedCard>

// List with stagger
{items.map((item, index) => (
  <StaggeredListItem key={item.id} index={index}>
    {item.content}
  </StaggeredListItem>
))}
```

### Using CSS Classes
```jsx
// Fade in animation
<div className="animate-fade-in">Content</div>

// Hover lift effect
<div className="hover-lift">Hoverable content</div>

// Stagger with delay
<div className="animate-fade-in-up stagger-3">Third item</div>
```

### Using Shimmer Effects
```jsx
import { ShimmerProvider } from '../components/ShimmerProvider';
import ShimmeryText from '../components/ShimmeryText';

// Wrap your app or component
<ShimmerProvider>
  <ShimmeryText 
    text="Shimmering Text"
    baseColor="#333"
    shimmerColor="#fff"
  />
</ShimmerProvider>
```

### Using Text Cycler
```jsx
import TextCycler from '../components/TextCycler';

const texts = ["Welcome", "Bienvenue", "Willkommen"];

<TextCycler 
  texts={texts}
  interval={3000}
  className="hero-text"
/>
```

### Using 3D Background
```jsx
import ThreeJSBackground from '../components/ThreeJSBackground';

// Add as background layer
<div style={{ position: 'relative' }}>
  <ThreeJSBackground />
  <div style={{ position: 'relative', zIndex: 1 }}>
    Your content here
  </div>
</div>
```

## Animation Timing Guidelines

- **Fast animations**: 200ms (hover effects, small transitions)
- **Normal animations**: 300ms (most UI transitions)
- **Slow animations**: 400ms (page transitions, modals)
- **Very slow animations**: 600ms (complex transitions)

## Performance Considerations

1. **CSS vs JS Animations**
   - Prefer CSS transitions for simple animations
   - Use `transform` and `opacity` for best performance
   - Avoid animating layout properties

2. **Reducing Motion**
   - Consider `prefers-reduced-motion` media query
   - Provide options to disable animations

3. **Optimization**
   - Use `will-change` sparingly
   - Batch animations when possible
   - Throttle scroll-based animations

## Browser Support

All animations use standard CSS3 and modern JavaScript features:
- CSS Transitions: All modern browsers
- CSS Animations: All modern browsers
- Intersection Observer: Chrome 51+, Firefox 55+, Safari 12.1+

## Component-Specific Animations

### ImageViewerModal
- Zoom in/out transitions
- Pan animations for large images
- Smooth gallery navigation
- Fade effects for modal backdrop

### PDFReader
- Page transition effects
- Smooth zoom animations
- Loading states for page rendering

### ShimmerProvider
- Centralized shimmer timing
- Scroll-position tracking
- Performance optimized with RAF

## Future Enhancements

1. Add `prefers-reduced-motion` support
2. Create animation toggle in user settings
3. Add more complex page transitions
4. Implement gesture-based animations
5. Add loading progress indicators
6. Enhance 3D background with more effects
7. Add spring-based animations
8. Implement drag-and-drop animations