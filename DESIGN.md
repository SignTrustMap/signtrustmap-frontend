---
version: alpha
name: SignTrustMap
description: Clean, modernz
colors:
  secondary: "#d3f7ff"
  tertiary: "#007b8b"
  neutral: "#F8F7F7"
  surface: "#FFFFFF"
  on-tertiary: "#FFFFFF"
  border: "#E8E4E3"
  primary: "#000000"
typography:
  App Title:
    fontFamily: Arvo
    fontSize: 3rem
    fontWeight: 700
  body-md:
    fontFamily: Google Sans
    fontSize: 1rem
    fontWeight: 400
  label-caps:
    fontFamily: Google Sans
    fontSize: 0.75rem
    fontWeight: 600
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
    fontWeight: 700
rounded:
  sm: 4px
  md: 8px
  lg: 12px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 20px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# SignTrustMap

## Overview

Architectural minimalism meets journalistic gravitas. The UI evokes a premium matte finish — a high-end broadsheet or contemporary gallery.

## Colors

The palette is rooted in semantic tokens. Use the role (e.g. `{colors.primary}`) — never the hex literal — when authoring components.

- **secondary (#d3f7ff)**
- **tertiary (#007b8b)**
- **neutral (#F8F7F7)**
- **surface (#FFFFFF)**
- **on-tertiary (#FFFFFF)**
- **border (#E8E4E3)**
- **primary (#000000)**

## Typography

| Token | Font | Size | Weight |
| --- | --- | --- | --- |
| `App Title` | Arvo | 3rem | 700 |
| `body-md` | Google Sans | 1rem | 400 |
| `label-caps` | Google Sans | 0.75rem | 600 |
| `h1` | Public Sans | 3rem | 700 |

## Layout

Spacing scale (use the named scale; avoid arbitrary values):

- `spacing.sm` — 8px
- `spacing.md` — 16px
- `spacing.lg` — 24px

## Elevation & Depth

Depth is conveyed through tonal layering and subtle borders rather than drop shadows. Cards lift from the warm neutral background through pure-white surfaces and a single hairline border.

## Shapes

Corner radius scale:

- `rounded.sm` — 4px
- `rounded.md` — 8px
- `rounded.lg` — 12px

## Components

### button-primary
- backgroundColor: `{colors.tertiary}`
- textColor: `{colors.on-tertiary}`
- rounded: `{rounded.sm}`
- padding: `12px 20px`

### button-secondary
- backgroundColor: `transparent`
- textColor: `{colors.tertiary}`
- rounded: `{rounded.sm}`
- padding: `12px 20px`

### card
- backgroundColor: `{colors.surface}`
- textColor: `{colors.primary}`
- rounded: `{rounded.md}`
- padding: `20px`

### input
- backgroundColor: `{colors.surface}`
- textColor: `{colors.primary}`
- rounded: `{rounded.sm}`
- padding: `10px 14px`

## Do's and Don'ts

- Do use the tertiary color sparingly — only for the highest-emphasis action.
- Don't combine more than two type families on a single screen.
- Don't use full-width images without a generous bottom margin.
- Do default to the warm neutral background; reserve pure white for cards.
