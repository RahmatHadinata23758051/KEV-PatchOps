# DESIGN — KEV PatchOps

## 1. Design Intent

KEV PatchOps should feel like a **real security operations workstation**, not an AI-generated dashboard and not a SaaS marketing page.

The interface should be:
- utilitarian
- data-dense
- calm under high information load
- technically credible
- fast to scan
- visually restrained
- intentionally structured

The primary design reference is the task of a security analyst working through many vulnerability records.

Do not design around generic reusable cards. Design around the workflow.

## 2. Core Visual Direction

Use an **industrial / operational security interface**.

Dark mode is intentional here because the product context is a SOC-style analyst workstation.

However:
- no cyberpunk aesthetic
- no neon glow
- no matrix imagery
- no decorative terminal effects
- no hacker cliché visuals

The product should look closer to professional infrastructure tooling than to a cybersecurity landing page.

## 3. Anti-AI-Slop Rules

The following are prohibited unless functionally justified.

### Do not use

- purple / violet / indigo as the default accent
- purple-to-blue gradients
- blue-to-cyan gradients
- gradient text
- glassmorphism
- blur-heavy floating surfaces
- neon glow
- decorative blobs or waves
- oversized rounded cards
- cards wrapping every section
- nested cards
- colored left borders used only as decoration
- giant icons above section headings
- emoji as icons
- fake browser / terminal / IDE chrome
- decorative AI illustrations
- generic hero sections
- marketing feature grids
- fake testimonials
- fake metrics
- generic copy such as "Unlock insights" or "Power your workflow"
- excessive pill-shaped controls
- excessive shadows
- perfectly uniform spacing everywhere
- arbitrary animation added to make the product feel "premium"

If removing a border, radius, background, or shadow does not reduce meaning or interaction clarity, the element probably does not need to be a card.

## 4. Design Principle

Use:
```text
80% proven product patterns
20% product-specific character
```

The distinctive 20% should come from:
- compact analyst-oriented composition
- strong technical typography
- disciplined semantic status treatment
- useful microcopy
- thoughtful table/detail interactions

Not from decoration.

## 5. Color System

Use CSS design tokens. Do not scatter raw color values throughout components.

Suggested token roles:
```css
--bg
--surface-1
--surface-2
--surface-hover
--text-primary
--text-secondary
--text-muted
--border
--accent
--urgent
--high
--priority
--success
--focus
```

### Palette behavior

Neutrals should dominate approximately 80–90% of the screen.

Use one restrained accent for selected / interactive emphasis.

Semantic colors are reserved for meaning:
- URGENT
- HIGH
- PRIORITY
- success / confirmation
- error

Do not use semantic colors as decoration.

Avoid pure black and pure white.

Dark surfaces should use subtle low-contrast borders rather than heavy shadows.

Direction:
- Background: charcoal / near-black neutral
- Surface: slightly elevated neutral
- Primary text: off-white
- Secondary text: cool gray
- Accent: restrained technical blue / cyan-blue or another non-violet accent
- URGENT: red
- HIGH: amber / orange
- PRIORITY: cool blue / neutral-blue

Exact values may be tuned during implementation, but the role system must remain stable.

## 6. Typography

Use a deliberate two-family system.

Preferred:
```text
IBM Plex Sans
IBM Plex Mono
```

If webfont loading is undesirable, provide robust local/system fallbacks.

### IBM Plex Sans

Use for:
- navigation
- labels
- body text
- filters
- buttons
- descriptive content

### IBM Plex Mono

Use for:
- CVE IDs
- CWE IDs
- dates
- counts
- technical values
- compact metadata

Do not use monospace for long descriptions.

### Weight system

Prefer three functional weights:
```text
400 — reading
500 — UI emphasis
600 — headings / important actions
```

Avoid unnecessary 700–900 weights.

### Tracking

- normal body: `0`
- small UI labels: slight positive tracking
- ALL CAPS labels: clear positive tracking
- large Latin headings: slight negative tracking

Do not use decorative italic headings.

Do not mix serif typography into this product.

## 7. Type Scale

Keep the scale compact.

Suggested hierarchy:
```text
Page title: 24–28px
Section title: 16–18px
Body/UI: 13–15px
Table: 12–14px
Metadata: 11–12px
```

Avoid giant 48–80px dashboard headlines.

This is a working interface, not a campaign page.

## 8. Icon System

Use **one icon family only**.

Preferred:
```text
Phosphor Icons
```

Use a consistent outline / regular weight.

Recommended sizes:
```text
16px — table rows, dense inline actions
18–20px — controls, filters, navigation
20–24px — rare section-level action
```

Rules:
- use `currentColor`
- icons are functional, not decorative
- no emoji
- no mixed icon libraries
- no duotone icons in the main product UI
- no oversized icon tiles
- do not place every icon inside a rounded square
- pair ambiguous icons with visible text
- icon-only buttons need accessible labels
- align icon weight visually with nearby text

Icons must not overpower the data.

## 9. Layout

Prioritize task hierarchy over symmetry.

Recommended composition:
```text
Header
↓
Compact KPI strip
↓
Operational overview + vendor exposure
↓
Search / filter toolbar
↓
Primary vulnerability table
↓
Detail drawer / side panel
```

Use:
- sections
- columns
- dividers
- compact toolbars
- data tables
- whitespace

before reaching for cards.

Asymmetry is allowed if it improves hierarchy.

Do not force every section into equal-width boxes.

## 10. Spacing

Use a consistent spacing scale:
```text
4
8
12
16
24
32
```

Dense working areas should favor:
```text
4 / 8 / 12 / 16
```

Larger spacing is reserved for major section separation.

Do not use the same padding and gap for every element.

Grouping should be visible through spacing rhythm.

## 11. Radius

Use restrained radius.

Suggested:
```text
2–4px — dense controls / table treatment
4–6px — panels
6–8px — only where a larger interactive surface benefits
```

Avoid universal `12px`, `16px`, `20px`, or pill-shaped containers.

Pills are acceptable only for:
- compact status labels
- small filter chips
- selected state with clear purpose

## 12. Borders and Elevation

Prefer borders over shadows.

Recommended:
```text
1px subtle border
```

Use stronger borders for:
- selected state
- focus state
- error state
- important separation

Shadows should be minimal and rare.

A drawer or floating popover may use a restrained shadow for spatial separation.

## 13. KPI Treatment

Do not create five large rounded statistic cards.

Prefer a compact KPI strip or structured summary row.

Each KPI should contain:
- label
- value
- optional concise context

Do not add decorative icons unless they improve scanning.

Do not invent percentage changes.

## 14. Operational Attention

URGENT, HIGH, and PRIORITY must be identifiable without relying on color alone.

Use combinations of:
- text label
- semantic color
- icon / marker where useful
- consistent position

Example:
```text
URGENT   ● red
HIGH     ● amber
PRIORITY ● blue
```

Keep badges compact.

Do not turn each status into a large colorful pill.

## 15. Table Design

The vulnerability table is the main product surface.

Priorities:
- density
- alignment
- scanning
- strong CVE visibility
- readable due dates
- restrained status treatment

Rules:
- sticky header if practical
- strong row hover
- clear selected row
- numeric / date data aligned consistently
- use monospace selectively
- truncate very long content in the table, not in detail view
- do not put full remediation text inside table cells
- avoid zebra stripes unless they materially improve scanning
- horizontal scrolling may be used on small screens rather than destroying column meaning

The table must not look like a collection of cards.

## 16. Filters

Filters should feel like analyst tools.

Use:
- compact search field
- select / dropdown controls
- clear active state
- visible reset action when filters are active
- matching result count

Avoid large form sections.

Do not open a modal for basic filtering.

## 17. Detail View

Prefer a right-side drawer or focused side panel on desktop.

The detail view should have:
1. CVE + attention level
2. vendor / product
3. core metadata
4. short description
5. required action
6. notes / references

Long text should have comfortable line length.

Do not place every metadata field in its own card.

Use grouped definition-list style layouts and dividers.

## 18. Motion

Motion is optional.

Only animate when motion clarifies a state change or spatial relationship.

Recommended:
```text
80–150ms — hover / button / selection
150–250ms — drawer / popover / state entry
```

Avoid:
- floating animation
- pulse animation
- glowing animation
- looping decoration
- bounce
- parallax
- long easing sequences

Respect:
```css
@media (prefers-reduced-motion: reduce)
```

## 19. Interaction States

Every data-driven surface should support:
- loading
- populated
- empty
- error
- edge

No-results state should explain that the current query / filters returned no matches.

It should not be a blank table.

Error state should explain:
- what failed
- what the user can do next

## 20. Accessibility

Target practical WCAG 2.2 AA behavior.

Minimum expectations:
- semantic HTML
- keyboard reachable controls
- visible `:focus-visible` styles
- sufficient text contrast
- sufficient non-text control contrast
- labels for form controls
- accessible names for icon buttons
- state is not communicated through color alone
- logical DOM / tab order

Prefer native elements over custom ARIA recreations.

## 21. Responsive Behavior

Primary target:
```text
desktop analyst workstation
```

Secondary target:
```text
tablet
```

Small mobile screens should remain functional but do not need to preserve desktop density.

Rules:
- no broken horizontal page overflow
- table may use controlled horizontal scroll
- toolbars may wrap deliberately
- detail drawer may become full-width
- controls must remain usable
- long CVE/product text must not break layout

## 22. Content Tone

Use concise operational language.

Good:
```text
26 matches
Reset filters
Due in 2 days
Known ransomware use
No results for current filters
```

Avoid:
```text
Unlock powerful insights
Supercharge remediation
Take control of your security journey
Discover vulnerabilities smarter
```

No generic SaaS marketing copy.

## 23. Product-Specific Character

Add small details that make the interface feel intentionally built for vulnerability operations.

Examples:
- compact `CVE` keyboard-search hint
- clear reference date in the header
- result count next to filters
- due-date urgency language
- source-grounded required action
- restrained forensic-triage marker
- clear distinction between dataset-derived values and app-derived Operational Attention

Do not add decorative features just to make the UI memorable.

## 24. Pre-Ship Design Audit

Before declaring the UI finished, inspect it against this checklist.

### Hierarchy
- Is the vulnerability table clearly the main working surface?
- Can the user identify current risk distribution quickly?
- Are important values visible without excessive color?

### Specificity
- Does the UI feel designed for KEV remediation?
- Or could the exact same design be used for a CRM or finance dashboard?

If it could be reused unchanged for another domain, refine it.

### Restraint
- Are there unnecessary cards?
- unnecessary icons?
- unnecessary badges?
- unnecessary gradients?
- unnecessary animations?
- too many accent uses?

Remove them.

### Structural Variety
- Is every section the same rounded rectangle?
- Are spacing and proportions too uniform?

Use sections, dividers, tables, and density shifts instead.

### Typography
- Are CVE IDs and technical values appropriately differentiated?
- Are there more than two font families?
- Are there too many font weights?
- Are small labels readable?

### Icons
- One icon family?
- One weight?
- No emoji?
- No decorative icon tiles?

### States
Verify:
- loading
- populated
- empty
- error
- long values / missing data

### Accessibility
Verify:
- focus
- keyboard use
- contrast
- labels
- color-independent status communication

## 25. Bob Instruction

Before implementing UI:
1. read this file completely
2. inspect the current dataset
3. inspect `PRD.md`
4. choose the simplest structure that satisfies both documents
5. do not introduce a UI framework
6. do not improvise a different visual language halfway through implementation

If a visual choice conflicts with this document, follow `DESIGN.md`.

If a functional requirement conflicts with this document, preserve the functional requirement from `PRD.md` and adapt the presentation without violating the product intent.
