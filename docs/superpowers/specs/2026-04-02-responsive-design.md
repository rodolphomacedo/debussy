# Responsive Design Spec

Make all screens responsive for mobile (< 640px), tablet (640-1023px), and desktop (1024px+).

## Strategy

- Desktop-down: add responsive overrides without breaking existing desktop layout
- Use Tailwind responsive classes (`sm:`, `md:`, `lg:`) where possible
- Use `@media` queries in global.css for components using inline styles (PracticeScreen)
- Mobile-first defaults where new classes are added

## Breakpoints

| Label   | Tailwind | Width     |
|---------|----------|-----------|
| Mobile  | default  | < 640px   |
| Tablet  | `sm:`    | 640-1023px|
| Desktop | `lg:`    | 1024px+   |

## Screen-by-screen changes

### NavBar
- **Mobile**: Hide MIDI status text (show only dot). Logo: icon only, hide "Debussy" text. Nav items: reduce gap. Settings button stays.
- **Tablet**: MIDI status shows shortened text. Full logo.
- **Desktop**: No changes.

### HomeScreen
- **Mobile**: Cards `grid-cols-1`, padding `p-6`, gap `gap-6`, icons 48px. Piano height `h-32`. Section padding `px-4 py-4`.
- **Tablet**: Cards `grid-cols-2`, third card spans full or centers. Padding `p-8`.
- **Desktop**: `grid-cols-3`, `p-10`, `gap-10` (current).

### SelectionScreen
- **Mobile**: Stack vertically — piece list full-width, preview below full-width. Remove `w-96` sidebar. Start button full-width.
- **Tablet**: Two columns, preview sidebar `w-64`.
- **Desktop**: Current layout with `w-96`.

### ConfigScreen
- **Mobile**: Stack vertically: title, dial (200px), toggles, hand selection, start button. All centered, full-width button.
- **Tablet**: Dial centered, toggles + hands in a 2-col row below.
- **Desktop**: Current horizontal layout.

### PracticeScreen (inline styles -> @media in CSS)
- **Mobile**: Keyboard height 140px. Play button 40px. Title font smaller. Score area margin reduced.
- **Tablet**: Keyboard 170px. Play button 46px.
- **Desktop**: Current (208px keyboard, 50px button).

### CaptureScreen
- **Mobile**: Right sidebar (Volume/Reverb/Sustain) becomes horizontal bar between score and controls. Controls bar buttons stack or shrink. Piano height `h-36`. Header padding reduced.
- **Tablet**: Sidebar stays but narrower. Piano `h-44`.
- **Desktop**: Current layout.

### ResultsScreen
- **Mobile**: Hide golden roses decoration. Stats table: hide "Details" column. Action buttons stack vertically. Grade circle smaller (w-20 h-20). Padding reduced.
- **Tablet**: Full table. Buttons horizontal. Roses at reduced opacity.
- **Desktop**: Current layout.

### SettingsPanel
- **Mobile**: Full-width (`w-full`) instead of `w-80`.
- **Tablet+**: Current `w-80`.

## Files to modify

1. `src/components/NavBar.tsx`
2. `src/components/HomeScreen.tsx`
3. `src/components/SelectionScreen.tsx`
4. `src/components/ConfigScreen.tsx`
5. `src/components/PracticeScreen.tsx`
6. `src/components/CaptureScreen.tsx`
7. `src/components/ResultsScreen.tsx`
8. `src/components/SettingsPanel.tsx`
9. `src/styles/global.css` (PracticeScreen media queries)

## Testing

- Build must pass (`npm run build`)
- All existing tests must pass (`npm test`)
- Add viewport-aware tests for key responsive behaviors (card count, hidden elements)
