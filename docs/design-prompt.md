# WaveX NFT Platform Design & Development Prompt

## Design Philosophy
Create a luxury NFT marketplace that emphasizes exclusivity and premium experiences while maintaining clean, intuitive user interfaces. The design should reflect high-end value while remaining accessible and functional.

## Technology Stack

### Core Technologies
- React with TypeScript
- Next.js for framework
- Tailwind CSS for styling
- Lucide React for iconography

### Component Libraries & Tools
- shadcn/ui for base components
- Recharts for data visualization
- Core React hooks (useState, useEffect)

## Design System

### Color Palette

Primary Colors:
- Blue theme: 
  - Primary: blue-500 (#3B82F6) for CTAs and key interactions
  - Secondary: blue-50 (#EFF6FF) for subtle backgrounds
  - Hover states: blue-600 (#2563EB) for primary, blue-100 for secondary

Neutral Colors:
- Text: gray-900 for headings, gray-600 for body
- Borders: gray-200 (#E5E7EB)
- Backgrounds: white for cards, gray-50 for subtle contrast

Status Colors:
- Success: green-500 (#22C55E) with green-50 background
- Error: red-500 (#EF4444) with red-50 background

### Typography

Hierarchy:
- Page Titles: text-2xl (24px) font-bold
- Section Headers: text-xl (20px) font-bold
- Card Titles: text-lg (18px) font-semibold
- Body Text: text-base (16px)
- Supporting Text: text-sm (14px)
- Metadata: text-xs (12px)

### Spacing System

Use Tailwind's built-in spacing scale:
- Container padding: p-6
- Component gaps: gap-6 for large, gap-4 for medium
- Stack spacing: space-y-8 for sections, space-y-4 for content
- Grid gaps: gap-6 for card layouts

### Layout Patterns

Grid Systems:
```jsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Card components */}
</div>
```

Container:
```jsx
<div className="max-w-6xl mx-auto p-6">
  {/* Page content */}
</div>
```

### Component Patterns

#### Cards
```jsx
<div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
  <div className="h-48 bg-gray-100 relative">
    {/* Image content */}
  </div>
  <div className="p-4 space-y-4">
    {/* Card content */}
  </div>
</div>
```

#### Buttons
Primary:
```jsx
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Button Text
</button>
```

Secondary:
```jsx
<button className="px-4 py-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100">
  Button Text
</button>
```

#### Input Fields
```jsx
<div className="relative">
  <input 
    type="text"
    className="w-full pl-10 pr-4 py-2 border rounded-lg"
    placeholder="Search..."
  />
  {/* Optional icon */}
  <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
</div>
```

### Icon Usage

Icon Sizing:
- Small: w-4 h-4
- Medium: w-5 h-5
- Large: w-6 h-6

Icon with Text:
```jsx
<div className="flex items-center gap-2">
  <IconComponent className="w-5 h-5 text-blue-500" />
  <span>Label Text</span>
</div>
```

### Responsive Design

Breakpoint Strategy:
- Mobile-first approach
- Tablet: md: (768px)
- Desktop: lg: (1024px)

Example:
```jsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Responsive content */}
</div>
```

### Animation & Transitions

Hover States:
```jsx
<div className="transition-all hover:shadow-lg hover:bg-gray-50">
  {/* Content */}
</div>
```

### Best Practices

1. Consistency
- Use design tokens for colors, spacing, and typography
- Maintain consistent padding and margin patterns
- Keep component patterns uniform across similar elements

2. Accessibility
- Use semantic HTML elements
- Maintain proper color contrast
- Include hover and focus states
- Provide proper aria labels

3. Performance
- Use Tailwind's core utility classes only
- Avoid arbitrary values in class names
- Optimize image loading with proper sizing

4. Organization
- Group related components logically
- Use consistent naming conventions
- Maintain clear component hierarchy

5. Responsiveness
- Test all breakpoints thoroughly
- Ensure touch targets are adequate size
- Maintain readability at all screen sizes

## Implementation Guidelines

1. Start with layout structure
2. Build reusable components
3. Implement responsive design
4. Add interactions and animations
5. Test across devices and browsers
6. Optimize for performance

## Quality Checklist

- [ ] Consistent spacing and alignment
- [ ] Proper color usage following design system
- [ ] Responsive behavior at all breakpoints
- [ ] Accessible to keyboard and screen readers
- [ ] Proper loading states
- [ ] Error handling states
- [ ] Touch-friendly on mobile devices
- [ ] Performance optimized
- [ ] Cross-browser tested