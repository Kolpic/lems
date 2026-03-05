# Figma Design Implementation Guide

Guidelines for implementing designs from Figma using MCP tools, AI assistance, and maintaining design system consistency.

## Table of Contents

- [Introduction](#introduction)
- [MCP Figma Tools Reference](#mcp-figma-tools-reference)
- [Design System Implementation](#design-system-implementation)
- [Component Mapping Guidelines](#component-mapping-guidelines)
- [AI-Assisted Workflow](#ai-assisted-workflow)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Responsive Design](#responsive-design)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Introduction

### Purpose

This guide bridges the gap between design (Figma) and development (React/TypeScript), ensuring:

- **Consistency**: Code matches designs pixel-perfectly
- **Efficiency**: Leverage AI + MCP tools for faster implementation
- **Quality**: Maintain accessibility and responsive standards
- **Collaboration**: Clear communication between designers and developers

### When to Use This Guide

- Implementing new UI components from Figma
- Updating existing components based on design changes
- Extracting design tokens and variables
- Using AI assistants with Figma MCP tools
- Ensuring design system compliance

### AI + MCP Workflow Benefits

✅ **Faster implementation** - Extract code directly from designs
✅ **Fewer errors** - Automated extraction reduces manual mistakes
✅ **Design fidelity** - Precise spacing, colors, and typography
✅ **Design system sync** - Variables and tokens stay consistent

---

## MCP Figma Tools Reference

### Overview

The Figma MCP server provides tools to interact with Figma designs directly from your development environment.

**Available Tools**:

1. `get_design_context` - Extract component code and styles ⭐ Most used
2. `get_screenshot` - Generate visual reference images
3. `get_variable_defs` - Get design tokens and variables
4. `get_code_connect_map` - Map Figma components to codebase
5. `get_metadata` - Get page/frame structure
6. `get_figjam` - Extract content from FigJam files

---

### 1. get_design_context ⭐

**Purpose**: Extract code, styles, and structure from a Figma node.

**When to use**:

- Implementing a new component
- Getting exact spacing and measurements
- Extracting text styles and colors
- Understanding component structure

**Parameters**:

- `nodeId`: Figma node ID (e.g., "123:456")
- `clientLanguages`: "typescript,react" (helps AI generate appropriate code)
- `clientFrameworks`: "react,tailwind" (for framework-specific code)
- `forceCode`: boolean (force code generation even for large outputs)

**Example Usage**:

```typescript
// AI prompt: "Implement the LoginButton component from Figma"
// AI will use: get_design_context with nodeId extracted from Figma URL

// Figma URL: https://figma.com/design/abc123?node-id=45-678
// Node ID: "45:678"

// Tool call:
{
  nodeId: "45:678",
  clientLanguages: "typescript",
  clientFrameworks: "react,tailwind"
}

// Returns:
// - Component structure
// - Styles (width, height, padding, colors)
// - Text content and typography
// - Assets (icons, images)
// - Layout information (flexbox properties)
```

**Best Practices**:

- Always specify node ID for precise extraction
- Use clientLanguages/Frameworks to get better code output
- Extract parent frames for layout context
- Review generated code for optimization opportunities

**Common Pitfalls**:

- ❌ Using page-level nodeId (too much data)
- ❌ Not specifying framework (gets generic output)
- ✅ Extract individual components or small groups
- ✅ Specify your tech stack for better results

---

### 2. get_screenshot

**Purpose**: Generate PNG screenshot of a Figma node for visual reference.

**When to use**:

- Visual comparison during implementation
- Design reviews
- Documentation
- Before/after comparisons

**Parameters**:

- `nodeId`: Figma node ID

**Example Usage**:

```typescript
// AI prompt: "Show me what the UserCard component looks like"

// Tool call:
{
  nodeId: "89:123";
}

// Returns: Base64-encoded PNG image
// AI can display it for visual reference
```

**Best Practices**:

- Use alongside `get_design_context` for complete picture
- Take screenshots of different component states (hover, active, disabled)
- Save to documentation for design handoff records

---

### 3. get_variable_defs

**Purpose**: Extract design tokens (colors, spacing, typography) defined in Figma variables.

**When to use**:

- Setting up design system in code
- Syncing design tokens
- Updating theme variables
- Creating Tailwind config from Figma

**Parameters**:

- `nodeId`: Figma node ID (optional, gets all variables if not specified)

**Example Usage**:

```typescript
// AI prompt: "Get all color variables from our design system"

// Tool call:
{
  nodeId: "" // Empty to get all variables
}

// Returns:
{
  "color/primary/default": "#BD303E",
  "color/primary/hover": "#9E1F31",
  "color/background/default": "#FCFBF8",
  "spacing/xs": "4px",
  "spacing/sm": "8px",
  "spacing/md": "16px",
  "typography/heading/h1/size": "32px",
  "typography/heading/h1/weight": "600"
}
```

**Implementation**:

```typescript
// Map to Tailwind config
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'ruby-primary': '#BD303E',
        'ruby-hover': '#9E1F31',
        'cream': '#FCFBF8',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
      }
    }
  }
}

// Or CSS variables
:root {
  --color-primary-default: #BD303E;
  --color-primary-hover: #9E1F31;
  --color-background-default: #FCFBF8;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}
```

**Best Practices**:

- Extract variables early in project setup
- Automate sync with design system
- Document variable naming conventions
- Validate that code matches Figma variables

---

### 4. get_code_connect_map

**Purpose**: Map Figma components to existing codebase components.

**When to use**:

- Linking designs to implemented components
- Documentation
- Design system audits
- Finding which components exist

**Parameters**:

- `nodeId`: Figma node ID

**Example Usage**:

```typescript
// AI prompt: "Which components are already implemented?"

// Tool call:
{
  nodeId: "45:678"
}

// Returns:
{
  "45:678": {
    codeConnectSrc: "src/components/Button.tsx",
    codeConnectName: "Button"
  },
  "45:679": {
    codeConnectSrc: "src/components/Input.tsx",
    codeConnectName: "Input"
  }
}
```

**Best Practices**:

- Keep mappings up to date
- Use for design system inventory
- Identify gaps (designed but not implemented)

---

### 5. get_metadata

**Purpose**: Get high-level structure of Figma file (pages, frames, layers).

**When to use**:

- Understanding file organization
- Finding specific components
- Navigation within large files
- Overview before detailed extraction

**Parameters**:

- `nodeId`: Page or frame ID

**Example Usage**:

```typescript
// AI prompt: "Show me the structure of the Components page"

// Tool call:
{
  nodeId: "0:1"; // Page ID
}

// Returns XML structure:
<PAGE id="0:1" name="Components">
  <FRAME id="45:678" name="Buttons" x="0" y="0" width="320" height="200">
    <COMPONENT id="45:679" name="Button/Primary" width="100" height="40" />
    <COMPONENT id="45:680" name="Button/Secondary" width="100" height="40" />
  </FRAME>
  <FRAME id="45:700" name="Inputs" x="400" y="0" width="320" height="300">
    ...
  </FRAME>
</PAGE>;
```

**Best Practices**:

- Use to find node IDs when you don't have URLs
- Understand component organization
- Navigate complex files efficiently

---

### 6. get_figjam

**Purpose**: Extract content from FigJam collaboration files.

**When to use**:

- Implementing flows from FigJam diagrams
- Extracting user stories or requirements
- Processing wireframes
- Collaboration session outputs

**Parameters**:

- `nodeId`: FigJam node ID
- `includeImagesOfNodes`: boolean (include visual content)

**Example Usage**:

```typescript
// AI prompt: "Extract the user flow from our FigJam board"

// Tool call:
{
  nodeId: "123:456",
  includeImagesOfNodes: true
}

// Returns:
// - Text content from sticky notes
// - Shapes and connectors
// - Images of diagrams
// - Comments and annotations
```

**Best Practices**:

- Use for requirement gathering
- Extract user stories before implementation
- Keep technical specs in FigJam linked to code

---

## Design System Implementation

### Design Tokens Mapping

**Figma Variables → Code**

```typescript
// 1. Extract variables using get_variable_defs
// 2. Map to your system

// Figma: color/primary/default → Code: --color-primary
// Figma: spacing/md → Code: --spacing-4 (16px = spacing-4 in Tailwind)
// Figma: typography/body/regular → Code: text-base font-normal
```

### Color System

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Primary colors (from Figma variables)
        ruby: {
          primary: "#BD303E",
          hover: "#9E1F31",
        },
        // Background colors
        cream: "#FCFBF8",
        stone: {
          input: "#EFE6D2",
          border: "#BCAB8B",
        },
        // Semantic colors
        success: "#1F6F42",
        warning: "#B9860E",
        error: "#BD303E",
      },
    },
  },
};
```

**Usage**:

```tsx
// ✅ GOOD: Use design tokens
<button className="bg-ruby-primary hover:bg-ruby-hover text-cream">
  Bridge Tokens
</button>

// ❌ BAD: Hardcoded colors
<button className="bg-[#BD303E] hover:bg-[#9E1F31] text-[#FCFBF8]">
  Bridge Tokens
</button>
```

### Spacing System

```typescript
// Map Figma spacing to Tailwind
// Figma uses: 4, 8, 12, 16, 24, 32, 48, 64, 96

// tailwind.config.js
export default {
  theme: {
    spacing: {
      xs: "4px", // 0.5 in Tailwind (8px)
      sm: "8px", // 2 in Tailwind
      md: "16px", // 4 in Tailwind
      lg: "24px", // 6 in Tailwind
      xl: "32px", // 8 in Tailwind
      "2xl": "48px", // 12 in Tailwind
      "3xl": "64px", // 16 in Tailwind
      "4xl": "96px", // 24 in Tailwind
    },
  },
};
```

### Typography System

```typescript
// Extract from Figma typography variables
// Map to Tailwind or custom classes

// tailwind.config.js
export default {
  theme: {
    fontFamily: {
      heading: ['"Cinzel"', "serif"],
      body: ['"Inter"', "sans-serif"],
    },
    fontSize: {
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["14px", { lineHeight: "20px" }],
      base: ["16px", { lineHeight: "24px" }],
      lg: ["18px", { lineHeight: "28px" }],
      xl: ["20px", { lineHeight: "28px" }],
      "2xl": ["24px", { lineHeight: "32px" }],
      "3xl": ["32px", { lineHeight: "40px" }],
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
};
```

---

## Component Mapping Guidelines

### Naming Conventions

**Figma → React**

```
Figma: Button/Primary/Large
React: <Button variant="primary" size="large" />

Figma: Card/Transaction
React: <TransactionCard />

Figma: Input/Text/With Icon
React: <Input type="text" icon={<SearchIcon />} />

Figma: Modal/Claim/Confirmation
React: <ClaimConfirmModal />
```

**Rules**:

1. Component Name = Frame name (PascalCase)
2. Variants → props
3. States → state handling or pseudo-classes
4. Nested frames → component composition

### Auto Layout → Flexbox/Grid

**Figma Auto Layout properties map to CSS:**

```tsx
// Figma: Auto Layout Horizontal, spacing: 8px, padding: 16px
<div className="flex flex-row gap-2 p-4">
  {children}
</div>

// Figma: Auto Layout Vertical, spacing: 16px, padding: 24px
<div className="flex flex-col gap-4 p-6">
  {children}
</div>

// Figma: Hug contents (width)
<div className="w-auto">
  {children}
</div>

// Figma: Fill container (width)
<div className="w-full">
  {children}
</div>
```

### Component Variants → Props

```tsx
// Figma: Button component with variants:
// - Type: Primary, Secondary, Tertiary
// - Size: Small, Medium, Large
// - State: Default, Hover, Disabled

interface ButtonProps {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
}) => {
  const variantClasses = {
    primary: "bg-ruby-primary text-cream hover:bg-ruby-hover",
    secondary: "bg-stone-input text-primary hover:bg-stone-hover",
    tertiary: "bg-transparent text-primary hover:underline",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled && "opacity-50 cursor-not-allowed"}
        rounded-lg transition-all
      `}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

---

## AI-Assisted Workflow

### Step-by-Step Process

**1. Review Design**

```
AI: "Show me the LoginForm component from Figma"
→ Uses get_screenshot for visual reference
```

**2. Extract Design Context**

```
AI: "Get the design details for LoginForm"
→ Uses get_design_context with nodeId="123:456"
→ Extracts structure, styles, measurements
```

**3. Get Design Tokens**

```
AI: "What colors and spacing does this use?"
→ Uses get_variable_defs
→ Identifies: color/primary, spacing/md, etc.
```

**4. Implement Component**

```typescript
// AI generates initial implementation
const LoginForm: React.FC = () => {
  return (
    <form className="flex flex-col gap-6 p-8 bg-cream rounded-lg">
      <h2 className="text-2xl font-semibold font-heading text-primary">
        Welcome Back
      </h2>
      <Input type="email" placeholder="Email address" icon={<MailIcon />} />
      <Input type="password" placeholder="Password" icon={<LockIcon />} />
      <Button variant="primary" size="lg">
        Sign In
      </Button>
    </form>
  );
};
```

**5. Apply Design System**

```
- Verify colors match design tokens
- Check spacing matches design system
- Ensure typography is consistent
- Validate border radius, shadows, etc.
```

**6. Add Interactivity**

```typescript
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Handle login...
  };

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
};
```

**7. Validate Against Design**

```
AI: "Compare my implementation to the Figma design"
→ Uses get_screenshot again
→ Visual comparison
→ Identifies discrepancies
```

**8. Iterate**

```
Fix spacing, colors, typography based on comparison
Test responsive behavior
Add animations if in design
```

---

## Accessibility Guidelines

### Semantic HTML

```tsx
// ✅ GOOD: Semantic elements
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<button onClick={handleClick}>Submit</button>

<article>
  <h2>Transaction Details</h2>
  <p>Amount: 100 WOOD</p>
</article>

// ❌ BAD: Div soup
<div onClick={handleClick}>Submit</div>
<div>
  <div>Transaction Details</div>
  <div>Amount: 100 WOOD</div>
</div>
```

### ARIA Labels

```tsx
// ✅ GOOD: Descriptive labels
<button
  aria-label="Close modal"
  onClick={onClose}
>
  <CloseIcon />
</button>

<input
  type="text"
  aria-label="Search transactions"
  placeholder="Search..."
/>

// Navigation landmark
<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>
```

### Keyboard Navigation

```tsx
// ✅ GOOD: Keyboard accessible modal
const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Trap focus in modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      firstElement?.focus();
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Implementation...
};
```

### Color Contrast

```tsx
// Validate against WCAG standards
// Use tools like Contrast Checker

// ✅ GOOD: High contrast (WCAG AA)
<p className="text-primary bg-cream">
  {/* Primary (#28231B) on Cream (#FCFBF8) = 12.5:1 */}
</p>

// ⚠️ WARNING: Low contrast
<p className="text-gray-400 bg-gray-100">
  {/* May not meet WCAG AA standards */}
</p>

// Check in browser DevTools:
// Inspect element → Accessibility panel → Contrast ratio
```

### Screen Reader Support

```tsx
// ✅ GOOD: Screen reader friendly
<button onClick={handleClaim}>
  <span className="sr-only">Claim tokens for transaction 0x123</span>
  <ClaimIcon aria-hidden="true" />
  <span aria-hidden="true">Claim</span>
</button>

// Live regions for dynamic content
<div role="status" aria-live="polite">
  {isLoading ? 'Loading transactions...' : `${transactions.length} transactions found`}
</div>
```

---

## Responsive Design

### Breakpoint System

```typescript
// Map Figma frames to breakpoints
// Figma: Mobile (375px), Tablet (768px), Desktop (1200px)

// tailwind.config.js
export default {
  theme: {
    screens: {
      sm: "640px", // Mobile landscape
      md: "768px", // Tablet
      lg: "1024px", // Desktop
      xl: "1280px", // Large desktop
    },
  },
};
```

### Mobile-First Implementation

```tsx
// ✅ GOOD: Mobile-first approach
<div className="
  flex flex-col gap-4 p-4          // Mobile
  md:flex-row md:gap-6 md:p-6      // Tablet
  lg:gap-8 lg:p-8                  // Desktop
">
  <Sidebar className="w-full md:w-64" />
  <main className="flex-1">
    {content}
  </main>
</div>

// ❌ BAD: Desktop-first (harder to maintain)
<div className="
  flex-row gap-8 p-8
  md:gap-6 md:p-6
  sm:flex-col sm:gap-4 sm:p-4
">
  {/* Confusing order */}
</div>
```

### Responsive Typography

```tsx
// ✅ GOOD: Fluid typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Transaction History
</h1>

// Or use CSS clamp
<h1 className="text-[clamp(1.5rem,4vw,2.5rem)]">
  Transaction History
</h1>
```

### Touch Targets

```tsx
// ✅ GOOD: Minimum 44x44px touch targets
<button className="
  min-w-[44px] min-h-[44px]
  px-4 py-2
">
  Claim
</button>

// ❌ BAD: Too small for touch
<button className="px-1 py-0.5 text-xs">
  Claim
</button>
```

---

## Best Practices

### Design Review Checklist

Before implementing:

- [ ] Design is final (not WIP)
- [ ] All states are designed (hover, active, disabled, loading)
- [ ] Responsive breakpoints defined
- [ ] Accessibility notes provided
- [ ] Design tokens match design system
- [ ] Assets exported (icons, images)

### Handling Design Updates

```typescript
// 1. Get latest from Figma
// 2. Compare with implementation
// 3. Update code
// 4. Test all affected components
// 5. Update tests
// 6. Document changes

// Use version control for designs
// Figma: Version History → Name versions
// Example: "v1.2 - Updated button styles"
```

### Designer-Developer Communication

**Use Figma comments:**

```
Designer: "This spacing should be 24px, not 16px"
Developer: "Updated! Using spacing-6 (24px) now"

Designer: "What component should I use here?"
Developer: "Use the TransactionCard component from our design system"
```

**Regular syncs:**

- Weekly design review meetings
- Share implementation progress
- Discuss edge cases
- Validate assumptions

---

## Common Patterns

### Form Components

```tsx
// Extract from Figma, implement with validation
const BridgeForm: React.FC = () => {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="amount"
        control={control}
        rules={{
          required: "Amount is required",
          min: { value: 0.01, message: "Minimum 0.01" },
        }}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            type="number"
            label="Amount"
            error={fieldState.error?.message}
          />
        )}
      />
      <Button type="submit">Bridge</Button>
    </form>
  );
};
```

### Navigation

```tsx
// Implement from Figma navigation designs
<nav className="flex items-center justify-between p-4 bg-cream border-b border-stone">
  <Logo />
  <ul className="flex gap-6">
    <li>
      <NavLink to="/">Bridge</NavLink>
    </li>
    <li>
      <NavLink to="/history">History</NavLink>
    </li>
  </ul>
  <WalletButton />
</nav>
```

---

## Troubleshooting

### Design-Code Mismatches

**Issue**: Spacing doesn't match exactly

**Solution**:

1. Use `get_design_context` to get exact values
2. Check if Figma uses Auto Layout
3. Verify design tokens in use
4. Round to nearest design system value if needed

**Issue**: Colors look different

**Solution**:

1. Check color space (RGB vs HEX)
2. Verify opacity settings
3. Check if blend modes are applied
4. Use `get_variable_defs` to get exact color values

### Missing Specifications

**Issue**: Hover state not designed

**Solution**:

1. Ask designer for hover state
2. Follow design system conventions
3. Use 10-20% darker/lighter shade
4. Add `brightness-90` or similar Tailwind class

### Edge Cases

**Issue**: Design doesn't show empty state

**Solution**:

1. Design empty state yourself
2. Follow empty state patterns from other components
3. Get designer approval
4. Document decision

---

## Summary

**Figma → Code Workflow:**

1. ✅ **Review** design in Figma
2. ✅ **Extract** using MCP tools (get_design_context, get_screenshot)
3. ✅ **Map** design tokens to code
4. ✅ **Implement** component with design system
5. ✅ **Validate** accessibility and responsiveness
6. ✅ **Test** across devices and states
7. ✅ **Iterate** based on feedback

**Key Tools:**

- `get_design_context` - Your primary tool
- `get_variable_defs` - For design tokens
- `get_screenshot` - For visual reference

**Remember:**

- Use design tokens, not hardcoded values
- Implement accessibility from the start
- Test responsive behavior
- Communicate with designers
- Document deviations from design
