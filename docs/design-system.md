# Design System

## Visual Architecture Overview

### Application Layout Structure

```mermaid
graph TB
    A[App] --> B[AppLayout]
    B --> C[SidebarNavigation]
    B --> D[Header]
    B --> E[MainContent]
    
    C --> C1[NavigationItem Dashboard]
    C --> C2[NavigationItem Clean]
    C --> C3[NavigationItem Optimize]
    C --> C4[NavigationItem Protect]
    C --> C5[NavigationItem Speed Up]
    C --> C6[NavigationItem Toolbox]
    C --> C7[SystemStatus]
    
    D --> D1[ThemeToggle]
    D --> D2[SettingsMenu]
    D --> D3[QuickActions]
    
    E --> E1[Dashboard]
    E --> E2[CleanModule]
    E --> E3[OptimizeModule]
    E --> E4[ProtectModule]
    E --> E5[SpeedUpModule]
    E --> E6[ToolboxModule]
    
    E1 --> E1A[HealthScoreGauge]
    E1 --> E1B[PerformanceGrid]
    E1 --> E1C[QuickActionsPanel]
    
    E2 --> E2A[ScanProgressPanel]
    E2 --> E2B[JunkFilesCard]
    E2 --> E2C[RegistryCleanerCard]
    
    E3 --> E3A[StartupManager]
    E3 --> E3B[RAMOptimizer]
    E3 --> E3C[InternetBooster]
    
    E4 --> E4A[SecurityStatusPanel]
    E4 --> E4B[MalwareScanner]
    E4 --> E4C[RealTimeProtection]
    
    E5 --> E5A[GameBooster]
    E5 --> E5B[ProcessManager]
    E5 --> E5C[PerformanceMonitor]
    
    E6 --> E6A[SoftwareUninstaller]
    E6 --> E6B[DriverUpdater]
    E6 --> E6C[FileTools]
```

## Component Architecture

### HealthScoreGauge Component Flow

```mermaid
flowchart TD
    A[HealthScoreGauge Component] --> B[Props: score, size, showLabel]
    B --> C[Calculate Dimensions]
    C --> D[Determine Color Threshold]
    D --> E[Render SVG Circles]
    E --> F[Background Circle]
    E --> G[Progress Circle]
    E --> H[Center Label]
    F --> I[Apply Theme Colors]
    G --> J[Animate Progress]
    H --> K[Display Percentage]
    I --> L[Dark/Light Theme]
    J --> M[Smooth Transitions]
    K --> N[Status Text]
```

### State Management Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Component
    participant Store as Zustand Store
    participant Electron as Electron Main
    participant System as System APIs
    
    User->>UI: Interacts with Component
    UI->>Store: Dispatch Action
    Store->>Store: Update State
    Store->>UI: Re-render Components
    
    UI->>Electron: IPC Call
    Electron->>System: System Operation
    System->>Electron: Return Data
    Electron->>UI: IPC Response
    UI->>Store: Update with System Data
```

## Color System

### Primary Color Palette

```mermaid
pie title Primary Color Usage
    "Blue (Primary)" : 40
    "Green (Success)" : 25
    "Yellow (Warning)" : 20
    "Red (Danger)" : 15
```

### Theme Color Mapping

| Component | Light Theme | Dark Theme | Usage |
|-----------|-------------|------------|-------|
| Background Primary | #FFFFFF | #0F172A | Main background |
| Background Secondary | #F8FAFC | #1E293B | Cards, panels |
| Text Primary | #1E293B | #F1F5F9 | Main text |
| Text Secondary | #64748B | #94A3B8 | Secondary text |
| Border | #E2E8F0 | #475569 | Borders, dividers |
| Primary | #3B82F6 | #3B82F6 | Buttons, links |
| Success | #22C55E | #22C55E | Positive states |
| Warning | #F59E0B | #F59E0B | Warnings |
| Danger | #EF4444 | #EF4444 | Errors, critical |

## Typography Scale

### Font Hierarchy

```mermaid
graph LR
    A[Display] --> B[Heading Large]
    B --> C[Heading Medium]
    C --> D[Heading Small]
    D --> E[Body Large]
    E --> F[Body Regular]
    F --> G[Body Small]
    G --> H[Caption]
```

### Typography Specifications

| Level | Font Size | Font Weight | Line Height | Use Case |
|-------|-----------|-------------|-------------|----------|
| Display | 2.5rem (40px) | 700 | 1.2 | Main headings |
| Heading Large | 2rem (32px) | 600 | 1.3 | Section titles |
| Heading Medium | 1.5rem (24px) | 600 | 1.4 | Card titles |
| Heading Small | 1.25rem (20px) | 600 | 1.5 | Subheadings |
| Body Large | 1.125rem (18px) | 400 | 1.6 | Large body text |
| Body Regular | 1rem (16px) | 400 | 1.5 | Regular text |
| Body Small | 0.875rem (14px) | 400 | 1.4 | Small text, captions |
| Caption | 0.75rem (12px) | 400 | 1.3 | Labels, metadata |

## Spacing System

### Spacing Scale

```mermaid
graph TB
    A[Spacing Scale] --> B[0: 0px]
    A --> C[1: 4px]
    A --> D[2: 8px]
    A --> E[3: 12px]
    A --> F[4: 16px]
    A --> G[5: 20px]
    A --> H[6: 24px]
    A --> I[8: 32px]
    A --> J[10: 40px]
    A --> K[12: 48px]
    A --> L[16: 64px]
```

### Layout Spacing Guidelines

| Element | Padding | Margin | Usage |
|---------|---------|--------|-------|
| Container | 24px | 0 | Main content containers |
| Card | 24px | 16px | Feature cards |
| Button | 12px 24px | 8px | Interactive buttons |
| Input | 12px 16px | 8px | Form inputs |
| Section | 32px | 24px | Content sections |

## Component Specifications

### Button Variants

```mermaid
graph LR
    A[Button Base] --> B[Primary]
    A --> C[Secondary]
    A --> D[Success]
    A --> E[Warning]
    A --> F[Danger]
    A --> G[Ghost]
    
    B --> B1[Default]
    B --> B2[Hover]
    B --> B3[Active]
    B --> B4[Disabled]
```

### Button States Table

| Variant | Background | Text | Border | Hover | Active |
|---------|------------|------|--------|-------|--------|
| Primary | Blue 500 | White | Blue 500 | Blue 600 | Blue 700 |
| Secondary | Gray 100 | Gray 800 | Gray 300 | Gray 200 | Gray 400 |
| Success | Green 500 | White | Green 500 | Green 600 | Green 700 |
| Warning | Yellow 500 | White | Yellow 500 | Yellow 600 | Yellow 700 |
| Danger | Red 500 | White | Red 500 | Red 600 | Red 700 |
| Ghost | Transparent | Gray 600 | Transparent | Gray 100 | Gray 200 |

### Card Component States

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Hover
    Hover --> Active
    Active --> Idle
    Hover --> Idle
    
    state Hover {
        [*] --> Elevate
        Elevate --> BorderHighlight
        BorderHighlight --> [*]
    }
    
    state Active {
        [*] --> Pressed
        Pressed --> Focus
        Focus --> [*]
    }
```

## Responsive Design

### Breakpoint System

```mermaid
graph LR
    A[Mobile] --> B[Tablet]
    B --> C[Desktop]
    C --> D[Large Desktop]
    
    A --> A1[< 768px]
    B --> B1[768px - 1024px]
    C --> C1[1024px - 1440px]
    D --> D1[> 1440px]
```

### Responsive Layout Patterns

| Component | Mobile | Tablet | Desktop | Large Desktop |
|-----------|--------|--------|---------|---------------|
| Sidebar | Hidden | Collapsed | Expanded | Expanded |
| Navigation | Bottom bar | Sidebar | Sidebar | Sidebar |
| Card Grid | 1 column | 2 columns | 3 columns | 4 columns |
| Charts | Full width | 1 per row | 2 per row | 3 per row |

## Animation System

### Motion Principles

```mermaid
graph TB
    A[Motion System] --> B[Duration Scale]
    A --> C[Easing Curves]
    A --> D[Animation Types]
    
    B --> B1[Fast: 150ms]
    B --> B2[Medium: 300ms]
    B --> B3[Slow: 500ms]
    
    C --> C1[Ease Out: UI interactions]
    C --> C2[Ease In Out: Page transitions]
    C --> C3[Linear: Progress indicators]
    
    D --> D1[Fade: Appearing elements]
    D --> D2[Slide: Navigation]
    D --> D3[Scale: Interactive elements]
    D --> D4[Rotate: Loading states]
```

### Animation Specifications

| Element | Type | Duration | Easing | Use Case |
|---------|------|----------|--------|----------|
| Page Transition | Slide | 300ms | ease-in-out | Navigation |
| Modal Appearance | Fade + Scale | 200ms | ease-out | Dialog opening |
| Button Interaction | Scale | 150ms | ease-out | Button clicks |
| Progress Indicator | Linear | N/A | linear | Loading states |
| Health Score | Custom | 1000ms | ease-out | Score changes |

## Accessibility Guidelines

### WCAG Compliance

```mermaid
graph TB
    A[Accessibility] --> B[Perceivable]
    A --> C[Operable]
    A --> D[Understandable]
    A --> E[Robust]
    
    B --> B1[Color Contrast]
    B --> B2[Text Alternatives]
    B --> B3[Adaptable Content]
    
    C --> C1[Keyboard Access]
    C --> C2[Enough Time]
    C --> C3[Seizure Safe]
    
    D --> D1[Readable]
    D --> D2[Predictable]
    D --> D3[Input Assistance]
    
    E --> E1[Compatible]
    E --> E2[Assistive Tech]
```

### Accessibility Specifications

| Requirement | Implementation | Target Level |
|-------------|----------------|--------------|
| Color Contrast | Minimum 4.5:1 ratio | AA |
| Keyboard Navigation | Full tab navigation | AAA |
| Screen Reader | ARIA labels and roles | AA |
| Focus Management | Logical focus order | AA |
| Text Resize | 200% without loss | AA |

This design system provides a comprehensive foundation for building a consistent, accessible, and visually appealing user interface for the Advanced SystemCare alternative.