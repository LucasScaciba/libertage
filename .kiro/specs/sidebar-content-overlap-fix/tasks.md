# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Sidebar Content Spacing
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - desktop viewport (>= 768px) with sidebar in expanded or collapsed state
  - Test that SidebarInset has correct left margin based on sidebar state:
    - When viewport >= 768px AND sidebar state is "expanded" → margin-left should be 16rem (var(--sidebar-width))
    - When viewport >= 768px AND sidebar state is "collapsed" → margin-left should be 3rem (var(--sidebar-width-icon))
  - The test assertions should match the Expected Behavior Properties from design:
    - Property 1: For any layout render where viewport width >= 768px and sidebar is present, SidebarInset SHALL apply left margin of 16rem when expanded and 3rem when collapsed
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "SidebarInset has margin-left: 0 instead of 16rem when sidebar is expanded")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Mobile Layout Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (mobile viewport < 768px):
    - SidebarInset should have margin-left: 0 in mobile
    - Sidebar should overlay content when opened in mobile
    - SiteHeader should be positioned correctly
    - Main element classes (flex, flex-col, flex-1) should work correctly
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Property 2: For any layout render where viewport width < 768px, SidebarInset SHALL produce exactly the same result as original code
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for sidebar content overlap in desktop layout

  - [x] 3.1 Implement the fix in SidebarInset component
    - Add `data-sidebar="sidebar-inset"` attribute to the main element in SidebarInset component
    - Remove or adjust the conflicting `md:peer-data-[variant=inset]:ml-0` class that forces margin-left: 0 in desktop
    - Verify CSS rules in app/globals.css have adequate specificity for [data-sidebar="sidebar-inset"]
    - Add transition property for smooth margin animation (transition-[margin] or similar)
    - If needed, increase CSS specificity in globals.css using more specific selectors or !important
    - Add transition: margin-left 0.3s ease-in-out to CSS rules for smooth animation
    - _Bug_Condition: isBugCondition(input) where input.viewportWidth >= 768 AND input.sidebarExists AND input.sidebarState IN ['expanded', 'collapsed'] AND NOT contentHasCorrectLeftMargin(input)_
    - _Expected_Behavior: SidebarInset SHALL apply margin-left of 16rem when sidebar is expanded and 3rem when collapsed in desktop (>= 768px)_
    - _Preservation: Mobile layout (< 768px) SHALL continue with margin-left: 0, sidebar overlay behavior, correct header positioning, and main element classes_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Sidebar Content Spacing
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that SidebarInset now has correct left margin in desktop for both expanded (16rem) and collapsed (3rem) states
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Mobile Layout Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions in mobile behavior, header positioning, or main element classes)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
