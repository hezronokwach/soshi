# Soshi Style Guide

## Theme: Futuristic Modern

This style guide defines the visual language for Soshi, a modern social network targeting youth to middle-aged users. The design aims to be eye-catching, interactive, and futuristic while maintaining usability and accessibility.

## Color Palette

### Primary Colors

- **Primary**: `#3A86FF` - Vibrant blue, used for primary actions, buttons, and links
- **Secondary**: `#8338EC` - Rich purple, used for secondary elements and accents
- **Tertiary**: `#FF006E` - Vibrant pink, used for highlights and special features

### Neutral Colors

- **Background**: `#0F1624` - Deep blue-black, main background color
- **Surface**: `#1A2333` - Slightly lighter blue-black, for cards and surfaces
- **Border**: `#2A3343` - Medium blue-gray, for borders and dividers

### Text Colors

- **Primary Text**: `#FFFFFF` - White, for primary text on dark backgrounds
- **Secondary Text**: `#B8C1CF` - Light blue-gray, for secondary text
- **Disabled Text**: `#6C7A89` - Medium gray, for disabled or less important text

### Status Colors

- **Success**: `#06D6A0` - Teal green, for success states
- **Warning**: `#FFD166` - Amber yellow, for warning states
- **Error**: `#EF476F` - Coral red, for error states
- **Info**: `#118AB2` - Blue, for informational states

## Typography

### Font Families

- **Primary Font**: `'Inter', sans-serif` - Clean, modern sans-serif for most text
- **Display Font**: `'Outfit', sans-serif` - More distinctive sans-serif for headings
- **Monospace**: `'Fira Code', monospace` - For code snippets or technical content

### Font Sizes

- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)
- **5xl**: `3rem` (48px)

### Font Weights

- **Light**: `300`
- **Regular**: `400`
- **Medium**: `500`
- **Semibold**: `600`
- **Bold**: `700`

## Spacing

- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)

## Border Radius

- **xs**: `0.125rem` (2px)
- **sm**: `0.25rem` (4px)
- **md**: `0.5rem` (8px)
- **lg**: `1rem` (16px)
- **xl**: `1.5rem` (24px)
- **full**: `9999px` (fully rounded)

## Shadows

- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`
- **inner**: `inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)`
- **glow**: `0 0 15px rgba(58, 134, 255, 0.5)` - Special glow effect for hover states

## Special Effects

### Glassmorphism

For card backgrounds and modals:
```css
background: rgba(26, 35, 51, 0.7);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Gradients

- **Primary Gradient**: `linear-gradient(135deg, #3A86FF 0%, #8338EC 100%)`
- **Accent Gradient**: `linear-gradient(135deg, #FF006E 0%, #8338EC 100%)`
- **Dark Gradient**: `linear-gradient(135deg, #0F1624 0%, #1A2333 100%)`

### Animations

- **Transition Speed**:
  - **Fast**: `150ms`
  - **Normal**: `250ms`
  - **Slow**: `350ms`
  - **Very Slow**: `500ms`

- **Transition Easing**:
  - **Default**: `cubic-bezier(0.4, 0, 0.2, 1)`
  - **In**: `cubic-bezier(0.4, 0, 1, 1)`
  - **Out**: `cubic-bezier(0, 0, 0.2, 1)`
  - **In-Out**: `cubic-bezier(0.4, 0, 0.2, 1)`

## UI Components

### Buttons

- **Primary**: Background `#3A86FF`, Text `#FFFFFF`, Hover `#2D6FD9`
- **Secondary**: Background `#8338EC`, Text `#FFFFFF`, Hover `#6C2DC6`
- **Tertiary**: Background `transparent`, Border `#3A86FF`, Text `#3A86FF`, Hover Background `rgba(58, 134, 255, 0.1)`
- **Danger**: Background `#EF476F`, Text `#FFFFFF`, Hover `#D13963`
- **Ghost**: Background `transparent`, Text `#B8C1CF`, Hover Background `rgba(184, 193, 207, 0.1)`

### Cards

- Background: `#1A2333`
- Border: `1px solid #2A3343`
- Border Radius: `lg` (1rem)
- Padding: `lg` (1.5rem)
- Shadow: `lg`
- Hover Effect: Slight scale (1.02) and enhanced shadow

### Inputs

- Background: `#0F1624`
- Border: `1px solid #2A3343`
- Border Radius: `md` (0.5rem)
- Focus: Border `#3A86FF`, Shadow `0 0 0 3px rgba(58, 134, 255, 0.25)`

## Layout

- **Max Content Width**: `1200px`
- **Container Padding**: `1rem` on small screens, `2rem` on larger screens
- **Grid Gap**: `1.5rem`
- **Sidebar Width**: `280px` (desktop)
- **Navbar Height**: `64px`
- **Footer Height**: `auto` (minimum `200px`)

## Responsive Breakpoints

- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`
- **2xl**: `1536px`

## Accessibility

- Ensure color contrast meets WCAG 2.1 AA standards
- Include focus states for all interactive elements
- Support reduced motion preferences
- Provide text alternatives for non-text content
