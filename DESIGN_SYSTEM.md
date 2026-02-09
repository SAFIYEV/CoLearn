# 🎨 CoLearn Design System

## Overview

CoLearn now uses a modern 2026 design system, including:
- ✨ **Dark Glassmorphism** - frosted glass effect for dark theme
- ☀️ **Soft Light Theme** - soft light theme with natural colors
- 🎭 **Smooth Theme Switching** - no "jumps" or glitches
- 🌈 **CSS Variables** - easy design customization
- 💫 **Micro-animations** - pleasant animations on interaction

## Themes

### 🌙 Dark Theme
- **Background**: Deep blue tones (#0f0f1a - #2d2d44)
- **Text**: READABLE white color (#f5f5f5)
- **Accents**: Bright gradients (#a78bfa → #818cf8 → #c084fc)
- **Effects**: Glassmorphism with blur(16px) and glow effects

### ☀️ Light Theme
- **Background**: Warm natural tones (#fafaf9 - #e7e5e4)
- **Text**: High-contrast grey-black (#1c1917)
- **Accents**: Harmonious purples (#8b5cf6 → #6366f1)
- **Effects**: Soft shadows and transparency

## CSS Variables

### Background Colors
- `--bg-primary` - main application background
- `--bg-secondary` - secondary background for cards
- `--bg-tertiary` - tertiary background
- `--bg-elevated` - elevated elements

### Text Colors
- `--text-primary` - main text (ALWAYS readable!)
- `--text-secondary` - secondary text
- `--text-tertiary` - tertiary text
- `--text-inverse` - inverse text (for buttons)

### Accent Colors
- `--accent-primary` - primary accent
- `--accent-secondary` - secondary accent
- `--accent-gradient` - gradient for buttons and elements
- `--accent-hover` - color on hover

### Status Colors
- `--success` - success (#10b981 / #34d399)
- `--warning` - warning (#f59e0b / #fbbf24)
- `--error` - error (#ef4444 / #f87171)
- `--info` - info (#3b82f6 / #60a5fa)

### Borders and Shadows
- `--border-light / medium / dark` - borders of varying intensity
- `--shadow-sm / md / lg / xl` - shadows of different sizes
- `--glow-primary / secondary` - glow for dark theme

## CSS Utilities

### Glassmorphism
```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg);
}
```

### Cards
```css
.card {
  background: var(--bg-elevated);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Buttons
```css
.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-gradient);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
}
```

### Animations
```css
.fade-in {
  animation: fadeIn 0.5s ease;
}

.slide-in {
  animation: slideIn 0.5s ease;
}
```

## Theme Switching

The theme is switched in the user profile using a beautiful toggle switch:
- Automatically saved to localStorage
- Smooth transition between themes (0.3s)
- All components automatically adapt

## Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Line-height**: 1.6 for readability
- **Letter-spacing**: -0.02em for headers

## Recommendations

1. **Always use CSS variables** instead of hardcoded colors
2. **Add `card` class** for cards
3. **Use `btn btn-primary/secondary`** for buttons
4. **Add animations** via `.fade-in`, `.slide-in` classes
5. **Check text contrast** - especially in dark theme!

## Usage Examples

### Button
```tsx
<button className="btn btn-primary">
  ✨ Create Course
</button>
```

### Card
```tsx
<div className="card">
  <h3>Header</h3>
  <p>Card content</p>
</div>
```

### Animated Block
```tsx
<div className="fade-in card">
  I appear with animation!
</div>
```

---

**Developed with ❤️ for CoLearn**
*Inspired by 2026 design trends: Dark Glassmorphism, Natural Light Themes, Micro-animations*
