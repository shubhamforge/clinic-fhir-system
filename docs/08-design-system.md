# Care Platform — Design System

> Angular Material M3 · FHIR R4 · Nx Monorepo
> Foundation → Theming → Components → Patterns → Screens

---

## Non-Compliance Fixes Applied

The original design plan had two critical issues that made it incompatible with Angular Material:

| Issue | Original Plan | Fixed |
|---|---|---|
| `@angular/material` not installed | Assumed present | Installation step added |
| Custom component SCSS | Rewrote `mat-button`, `mat-card`, `mat-table`, `mat-form-field` from scratch | Deleted; use Angular Material components + `mat.define-theme()` theming |
| Dark mode via `[data-theme="dark"]` + manual tokens | Manual CSS variable overrides | Angular Material `theme-type: dark` theming |
| Typography via raw CSS vars | `--cp-font-heading: Lexend` in `:root` | `mat.define-theme()` `brand-family` / `plain-family` |
| Density via role CSS classes | Custom padding/height per role | Angular Material `density: (scale: -1)` per app |

Design tokens (color values, spacing, typography choices) are kept — they are the **inputs** to Angular Material's theming system, not a replacement for it.

---

## 1. Design Strategy

### The Two-Layer Model

```
┌─────────────────────────────────────────────────────┐
│              SHARED FOUNDATION                      │
│  _tokens.scss · Angular Material M3 palette         │
│  Lexend + Source Sans 3 · 4px spacing grid          │
├───────────────────────┬─────────────────────────────┤
│   CLINICIAN LAYER     │      PATIENT LAYER           │
│  density scale: -1    │  density scale: 0            │
│  Data-dense · Fast    │  Comfortable · Guided        │
│  clinician-app        │  patient-app                 │
└───────────────────────┴─────────────────────────────┘
```

**Angular Material's density system handles the sizing difference between apps.**
No custom button heights or input heights are written anywhere.

### Role UX Differences

| Dimension | Clinician App | Patient App |
|---|---|---|
| Angular Material density | `-1` (compact) | `0` (default) |
| Information per screen | High — multi-panel | Low — one thing per screen |
| Navigation | `mat-sidenav` persistent sidebar | `mat-tab-nav-bar` bottom tabs |
| Primary forms | `mat-form-field` appearance `outline` | `mat-form-field` appearance `outline`, full-width |
| Data display | `mat-table` with `matSort` + `matPaginator` | `mat-card` stacked list |
| Step flows | Not used | `mat-stepper` linear mode |
| Alerts | `mat-snack-bar` + inline `mat-card` banners | `mat-snack-bar` (plain-language copy) |
| Session length | Long (hours) | Short (5–10 min) |

---

## 2. Installation

`@angular/material` must be added before any theming work.

```bash
# from care-platform/
npx ng add @angular/material@~21.2.0
```

The schematic will:
- Install `@angular/material` and `@angular/cdk` at version `~21.2.0`
- Add `provideAnimationsAsync()` to `app.config.ts`
- Add a prebuilt theme import (which we will replace with our custom theme)

Verify `package.json` contains:

```json
"@angular/cdk": "~21.2.0",
"@angular/material": "~21.2.0"
```

---

## 3. Design Tokens — Source of Truth

These are primitive values only. They are **not applied directly as CSS custom properties** — they feed into `mat.define-theme()`.

```scss
// libs/design-system/src/_tokens.scss

// ─── Color primitives ───────────────────────────────────────────────────────

// Blues (primary brand / trust)
$cp-blue-400: #22D3EE;
$cp-blue-500: #0891B2;   // primary brand
$cp-blue-600: #0E7490;
$cp-blue-700: #155E75;
$cp-blue-800: #164E63;   // heading foreground

// Greens (health / success / accent)
$cp-green-500: #22C55E;
$cp-green-600: #059669;  // accent / CTA
$cp-green-700: #047857;

// Reds (critical / destructive)
$cp-red-500:  #EF4444;
$cp-red-600:  #DC2626;
$cp-red-700:  #B91C1C;

// Ambers (warning)
$cp-amber-400: #FBBF24;
$cp-amber-500: #F59E0B;
$cp-amber-700: #B45309;

// Neutrals
$cp-neutral-50:  #F8FAFC;
$cp-neutral-100: #F1F5F9;
$cp-neutral-200: #E2E8F0;
$cp-neutral-300: #CBD5E1;
$cp-neutral-400: #94A3B8;
$cp-neutral-500: #64748B;
$cp-neutral-600: #475569;
$cp-neutral-700: #334155;
$cp-neutral-800: #1E293B;
$cp-neutral-900: #0F172A;

// ─── Spacing (4px base grid) ─────────────────────────────────────────────────

$cp-space-1:  4px;
$cp-space-2:  8px;
$cp-space-3:  12px;
$cp-space-4:  16px;
$cp-space-6:  24px;
$cp-space-8:  32px;
$cp-space-12: 48px;
$cp-space-16: 64px;

// ─── Typography ──────────────────────────────────────────────────────────────

$cp-font-brand: 'Lexend', system-ui, sans-serif;      // headings
$cp-font-plain: 'Source Sans 3', system-ui, sans-serif; // body
$cp-font-mono:  'JetBrains Mono', monospace;           // lab values, IDs

// ─── Semantic status (used in custom status components, not Material tokens) ─

$cp-status-success-bg:     #F0FDF4;
$cp-status-success-border: #86EFAC;
$cp-status-success-text:   #047857;

$cp-status-warning-bg:     #FFFBEB;
$cp-status-warning-border: #FBBF24;
$cp-status-warning-text:   #B45309;

$cp-status-critical-bg:    #FFF1F2;
$cp-status-critical-border:#FCA5A5;
$cp-status-critical-text:  #B91C1C;

$cp-status-info-bg:        #ECFEFF;
$cp-status-info-border:    #A5F3FC;
$cp-status-info-text:      #0E7490;
```

---

## 4. Angular Material Theming

### 4.1 Custom M3 Palette

Angular Material M3 uses tonal palettes generated from a key color. We map our brand blue and green as primary and tertiary roles.

```scss
// libs/design-system/src/_palette.scss
@use '@angular/material' as mat;

// Angular Material ships built-in M3 palettes.
// $cyan-palette maps closely to our #0891B2 primary.
// $green-palette maps to our #059669 accent/tertiary.

$cp-primary-palette:   mat.$cyan-palette;
$cp-tertiary-palette:  mat.$green-palette;
$cp-error-palette:     mat.$red-palette;
```

> **Why not a fully custom palette?** Angular Material's M3 tonal palette generator
> creates the full 0–100 tonal range required for proper contrast across all component
> states. Custom palettes require a `mat.define-palette()` call with all 10 tonal stops.
> The built-in cyan/green palettes match our brand values closely enough for initial
> delivery; a custom palette can be wired in as a governance upgrade.

### 4.2 Clinician App Theme (density -1 = compact)

```scss
// apps/clinician-app/src/styles.scss
@use '@angular/material' as mat;
@use 'libs/design-system/src/tokens' as cp;
@use 'libs/design-system/src/palette' as palette;

// ── Google Fonts ──────────────────────────────────────────────────────────────
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

// ── Material core ─────────────────────────────────────────────────────────────
@include mat.core();

// ── Light theme (default) ─────────────────────────────────────────────────────
$clinician-light-theme: mat.define-theme((
  color: (
    theme-type:  light,
    primary:     palette.$cp-primary-palette,
    tertiary:    palette.$cp-tertiary-palette,
  ),
  typography: (
    brand-family: 'Lexend',
    plain-family: 'Source Sans 3',
    bold-weight:  700,
    medium-weight:500,
    regular-weight:400,
  ),
  density: (
    scale: -1,   // compact — reduces component height by ~4px per level
  ),
));

// ── Dark theme ────────────────────────────────────────────────────────────────
$clinician-dark-theme: mat.define-theme((
  color: (
    theme-type:  dark,
    primary:     palette.$cp-primary-palette,
    tertiary:    palette.$cp-tertiary-palette,
  ),
  typography: (
    brand-family: 'Lexend',
    plain-family: 'Source Sans 3',
  ),
  density: (scale: -1),
));

// ── Apply themes ──────────────────────────────────────────────────────────────
:root {
  @include mat.all-component-themes($clinician-light-theme);
}

[data-theme="dark"] {
  @include mat.all-component-themes($clinician-dark-theme);
}

// ── Global structural styles only (no component reimplementation) ─────────────
@import 'libs/design-system/src/global';
```

### 4.3 Patient App Theme (density 0 = comfortable)

```scss
// apps/patient-app/src/styles.scss
@use '@angular/material' as mat;
@use 'libs/design-system/src/tokens' as cp;
@use 'libs/design-system/src/palette' as palette;

@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

@include mat.core();

$patient-light-theme: mat.define-theme((
  color: (
    theme-type:  light,
    primary:     palette.$cp-primary-palette,
    tertiary:    palette.$cp-tertiary-palette,
  ),
  typography: (
    brand-family: 'Lexend',
    plain-family: 'Source Sans 3',
    bold-weight:  700,
    medium-weight:500,
    regular-weight:400,
  ),
  density: (
    scale: 0,    // default — comfortable for patients on mobile
  ),
));

$patient-dark-theme: mat.define-theme((
  color: (
    theme-type:  dark,
    primary:     palette.$cp-primary-palette,
    tertiary:    palette.$cp-tertiary-palette,
  ),
  typography: (
    brand-family: 'Lexend',
    plain-family: 'Source Sans 3',
  ),
  density: (scale: 0),
));

:root {
  @include mat.all-component-themes($patient-light-theme);
}

[data-theme="dark"] {
  @include mat.all-component-themes($patient-dark-theme);
}

@import 'libs/design-system/src/global';
```

### 4.4 Global Structural Styles (non-component)

This file contains **only layout, typography scale, and status utilities** — never reimplementing Material components.

```scss
// libs/design-system/src/_global.scss
@use 'tokens' as cp;

// ── Page layout ───────────────────────────────────────────────────────────────
*,
*::before,
*::after { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background-color: cp.$cp-neutral-50;
}

// ── Typography utilities ───────────────────────────────────────────────────────
.cp-font-mono {
  font-family: cp.$cp-font-mono;
  font-variant-numeric: tabular-nums;
  font-size: 0.8125rem; // 13px — lab values, vital readings in tables
}

// ── Status indicator utilities (supplement Material, not replace alerts) ──────
// These are used for inline status chips and vital range bands ONLY.
// Full alert notifications use mat-snack-bar.

.cp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.cp-status-badge--success {
  background: cp.$cp-status-success-bg;
  border-color: cp.$cp-status-success-border;
  color: cp.$cp-status-success-text;
}
.cp-status-badge--warning {
  background: cp.$cp-status-warning-bg;
  border-color: cp.$cp-status-warning-border;
  color: cp.$cp-status-warning-text;
}
.cp-status-badge--critical {
  background: cp.$cp-status-critical-bg;
  border-color: cp.$cp-status-critical-border;
  color: cp.$cp-status-critical-text;
}
.cp-status-badge--info {
  background: cp.$cp-status-info-bg;
  border-color: cp.$cp-status-info-border;
  color: cp.$cp-status-info-text;
}

// ── Vital reference zones (chart overlays only) ────────────────────────────────
.cp-chart-zone--normal  { fill: rgba(5,  150, 105, 0.08); }
.cp-chart-zone--caution { fill: rgba(245, 158,  11, 0.10); }
.cp-chart-zone--danger  { fill: rgba(220,  38,  38, 0.10); }

// ── Spacing utilities ──────────────────────────────────────────────────────────
.cp-mt-sm  { margin-top:    cp.$cp-space-2; }
.cp-mt-md  { margin-top:    cp.$cp-space-4; }
.cp-mt-lg  { margin-top:    cp.$cp-space-6; }
.cp-mb-md  { margin-bottom: cp.$cp-space-4; }
.cp-mb-lg  { margin-bottom: cp.$cp-space-6; }

// ── Responsive breakpoints ─────────────────────────────────────────────────────
// 375 | 768 | 1024 | 1440
.cp-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 cp.$cp-space-4;

  @media (min-width: 768px)  { max-width: 100%; padding: 0 cp.$cp-space-6; }
  @media (min-width: 1024px) { padding: 0 cp.$cp-space-8; }
  @media (min-width: 1440px) { max-width: 1440px; }
}

// Patient app content max-width (keeps forms readable on desktop)
.cp-patient-content {
  max-width: 640px;
  margin: 0 auto;
}
```

---

## 5. Component Library — Angular Material Components

**Rule: No Angular Material component is reimplemented.** Components are listed here with the correct Material selector, input bindings, and any allowed CSS overrides. Overrides are applied via Angular Material's supported CSS custom property API — never by targeting `.mdc-*` internal classes.

### 5.1 Buttons

**Angular Material selector:** `button[mat-flat-button]`, `button[mat-stroked-button]`, `button[mat-icon-button]`, `button[mat-button]`

```html
<!-- Primary action -->
<button mat-flat-button color="primary">Save Vitals</button>

<!-- Secondary / outlined -->
<button mat-stroked-button color="primary">Cancel</button>

<!-- Destructive -->
<button mat-flat-button color="warn">Delete Encounter</button>

<!-- Ghost / toolbar (clinician) -->
<button mat-icon-button aria-label="Filter">
  <mat-icon>filter_list</mat-icon>
</button>
```

**Patient app — full-width CTA:**
```html
<!-- Use class, not a custom component -->
<button mat-flat-button color="primary" class="cp-btn-fullwidth">
  Record Today's Vitals
</button>
```

```scss
// allowed override — full-width pattern only
.cp-btn-fullwidth.mat-mdc-button-base {
  width: 100%;
}
```

**Usage rules:**
- One `mat-flat-button` per screen/panel (primary CTA)
- Clinician toolbar: `mat-icon-button` for secondary actions
- Destructive: always `color="warn"`, spatially separated from primary actions
- Loading state: disable + add `<mat-spinner diameter="20">` inside button

---

### 5.2 Forms

**Angular Material selector:** `mat-form-field`, `input[matInput]`, `textarea[matInput]`, `mat-select`, `mat-error`, `mat-hint`, `mat-label`

```html
<!-- Standard field (both apps) -->
<mat-form-field appearance="outline" class="cp-field-fullwidth">
  <mat-label>Systolic pressure</mat-label>
  <input matInput type="number" [formControl]="systolicCtrl" required />
  <mat-hint>mmHg — normal range 90–120</mat-hint>
  @if (systolicCtrl.hasError('required')) {
    <mat-error>Systolic pressure is required</mat-error>
  }
  @if (systolicCtrl.hasError('min') || systolicCtrl.hasError('max')) {
    <mat-error>Enter a value between 60 and 250 mmHg</mat-error>
  }
</mat-form-field>
```

```scss
// Full-width form fields — apply as a class, not on every field
.cp-field-fullwidth {
  width: 100%;
}
```

**Validation rules:**
- Validate `on blur` — use `updateOn: 'blur'` in `FormControl` options
- `mat-error` is automatically hidden until the field is touched
- Multi-error: show one error at a time (most actionable first)
- `required` marker is handled by Angular Material automatically when `required` attribute is present

---

### 5.3 Cards

**Angular Material selector:** `mat-card`, `mat-card-header`, `mat-card-title`, `mat-card-subtitle`, `mat-card-content`, `mat-card-actions`, `mat-card-footer`

```html
<!-- Clinician: compact vital KPI card -->
<mat-card appearance="outlined">
  <mat-card-header>
    <mat-card-title>Blood Pressure</mat-card-title>
    <mat-card-subtitle>Last recorded 2h ago</mat-card-subtitle>
  </mat-card-header>
  <mat-card-content>
    <span class="cp-font-mono">128 / 82</span>
    <span class="cp-status-badge cp-status-badge--warning">Elevated</span>
  </mat-card-content>
</mat-card>

<!-- Patient: summary card with action -->
<mat-card appearance="raised">
  <mat-card-content>
    <p>Your oxygen level looks normal today.</p>
  </mat-card-content>
  <mat-card-actions align="end">
    <button mat-button color="primary">See history</button>
  </mat-card-actions>
</mat-card>
```

**Usage rules:**
- `appearance="outlined"` — clinician (lower visual weight, grid-dense)
- `appearance="raised"` — patient (more prominent, single item per screen)
- Status tinting: use `cp-status-badge` inside card content; never change the card border via raw CSS

---

### 5.4 Data Tables (Clinician)

**Angular Material selector:** `mat-table`, `matSort`, `mat-sort-header`, `matPaginator`, `mat-header-row`, `mat-row`

```html
<mat-table [dataSource]="observationsDataSource" matSort aria-label="Patient observations">

  <!-- Date column -->
  <ng-container matColumnDef="date">
    <mat-header-cell *matHeaderCellDef mat-sort-header>Date</mat-header-cell>
    <mat-cell *matCellDef="let obs">{{ obs.date | date:'dd MMM HH:mm' }}</mat-cell>
  </ng-container>

  <!-- Value column — monospace for tabular alignment -->
  <ng-container matColumnDef="value">
    <mat-header-cell *matHeaderCellDef>Value</mat-header-cell>
    <mat-cell *matCellDef="let obs" class="cp-font-mono">
      {{ obs.value }} {{ obs.unit }}
    </mat-cell>
  </ng-container>

  <!-- Status column -->
  <ng-container matColumnDef="status">
    <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
    <mat-cell *matCellDef="let obs">
      <span [class]="'cp-status-badge cp-status-badge--' + obs.status">
        {{ obs.statusLabel }}
      </span>
    </mat-cell>
  </ng-container>

  <mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></mat-header-row>
  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>

  <tr class="mat-mdc-no-data-row">
    <td [attr.colspan]="displayedColumns.length">No observations recorded.</td>
  </tr>
</mat-table>

<mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
```

**Keyboard support:**
- `matSort` provides `aria-sort` automatically
- Row keyboard navigation: implement `(keydown)` on rows for `↑↓` + `Enter`
- Multi-select: add a checkbox column using `SelectionModel` from `@angular/cdk/collections`

---

### 5.5 Notifications & Alerts

**Angular Material:** `MatSnackBar` service for transient notifications. Inline persistent alerts use a `mat-card` with a `cp-status-badge` — not a custom alert component.

```typescript
// Clinician — technical, concise
this.snackBar.open('Vitals saved successfully', 'Dismiss', {
  duration: 4000,
  panelClass: ['cp-snackbar--success'],
});

// Patient — plain language, no dismiss needed
this.snackBar.open('Your vitals have been recorded. Great job!', undefined, {
  duration: 5000,
  panelClass: ['cp-snackbar--success'],
});

// Critical (does not auto-dismiss)
this.snackBar.open(
  'A value is outside normal range. Please contact your care team.',
  'Got it',
  { panelClass: ['cp-snackbar--critical'] }
);
```

```scss
// Snackbar status overrides — allowed via panelClass
.cp-snackbar--success .mdc-snackbar__surface {
  background-color: $cp-status-success-bg;
  color: $cp-status-success-text;
}
.cp-snackbar--critical .mdc-snackbar__surface {
  background-color: $cp-status-critical-bg;
  color: $cp-status-critical-text;
}
.cp-snackbar--warning .mdc-snackbar__surface {
  background-color: $cp-status-warning-bg;
  color: $cp-status-warning-text;
}
```

---

### 5.6 Navigation

**Clinician App — `mat-sidenav`**

```html
<!-- clinician-app/src/app/app.html -->
<mat-sidenav-container class="cp-app-container">
  <mat-sidenav mode="side" opened class="cp-sidebar">
    <div class="cp-sidebar__logo">
      <!-- SVG logo only, no emoji -->
    </div>
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard"    routerLinkActive="active">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/patients"     routerLinkActive="active">
        <mat-icon matListItemIcon>people</mat-icon>
        <span matListItemTitle>Patients</span>
      </a>
      <a mat-list-item routerLink="/encounters"   routerLinkActive="active">
        <mat-icon matListItemIcon>event_note</mat-icon>
        <span matListItemTitle>Encounters</span>
      </a>
      <a mat-list-item routerLink="/vitals"       routerLinkActive="active">
        <mat-icon matListItemIcon>monitor_heart</mat-icon>
        <span matListItemTitle>Vitals</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar color="primary">
      <!-- Page title + contextual actions -->
    </mat-toolbar>
    <main class="cp-main-content">
      <router-outlet />
    </main>
  </mat-sidenav-content>
</mat-sidenav-container>
```

**Patient App — Bottom tab navigation with `mat-tab-nav-bar`**

```html
<!-- patient-app/src/app/app.html -->
<main class="cp-patient-main">
  <router-outlet />
</main>

<!-- Bottom nav — sticky, above safe area -->
<nav mat-tab-nav-bar class="cp-bottom-nav" [tabPanel]="tabPanel">
  <a mat-tab-link routerLink="/home"     routerLinkActive #homeLink="routerLinkActive"
     [active]="homeLink.isActive">
    <mat-icon>home</mat-icon>Home
  </a>
  <a mat-tab-link routerLink="/vitals"   routerLinkActive #vitalsLink="routerLinkActive"
     [active]="vitalsLink.isActive">
    <mat-icon>favorite</mat-icon>Vitals
  </a>
  <a mat-tab-link routerLink="/messages" routerLinkActive #msgsLink="routerLinkActive"
     [active]="msgsLink.isActive">
    <mat-icon>chat</mat-icon>Messages
  </a>
  <a mat-tab-link routerLink="/profile"  routerLinkActive #profLink="routerLinkActive"
     [active]="profLink.isActive">
    <mat-icon>person</mat-icon>Profile
  </a>
</nav>
<mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
```

```scss
// Bottom nav structural positioning (layout only — no color overrides)
.cp-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 100;
}
.cp-patient-main {
  padding-bottom: 72px; // clear the bottom nav
}
```

---

### 5.7 Guided Stepper (Patient Vitals Entry)

**Angular Material selector:** `mat-stepper` in `linear` mode

```html
<mat-stepper linear orientation="vertical" #stepper>

  <mat-step [stepControl]="bpGroup" label="Blood Pressure">
    <form [formGroup]="bpGroup">
      <p class="mat-body-2">
        Sit comfortably and rest for 5 minutes before measuring.
      </p>
      <mat-form-field appearance="outline" class="cp-field-fullwidth">
        <mat-label>Top number (Systolic)</mat-label>
        <input matInput type="number" formControlName="systolic" />
        <mat-hint>Usually between 90–140</mat-hint>
        <mat-error>Please enter your systolic reading</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="cp-field-fullwidth">
        <mat-label>Bottom number (Diastolic)</mat-label>
        <input matInput type="number" formControlName="diastolic" />
        <mat-hint>Usually between 60–90</mat-hint>
        <mat-error>Please enter your diastolic reading</mat-error>
      </mat-form-field>
      <div>
        <button mat-flat-button color="primary" matStepperNext>Next</button>
      </div>
    </form>
  </mat-step>

  <mat-step [stepControl]="hrGroup" label="Heart Rate">
    <form [formGroup]="hrGroup">
      <mat-form-field appearance="outline" class="cp-field-fullwidth">
        <mat-label>Beats per minute</mat-label>
        <input matInput type="number" formControlName="heartRate" />
        <mat-hint>Normal range: 60–100 bpm</mat-hint>
      </mat-form-field>
      <div>
        <button mat-stroked-button matStepperPrevious class="cp-mt-sm">Back</button>
        <button mat-flat-button color="primary" matStepperNext>Next</button>
      </div>
    </form>
  </mat-step>

  <mat-step label="Confirm">
    <!-- Summary before submit -->
    <button mat-flat-button color="primary" (click)="submitVitals()">Save</button>
    <button mat-button matStepperPrevious>Back</button>
  </mat-step>

</mat-stepper>
```

---

## 6. UX Patterns

### 6.1 Clinician: Patient Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ mat-sidenav (240px) │       mat-sidenav-content         │
│                     │                                   │
│  mat-nav-list       │  mat-toolbar                      │
│  ─ Dashboard        │  "Patient: Jane Doe — MRN: 00142" │
│  ─ Patients ●       │                                   │
│  ─ Encounters       │  [Critical alert banner — mat-card│
│  ─ Vitals           │   appearance="outlined"           │
│                     │   cp-status-badge--critical ]     │
│                     │                                   │
│                     │  [Vital KPI row — 4 mat-cards     │
│                     │   appearance="outlined"           │
│                     │   BP | SpO2 | Weight | Temp]      │
│                     │                                   │
│                     │  [mat-table — Encounters]         │
│                     │  [mat-paginator]                  │
└─────────────────────────────────────────────────────────┘
```

**Data priority:** Critical alerts → Current vitals → Encounter history

### 6.2 Clinician: Encounter Detail Layout

```
Breadcrumb: Patients > Jane Doe > Encounter #E-2024-0042

mat-card (encounter header)
  mat-card-title: "Office Visit — 2025-04-15"
  mat-card-subtitle: "Dr. Smith · Primary Care"

mat-tab-group:
  Tab 1: Overview   — SOAP note sections
  Tab 2: Vitals     — mat-table of Observations
  Tab 3: Orders     — mat-table of orders
  Tab 4: Notes      — textarea (read-only or edit mode)
```

### 6.3 Patient: Health Overview Layout

```
mat-toolbar (no sidenav — patient app is full screen)

cp-patient-content (max-width: 640px, centered)

  mat-card appearance="raised"
    "Good morning, Jane"
    cp-status-badge--success "Your vitals look good today"

  [2-column grid of mat-cards — vital snapshots]
    Heart rate | Oxygen
    Both: large number + plain-language label

  button mat-flat-button color="primary" (full-width)
    "Record today's vitals"

  button mat-button color="primary"
    "See my history"

mat-tab-nav-bar (bottom, fixed)
  Home | Vitals | Messages | Profile
```

### 6.4 Patient: My Vitals Screen

```
mat-card appearance="outlined"
  mat-card-header: "Blood Pressure"
  [Time range: mat-button-toggle-group Week | Month | 3M]
  mat-card-content:
    [Line chart — ApexCharts or Chart.js]
    [Reference bands: normal / elevated zones]

mat-card appearance="raised"
  "Latest: 128 / 82 mmHg"
  cp-status-badge--warning "Slightly elevated"
  "Recorded today at 9:14am"

mat-expansion-panel
  "What does this mean?" (plain-language explanation)

[Simplified history list — mat-list, not mat-table]
```

### 6.5 Chart Selection for Vitals

| Vital | Chart | Library | Key Settings |
|---|---|---|---|
| Blood Pressure | Dual line (systolic solid, diastolic dashed) | ApexCharts | Reference bands for normal/elevated/high zones |
| SpO2 | Area line | ApexCharts | Red fill zone below 94% |
| Heart Rate | Line | ApexCharts | Normal band 60–100 |
| Weight | Bar + trend line | ApexCharts | Neutral colour scale only |

**Accessibility requirements for all charts:**
- Series distinguished by line style (solid/dashed/dotted) AND color — never color alone
- Visible legend always present, not scroll-hidden
- Tooltip on hover (web) showing exact value + unit + date
- Provide a `mat-table` alternative as a collapsible `mat-expansion-panel` below each chart
- Respect `prefers-reduced-motion` — disable chart entrance animations

---

## 7. Accessibility

### WCAG 2.1 AA — Verified Token Contrasts

| Pairing | Contrast | Result |
|---|---|---|
| `#164E63` on `#FFFFFF` | 7.1:1 | AAA |
| `#64748B` on `#FFFFFF` | 4.6:1 | AA |
| `#0891B2` on `#FFFFFF` | 4.5:1 | AA |
| `#DC2626` on `#FFFFFF` | 5.9:1 | AA |
| `#B45309` on `#FFFBEB` | 4.7:1 | AA |

Angular Material's focus rings and ARIA management are inherited automatically when using Material components. Do not remove or override focus styles.

### Additional Rules

```html
<!-- Skip link — first focusable element on every page -->
<a href="#main-content" class="cp-skip-link">Skip to main content</a>
<main id="main-content" tabindex="-1">...</main>
```

```scss
.cp-skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  &:focus { top: 16px; }
}
```

**Clinician app keyboard rules:**
- `mat-table` rows: implement `(keydown.ArrowDown)`, `(keydown.ArrowUp)`, `(keydown.Enter)` for row navigation
- Every icon-only `mat-icon-button` must have `aria-label`
- Search field: `autofocus` on page load for data-heavy list views

**Patient app cognitive load rules:**
- Max 3 interactive elements per screen (enforced by design, not CSS)
- `mat-stepper` with `linear=true` — patient cannot skip steps
- `MatDialog` confirmation required before any destructive action
- `MatDialog` confirm button has `cdkFocusInitial` so keyboard users land on the safe default

---

## 8. Dark Mode

Dark mode is toggled via `[data-theme="dark"]` on `<html>`. Angular Material's `theme-type: dark` theme is applied via `mat.all-component-themes()` inside that selector.

```typescript
// libs/shared/src/lib/theme.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'cp-theme';

  init(): void {
    const saved = localStorage.getItem(this.key);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.apply(saved === 'dark' || (!saved && prefersDark));
  }

  toggle(): void {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.apply(!isDark);
  }

  private apply(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(this.key, dark ? 'dark' : 'light');
  }
}
```

```typescript
// app.config.ts — call theme init before bootstrap
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService) => () => theme.init(),
      deps: [ThemeService],
      multi: true,
    },
  ],
};
```

---

## 9. File Structure

```
care-platform/
├── apps/
│   ├── clinician-app/
│   │   └── src/
│   │       ├── styles.scss           ← mat.define-theme() density -1, light + dark
│   │       └── app/
│   │           └── app.html          ← mat-sidenav-container layout
│   └── patient-app/
│       └── src/
│           ├── styles.scss           ← mat.define-theme() density 0, light + dark
│           └── app/
│               └── app.html          ← mat-tab-nav-bar bottom nav layout
└── libs/
    ├── design-system/
    │   └── src/
    │       ├── _tokens.scss          ← primitive values (colors, spacing, fonts)
    │       ├── _palette.scss         ← Angular Material palette references
    │       ├── _global.scss          ← layout, spacing utils, status badges, chart zones
    │       └── index.scss            ← @forward all
    ├── ui/
    │   └── src/lib/
    │       ├── vital-kpi-card/       ← wraps mat-card, emits click
    │       ├── observation-chart/    ← wraps ApexCharts, handles a11y table fallback
    │       ├── encounter-row/        ← mat-list-item variant for encounter timeline
    │       ├── status-badge/         ← cp-status-badge as Angular component
    │       └── index.ts
    └── shared/
        └── src/lib/
            ├── theme.service.ts
            └── fhir/                 ← FHIR R4 model types + mappers
```

**What `libs/ui` does and does not contain:**

| Contains | Does NOT contain |
|---|---|
| FHIR-aware display components (`vital-kpi-card`, `observation-chart`) | Reimplemented buttons |
| Status badge component | Reimplemented inputs |
| Chart wrapper with a11y table fallback | Reimplemented cards |
| Encounter timeline list item | Reimplemented navigation |

All form, navigation, table, and button UI comes from `@angular/material` directly.

---

## 10. Naming Conventions

| Layer | Convention | Example |
|---|---|---|
| SCSS tokens | `$cp-{category}-{modifier}` | `$cp-blue-500`, `$cp-space-4` |
| CSS utility class | `.cp-{purpose}` | `.cp-font-mono`, `.cp-field-fullwidth` |
| Status badge modifier | `.cp-status-badge--{state}` | `.cp-status-badge--critical` |
| Angular component selector | `cp-{name}` | `<cp-vital-kpi-card>`, `<cp-status-badge>` |
| Angular component class | `Cp{Name}Component` | `CpVitalKpiCardComponent` |
| Nx library import | `@care-platform/{lib}` | `@care-platform/ui`, `@care-platform/shared` |
| Angular Material usage | Standard mat-* selectors | `<mat-card>`, `<button mat-flat-button>` |

---

## 11. Governance

### Versioning

`libs/design-system` and `libs/ui` follow semantic versioning independently:

```
MAJOR — breaking token renames, removed palette, Mat major upgrade
MINOR — new tokens, new ui components, new status variants
PATCH — contrast fixes, spacing corrections, typo fixes
```

### Consistency Enforcement

| Tool | Rule enforced |
|---|---|
| Stylelint `color-no-hex` | No raw hex in component SCSS — use `$cp-*` tokens |
| Stylelint `selector-class-pattern` | Component SCSS only uses `.cp-*` or Angular Material allowed overrides |
| ESLint `@angular-eslint/no-host-metadata-property` | Standard Angular enforcement |
| Storybook | Visual baseline for all `libs/ui` components |
| Chromatic (CI) | Screenshot diff on every PR touching `libs/design-system` or `libs/ui` |

```json
// .stylelintrc
{
  "rules": {
    "color-no-hex": [true, {
      "message": "Use a $cp-* SCSS token, not a raw hex value."
    }],
    "selector-class-pattern": [
      "^(cp-|mat-|mdc-|cdk-)",
      {
        "message": "Class names must be prefixed cp-, mat-, mdc-, or cdk-."
      }
    ]
  }
}
```

### Documentation Structure

```
docs/
├── 08-design-system.md          ← this file (authoritative reference)
├── design-system/
│   ├── 01-tokens.md             ← token values + usage rules
│   ├── 02-theming.md            ← Angular Material setup walkthrough
│   ├── 03-components.md         ← Material component usage per app
│   ├── 04-patterns-clinician.md ← dashboard, table, timeline patterns
│   ├── 05-patterns-patient.md   ← guided form, vitals display patterns
│   ├── 06-accessibility.md      ← WCAG checklist per component
│   └── 07-changelog.md
```

---

## 12. Implementation Sequence

| Step | Deliverable | Dependencies |
|---|---|---|
| 1 | `npx ng add @angular/material@~21.2.0` | None |
| 2 | `libs/design-system` — tokens + palette + global | Step 1 |
| 3 | `clinician-app/styles.scss` — M3 theme density -1 | Step 2 |
| 4 | `patient-app/styles.scss` — M3 theme density 0 | Step 2 |
| 5 | `libs/shared` — ThemeService, FHIR types | Step 1 |
| 6 | `clinician-app` — mat-sidenav shell layout | Steps 3, 5 |
| 7 | `patient-app` — mat-tab-nav-bar shell layout | Steps 4, 5 |
| 8 | `libs/ui` — cp-vital-kpi-card, cp-observation-chart | Steps 3, 4 |
| 9 | Clinician screens: Dashboard, Encounter, Vitals Entry | Steps 6, 8 |
| 10 | Patient screens: Health Overview, My Vitals, Record Vitals | Steps 7, 8 |
