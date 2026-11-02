---
name: web-skills
description: Comprehensive web development curriculum, standard best practices, and knowledge base covering Fundamentals (HTML/CSS/JS), Accessibility (a11y), Web Components, Progressive Web Apps (PWA), Build Tools, Frameworks, Testing, Architecture, Design/UX, Modern Web APIs, Algorithms, and Server/Database integration derived from andreasbm/web-skills.
---

# Web Skills Standard & Architecture Guide

A comprehensive, curated knowledge base and architectural reference for modern web development, based on the `andreasbm/web-skills` curriculum. Use this skill when designing, building, reviewing, optimizing, or auditing web applications across the entire web technology stack.

## Core Pillars & Knowledge Domains

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MODERN WEB ECOSYSTEM                          │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│   Fundamentals   │  Architecture    │ Quality & Perf  │   Modern Web   │
│ ──────────────── │ ──────────────── │ ─────────────── │ ────────────── │
│ • HTML5 Semantic │ • Component Tree │ • WCAG 2.2 AA   │ • PWA & Workers│
│ • CSS Modern     │ • State Modeling │ • Core Web Vitals│ • WebAssembly │
│ • ECMAScript ES+ │ • Client/Server  │ • Unit/E2E Test │ • WebRTC/WS    │
│ • DOM & BOM      │ • Build Pipelines│ • Security/CSP  │ • Edge Runtime │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

---

## 1. Fundamentals

### HTML5 & Document Structure
- **Semantic Hierarchy**: Never replace standard elements (`<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`) with generic `<div>` soup.
- **Form Controls**: Use `<label for="...">`, `<fieldset>`, `<legend>`, `<input type="...">` with appropriate `autocomplete`, `inputmode`, and validation attributes (`required`, `pattern`).
- **Metadata & SEO**: Always provide descriptive `<title>`, `<meta name="description">`, Open Graph (`og:*`), Twitter Cards, and canonical tags.

### Modern CSS Architecture
- **CSS Custom Properties (Design Tokens)**: Define design tokens at `:root` for typography, spacing, radius, colors (HSL/OKLCH preferred), and shadows.
- **Layout Engines**:
  - Use **CSS Grid** for two-dimensional page layouts, bento grids, and layout shells.
  - Use **Flexbox** for one-dimensional flows, navigation bars, button groups, and alignment.
- **Responsive & Modern Features**:
  - Fluid sizing with `clamp()`, `min()`, `max()`.
  - Media queries with modern range syntax (`@media (width >= 768px)`).
  - Container Queries (`@container`) for component-level responsiveness.
  - Modern pseudo-classes: `:has()`, `:is()`, `:where()`, `:focus-visible`.
- **CSS Resets & Defensive CSS**: Ensure `box-sizing: border-box`, `max-width: 100%` on media, and sensible typography baseline.

### Modern JavaScript (ESNext)
- **Modern Syntax**: Destructuring, optional chaining (`?.`), nullish coalescing (`??`), logical assignment (`||=`, `&&=`, `??=`), top-level `await`.
- **Async Programming**: `async`/`await`, `Promise.allSettled`, abort controllers (`AbortController`) for cancellation.
- **Data Structures & Algorithms**: Use `Map`, `Set`, `WeakMap`, typed arrays, and immutable transforms where appropriate.
- **Browser APIs**: `IntersectionObserver`, `ResizeObserver`, `MutationObserver`, `BroadcastChannel`, `PerformanceObserver`.

---

## 2. Accessibility (a11y) & WCAG 2.2 Standards

- **Perceivable**:
  - Color contrast ratio >= 4.5:1 for normal text and >= 3:1 for large text / UI components.
  - Informative `alt` text on images; empty `alt=""` for purely decorative images.
  - Audio/video captions and transcripts.
- **Operable**:
  - Full keyboard navigability: Every interactive element must be reachable and operable via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrow keys`).
  - Visible focus indicators: Never set `outline: none` without providing an enhanced `:focus-visible` style.
  - Skip links: Provide "Skip to main content" links for keyboard and screen-reader users.
- **Understandable**:
  - Form validation with associated `aria-describedby` pointing to descriptive error messages.
  - Consistent navigation order and meaningful button labels (avoid bare icon buttons without `aria-label`).
- **Robust**:
  - Valid ARIA roles, states, and properties (`aria-expanded`, `aria-controls`, `aria-hidden`, `aria-live`).
  - Test with assistive technologies: Screen readers (NVDA, VoiceOver) and automated checkers (Axe, Lighthouse).

---

## 3. Web Components & Modern Architecture

- **Custom Elements v1**: Self-contained custom DOM elements via `customElements.define()`.
- **Shadow DOM**: Encapsulated styling and scoped DOM nodes (`attachShadow({ mode: 'open' })`).
- **HTML Templates**: `<template>` and `<slot>` elements for declarative, reusable component composition.
- **Framework Interoperability**: Write components that seamlessly bridge standard DOM events and attributes with modern frameworks (React, Vue, Svelte).

---

## 4. Progressive Web Apps (PWA) & Offline Capabilities

- **Web App Manifest**: Complete `manifest.json` with app name, icons (including maskable), `start_url`, `display: standalone`, `theme_color`, and `background_color`.
- **Service Workers**:
  - Cache strategies: Cache-First for static assets, Network-First for dynamic content, Stale-While-Revalidate for frequently updated assets.
  - Background Sync and Push Notifications for engagement.
- **Storage**: IndexedDB for structured offline client-side data; `localStorage` only for simple, non-sensitive preferences.

---

## 5. Performance & Core Web Vitals (CWV)

- **Largest Contentful Paint (LCP) < 2.5s**:
  - Preload critical hero fonts and imagery (`rel="preload"`).
  - Modern image formats (`AVIF`, `WebP`) with responsive `srcset` and `sizes`.
  - Inline critical CSS; defer non-critical JS.
- **Interaction to Next Paint (INP) < 200ms**:
  - Avoid long tasks on the main thread (> 50ms).
  - Break up long-running tasks using `scheduler.yield()` or `requestIdleCallback()`.
  - Offload heavy computing to Web Workers.
- **Cumulative Layout Shift (CLS) < 0.1**:
  - Always reserve dimensions (`width`, `height`, or `aspect-ratio`) for images, videos, iframes, and dynamic banners.
  - Avoid inserting content above existing content without user interaction.
  - Use `font-display: swap` with matched fallback font metrics (`size-adjust`).

---

## 6. Security & Privacy

- **Content Security Policy (CSP)**: Strict CSP preventing inline scripts, unauthorized origins, and eval.
- **XSS Prevention**: Context-aware HTML sanitization (`DOMPurify`), avoiding `innerHTML` and `eval()`.
- **CSRF & CORS**: SameSite cookies (`SameSite=Strict` or `Lax`), secure tokens, and strict CORS headers.
- **Transport Security**: HTTPS everywhere, HSTS headers, secure WebSocket (`wss://`).

---

## 7. Deep-Dive Curriculum & Blueprint

For the complete topic map, book recommendations, MDN documentation references, and step-by-step learning tracks:
- Inspect [blueprint.md](file:///references/blueprint.md)
- Inspect [README.md](file:///references/README.md)
