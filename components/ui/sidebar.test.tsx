import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { SidebarProvider, Sidebar, SidebarInset } from './sidebar'

/**
 * Bug Condition Exploration Test for Sidebar Content Overlap
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test is EXPECTED TO FAIL on unfixed code - failure confirms the bug exists.
 * 
 * Property 1: Fault Condition - Sidebar Content Spacing
 * For any layout render where viewport width >= 768px and sidebar is present,
 * SidebarInset SHALL apply left margin of 16rem when expanded and 3rem when collapsed.
 */
describe('Bug Condition Exploration: Sidebar Content Overlap', () => {
  it('Property 1: SidebarInset should have correct left margin based on sidebar state in desktop viewport', () => {
    /**
     * Scoped PBT Approach: Test concrete failing cases
     * - Desktop viewport (>= 768px)
     * - Sidebar in expanded or collapsed state
     */
    
    // Inject CSS rules needed for the test
    // Using sibling selector approach from globals.css (works better in jsdom than :has())
    const style = document.createElement('style')
    style.textContent = `
      [data-sidebar="sidebar-inset"] {
        margin-left: 16rem !important;
      }
      
      .peer[data-state="collapsed"] ~ [data-sidebar="sidebar-inset"] {
        margin-left: 3rem !important;
      }
      
      @media (max-width: 767px) {
        [data-sidebar="sidebar-inset"] {
          margin-left: 0px !important;
        }
      }
    `
    document.head.appendChild(style)
    
    fc.assert(
      fc.property(
        // Generate desktop viewport widths (768px to 1920px)
        fc.integer({ min: 768, max: 1920 }),
        // Generate sidebar states
        fc.constantFrom('expanded' as const, 'collapsed' as const),
        (viewportWidth, sidebarState) => {
          // Set viewport width for the test
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          })

          // Mock matchMedia to simulate desktop viewport
          Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
              matches: query === '(min-width: 768px)',
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            }),
          })

          // Render the sidebar layout
          const { container } = render(
            <SidebarProvider defaultOpen={sidebarState === 'expanded'}>
              <Sidebar variant="inset" collapsible="icon" />
              <SidebarInset data-testid="sidebar-inset">
                <div>Test Content</div>
              </SidebarInset>
            </SidebarProvider>
          )

          // Find the SidebarInset element
          const sidebarInset = container.querySelector('[data-testid="sidebar-inset"]') as HTMLElement
          expect(sidebarInset).toBeTruthy()

          // Get computed styles
          const computedStyle = window.getComputedStyle(sidebarInset)
          const marginLeft = computedStyle.marginLeft

          // Expected behavior based on sidebar state
          const expectedMargin = sidebarState === 'expanded' ? '16rem' : '3rem'

          // This assertion SHOULD FAIL on unfixed code
          // The bug is that SidebarInset doesn't have the data-sidebar attribute
          // so the CSS rules don't apply, resulting in margin-left: 0
          expect(marginLeft).toBe(expectedMargin)
        }
      ),
      {
        numRuns: 20, // Run 20 test cases to explore the input space
        verbose: true, // Show counterexamples when test fails
      }
    )
    
    // Clean up
    document.head.removeChild(style)
  })
})

/**
 * Preservation Property Tests for Mobile Layout Behavior
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * These tests are EXPECTED TO PASS on unfixed code - they confirm baseline behavior to preserve.
 * 
 * Property 2: Preservation - Mobile Layout Behavior
 * For any layout render where viewport width < 768px, SidebarInset SHALL produce
 * exactly the same result as original code, preserving mobile behavior.
 */
describe('Preservation: Mobile Layout Behavior', () => {
  it('Property 2: SidebarInset should have margin-left: 0 in mobile viewport', () => {
    /**
     * Requirement 3.1: Mobile layout should have no left margin
     * Content should occupy full width in mobile
     */
    fc.assert(
      fc.property(
        // Generate mobile viewport widths (320px to 767px)
        fc.integer({ min: 320, max: 767 }),
        // Generate sidebar states (both expanded and collapsed)
        fc.constantFrom('expanded' as const, 'collapsed' as const),
        (viewportWidth, sidebarState) => {
          // Set viewport width for the test
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          })

          // Mock matchMedia to simulate mobile viewport
          Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
              matches: query !== '(min-width: 768px)', // Mobile = not desktop
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            }),
          })

          // Render the sidebar layout
          const { container } = render(
            <SidebarProvider defaultOpen={sidebarState === 'expanded'}>
              <Sidebar variant="inset" collapsible="icon" />
              <SidebarInset data-testid="sidebar-inset">
                <div>Test Content</div>
              </SidebarInset>
            </SidebarProvider>
          )

          // Find the SidebarInset element
          const sidebarInset = container.querySelector('[data-testid="sidebar-inset"]') as HTMLElement
          expect(sidebarInset).toBeTruthy()

          // Get computed styles
          const computedStyle = window.getComputedStyle(sidebarInset)
          const marginLeft = computedStyle.marginLeft

          // In mobile, margin-left should always be 0 (or default/empty)
          // This is the baseline behavior we want to preserve
          // Empty string means no explicit margin is set (defaults to 0)
          expect(marginLeft === '0px' || marginLeft === '' || marginLeft === '0').toBe(true)
        }
      ),
      {
        numRuns: 20, // Run 20 test cases to explore mobile viewport range
        verbose: true,
      }
    )
  })

  it('Property 2: SidebarInset should maintain correct flex layout classes in mobile', () => {
    /**
     * Requirement 3.4: Main element classes (flex, flex-col, flex-1) should work correctly
     * These classes are essential for proper layout structure
     */
    fc.assert(
      fc.property(
        // Generate mobile viewport widths
        fc.integer({ min: 320, max: 767 }),
        (viewportWidth) => {
          // Set viewport width for the test
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          })

          // Mock matchMedia to simulate mobile viewport
          Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
              matches: query !== '(min-width: 768px)',
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            }),
          })

          // Render the sidebar layout
          const { container } = render(
            <SidebarProvider defaultOpen={true}>
              <Sidebar variant="inset" collapsible="icon" />
              <SidebarInset data-testid="sidebar-inset">
                <div>Test Content</div>
              </SidebarInset>
            </SidebarProvider>
          )

          // Find the SidebarInset element
          const sidebarInset = container.querySelector('[data-testid="sidebar-inset"]') as HTMLElement
          expect(sidebarInset).toBeTruthy()

          // Verify the element has the correct flex classes
          // These classes should be preserved after the fix
          expect(sidebarInset.classList.contains('flex')).toBe(true)
          expect(sidebarInset.classList.contains('flex-col')).toBe(true)
          expect(sidebarInset.classList.contains('flex-1')).toBe(true)
          expect(sidebarInset.classList.contains('w-full')).toBe(true)
        }
      ),
      {
        numRuns: 15,
        verbose: true,
      }
    )
  })

  it('Property 2: SidebarInset should maintain correct background and positioning in mobile', () => {
    /**
     * Requirements 3.2, 3.3: Sidebar overlay behavior and header positioning
     * In mobile, the sidebar overlays content (Sheet component) and doesn't affect layout
     * SiteHeader should be positioned correctly within SidebarInset
     */
    fc.assert(
      fc.property(
        // Generate mobile viewport widths
        fc.integer({ min: 320, max: 767 }),
        (viewportWidth) => {
          // Set viewport width for the test
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          })

          // Mock matchMedia to simulate mobile viewport
          Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
              matches: query !== '(min-width: 768px)',
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            }),
          })

          // Render the sidebar layout with a header
          const { container } = render(
            <SidebarProvider defaultOpen={false}>
              <Sidebar variant="inset" collapsible="icon" />
              <SidebarInset data-testid="sidebar-inset">
                <header data-testid="site-header">Header Content</header>
                <main>Main Content</main>
              </SidebarInset>
            </SidebarProvider>
          )

          // Find the SidebarInset element
          const sidebarInset = container.querySelector('[data-testid="sidebar-inset"]') as HTMLElement
          expect(sidebarInset).toBeTruthy()

          // Verify background class is present
          expect(sidebarInset.classList.contains('bg-background')).toBe(true)

          // Verify relative positioning is maintained
          expect(sidebarInset.classList.contains('relative')).toBe(true)

          // Verify header is rendered correctly within SidebarInset
          const header = container.querySelector('[data-testid="site-header"]')
          expect(header).toBeTruthy()
          expect(sidebarInset.contains(header)).toBe(true)
        }
      ),
      {
        numRuns: 15,
        verbose: true,
      }
    )
  })
})
