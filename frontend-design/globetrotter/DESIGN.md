---
name: GlobeTrotter
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#712ae2'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a4cfc'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 24px
  gutter: 16px
  section-gap: 48px
  component-padding-x: 16px
  component-padding-y: 8px
---

## Brand & Style

This design system is built for a professional travel-planning SaaS that balances the excitement of exploration with the precision of logistics. The visual identity follows a **Corporate / Modern** aesthetic, prioritizing clarity, reliability, and functional elegance.

The personality is "The Expert Concierge": knowledgeable, calm, and highly organized. It avoids the cluttered "travel agency" look in favor of a workspace-first mentality. The interface utilizes generous whitespace and a strict mathematical grid to reduce cognitive load during complex itinerary planning. High-quality typography and a restrained color palette ensure the user's travel photos and content remain the focal point.

## Colors

The palette is anchored by a sophisticated **Travel Blue** (#0284C7), evoking clear skies and professional reliability. To drive action and highlight critical path items, a **Warm Amber** (#F59E0B) is used sparingly as a secondary accent.

- **Primary Blue:** Used for main actions, navigation states, and brand presence.
- **Warm Amber:** Reserved for high-priority Call-to-Actions (CTAs) and "Book Now" triggers.
- **Professional Neutrals:** A range of Slate grays provides a structured, "SaaS-native" environment that feels cleaner than traditional admin templates.
- **Semantic Statuses:** Directives for itinerary states (Planning/Active/Completed) and collaboration roles (Owner/Editor/Viewer) are strictly defined to ensure consistency across the platform.

## Typography

This design system utilizes **Inter** exclusively to achieve a utilitarian yet modern feel. The type scale is designed for high information density without sacrificing legibility.

- **Display & Headlines:** Use tighter letter spacing and heavier weights to create a strong hierarchy.
- **Body Text:** Set with generous line height (1.6) to ensure that long descriptions of destinations and itineraries remain readable.
- **Labels:** Small labels use a slight letter-spacing increase and uppercase styling for "Meta" information (like dates or status), while interactive labels remain sentence-case for friendliness.
- **Responsive Adjustments:** For mobile views, `display-lg` should scale down to `headline-lg` metrics to prevent excessive wrapping.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with fixed maximum widths for content readability. A standard 12-column grid is used for desktop, collapsing to 4 columns for mobile.

- **The 4px Rule:** All spacing and sizing must be multiples of 4px to maintain a rhythmic visual harmony.
- **Whitespace:** Emphasize generous vertical spacing between major sections (48px+) to differentiate between days in an itinerary or different segments of a trip.
- **In-Page Navigation:** Tab bars and secondary navigation should always align to the left container margin to anchor the user's eye as they navigate through "Overview," "Map," and "Budget" views.

## Elevation & Depth

The system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows to signify depth, inspired by high-end SaaS tools.

1.  **Level 0 (Canvas):** The base background (#F8FAFC).
2.  **Level 1 (Cards/Surfaces):** Pure white (#FFFFFF) with a 1px border (#E2E8F0).
3.  **Level 2 (Popovers/Modals):** Pure white with a subtle, diffused shadow (0 4px 6px -1px rgb(0 0 0 / 0.1)) and a 1px border.
4.  **Interactive Depth:** On hover, cards may lift slightly using a subtle transition, but shadows remain "natural" and low-opacity (not exceeding 10%).

## Shapes

The shape language is **Soft**, utilizing a standard 4px (0.25rem) radius for most UI elements. This provides a professional, "sharper" look that feels more like a tool and less like a toy.

- **Standard Elements:** Buttons, input fields, and checkboxes use `rounded` (4px).
- **Large Containers:** Cards and itinerary blocks use `rounded-lg` (8px).
- **Specialty Shapes:** Status badges use `rounded-full` (pill shape) to distinguish them from interactive buttons.

## Components

### Buttons & Inputs
- **Primary Button:** Solid Travel Blue with white text. Hover state is a slightly darker shade (#0369A1).
- **Secondary Button:** White background with 1px Slate-200 border.
- **Action Button (CTA):** Solid Amber with black or dark-brown text for maximum contrast.
- **Focus States:** 2px ring offset by 2px, using the Primary Blue color.

### Badges (Status & Role)
- **Status Badges:** Use a "subtle" style—a light tinted background with high-contrast text (e.g., Active uses a 10% Blue background with 100% Blue text).
- **Role Badges:** Located near avatars, using the assigned Role colors.

### Itinerary Cards
- Clean borders, no shadow.
- Header uses `headline-md` with a subtle 1px bottom border.
- Elements within the card (e.g., "Flight," "Hotel") are separated by `body-sm` gray text and clear icons.

### Navigation
- **Tabs:** Use a bottom-border indicator (2px) in Travel Blue for the active state. Hover state shows a subtle gray background shift.
- **Sidebar:** Minimalist with icon + label. Active state uses a light blue ghost background and bolded text.