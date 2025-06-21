# Project Testing Guidelines

This document provides guidelines for testing key features and accessibility aspects of the project.

## Accessibility Testing

Ensuring the website is accessible to all users, including those with disabilities, is a top priority.

### High Contrast Mode (Forced Colors) Testing

High Contrast Mode (HCM), also known as Forced Colors Mode on the web, is a system-level setting that overrides website-defined colors with a user-selected, limited palette. This is a critical feature for users with low vision. Our goal is to ensure the site remains fully functional and understandable in HCM.

#### Why We Test for HCM

- **Readability**: It ensures that all text is readable against its background.
- **Functionality**: It verifies that all interactive elements like links, buttons, and form fields are visible and their states (e.g., focus, hover) are clear.
- **Component Integrity**: It confirms that custom-styled components, like our progress bars or cards, don't break or become unusable.

#### How to Enable HCM for Testing

**On Windows (Recommended):**

Windows provides the best native support for testing the `forced-colors` media query.

1.  **Via Settings:**
    -   Go to `Settings` > `Accessibility` > `Contrast themes`.
    -   Select a theme from the dropdown (e.g., `Aquatic`, `Desert`, `Night Sky`).
    -   Click `Apply`.
2.  **Via Keyboard Shortcut:**
    -   Press `Left Alt` + `Left Shift` + `Print Screen` to toggle HCM on and off.

**On macOS:**

macOS does not have a direct equivalent that triggers the `forced-colors` media query in browsers. However, you can simulate some of the conditions:

1.  Go to `System Settings` > `Accessibility` > `Display`.
2.  Enable **"Increase contrast"**. This will make borders on UI elements more prominent.
3.  Enable **"Differentiate without color"**. This helps identify UI that relies solely on color.

> **Note:** Testing on macOS is a good supplement, but testing on Windows is essential for true `forced-colors` mode compatibility.

#### What to Check (Testing Checklist)

Once HCM is enabled, browse the site and check the following:

-   [ ] **Text Readability**: Is all text, including headings, paragraphs, and labels, clearly visible against the background?
-   [ ] **Links**: Are links distinguishable from surrounding text (they should have a default underline in HCM)? Is their focus state clear?
-   [ ] **Buttons & Inputs**: Do all buttons and form fields have a visible border? Is their focus outline clear and distinct?
-   [ ] **SVG Icons**: Are all SVG icons visible? (Icons should use `fill="currentColor"` to inherit the system text color).
-   [ ] **Custom Components**:
    -   **Cards/Containers**: Do elements with custom backgrounds still have clear boundaries?
    -   **Progress Bars**: Is the filled portion of the progress bar clearly distinct from the track? (See `SeriesNavigationBox`).
    -   **Badges/Tags**: Are badges and tags readable?

#### How to Fix Common HCM Issues

If you find a component that is not rendering correctly in HCM, use the `forced-colors` media query in your CSS to apply specific fixes.

**Example from `app/globals.css`:**

This example ensures our custom-styled progress bar is visible in HCM.

\`\`\`css
/* In app/globals.css */
@media (forced-colors: active) {
  /*
    Ensures the shadcn/ui Progress component in the SeriesNavigationBox
    is visible in High Contrast Mode.
  */
  .bg-neutral-700[role="progressbar"] {
    background-color: ButtonFace !important;
    border: 1px solid ButtonText !important;
  }

  .bg-neutral-700[role="progressbar"] > .bg-green-400 {
    background-color: Highlight !important;
    border: none !important;
  }
}
\`\`\`

**Key System Colors to Use:**

-   `Canvas`: The application background.
-   `CanvasText`: The text color.
-   `LinkText`: The color for links.
-   `Highlight`: The background color of selected items.
-   `HighlightText`: The text color of selected items.
-   `ButtonFace`: The background color of buttons.
-   `ButtonText`: The text color on buttons.

Always prefer using these system keywords over hardcoded colors inside a `forced-colors` media query.
