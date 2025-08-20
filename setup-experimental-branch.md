# Experimental Branch Setup

## Quick Start Commands

```bash
# Create and switch to experimental branch
git checkout -b experimental-modifications

# Add your changes
git add .
git commit -m "Initial experimental modifications: custom text and colors"

# Verify you're on the new branch
git branch
```

## Text Customization Guide

### 1. Main POAP Description
**File**: `src/components/POAPMinter.tsx`
**Line**: ~665
```tsx
{dropConfig.mintMessage || "Claim your exclusive digital collectible and join our community celebration."}
```

### 2. Celebration Message
**File**: `src/components/POAPMinter.tsx`
**Line**: ~832
```tsx
Join our growing community and celebrate this special moment together.
```

### 3. Button Text
**File**: `src/components/POAPMinter.tsx`
**Lines**: ~800-820
- "Connect Wallet"
- "Mint POAP" 
- "Minting..."

## Color Customization Guide

### 1. CSS Variables (Easy Method)
**File**: `src/app/globals.css`
```css
:root {
  --background: #000000;         /* Main background */
  --foreground: #ffffff;         /* Main text color */
  --primary-purple: #8b5cf6;     /* Primary accent */
  --custom-accent: #0ea5e9;      /* Secondary accent */
  --brand-color: #7c3aed;        /* Your brand color */
}
```

### 2. Component Colors (Advanced)
**File**: `src/components/POAPMinter.tsx`
**CSS Variables**:
- `--drop-button-color`: Button background
- `--drop-background-color`: Page background
- `--button-hover-color`: Button hover state

### 3. Quick Color Changes
Replace these hex codes in POAPMinter.tsx:
- `#8b5cf6` → Your primary color
- `#0ea5e9` → Your secondary color  
- `#000000` → Your background color
- `#ffffff` → Your text color

## Testing Your Changes

```bash
# Run development server
npm run dev

# Open in browser
"$BROWSER" http://localhost:3000
```

## Common Customizations

### Change Button Color
```css
.mint-button {
  background: #YOUR_COLOR_HERE;
}
```

### Change Background
```css
.poap-minter-container {
  background: #YOUR_BACKGROUND_COLOR;
}
```

### Change Text Color
```css
.get-your-poap,
.mint-title {
  color: #YOUR_TEXT_COLOR;
}
```

## Ready to Deploy?

When satisfied with your changes:
```bash
git add .
git commit -m "Final experimental customizations"
git push origin experimental-modifications
```