# KEV PatchOps

**Vulnerability Remediation Command Center**

A local, single-page security operations dashboard for exploring, filtering, and prioritizing vulnerabilities from the CISA Known Exploited Vulnerabilities (KEV) dataset.

---

## Purpose

Security teams deal with hundreds of vulnerability records that need rapid triage and remediation planning. The raw CISA KEV catalog, while authoritative, is not optimized for daily operational use.

KEV PatchOps transforms the KEV dataset into a fast, scannable remediation workspace with:

- Immediate visibility into ransomware-associated vulnerabilities
- Overdue and due-soon deadline tracking
- Combined search and multi-filter exploration
- Detail view with source-grounded remediation guidance
- Application-derived Operational Attention classification

This is not a vulnerability scanner, asset inventory, or automated patch tool. It is a data exploration and remediation-support interface grounded entirely in the supplied CISA KEV dataset.

---

## Target Users

| Role | Primary Use |
|---|---|
| Security Analyst | Prioritize and investigate CVEs |
| SOC Analyst | Triage ransomware and overdue items |
| Vulnerability Management Team | Track remediation deadlines |
| Security Engineer | Review required actions per CVE |
| System Administrator | Identify affected vendor/product exposure |

---

## Dataset

**Source:** CISA Known Exploited Vulnerabilities Catalog  
**File:** `./dataset/known_exploited_vulnerabilities.json` (relative to `langflow/web/index.html`)  
**Catalog version:** 2026.09.27  
**Record count:** 1,728 vulnerabilities

The dataset file must not be modified. All computed values (KPIs, Operational Attention Level, vendor counts, etc.) are derived at runtime from the source JSON.

---

## Reference Date

```
2026-09-28
```

All due-date calculations (Overdue, Due Soon) use this fixed reference date.

---

## Operational Attention Level

KEV PatchOps applies an application-specific classification called **Operational Attention Level**. This is **not** an official CISA severity rating, score, or risk assessment.

### URGENT

```
knownRansomwareCampaignUse = "Known"
```

### HIGH

```
knownRansomwareCampaignUse ≠ "Known"
AND dueDate ≤ 2026-09-28
```

### PRIORITY

```
knownRansomwareCampaignUse ≠ "Known"
AND dueDate > 2026-09-28
```

**Precedence:** URGENT > HIGH > PRIORITY

The vulnerability table defaults to this remediation order, with nearest due date first within each level.

---

## KPI Definitions

| KPI | Definition |
|---|---|
| Total KEV | Count of all records in the dataset |
| Known Ransomware | `knownRansomwareCampaignUse = "Known"` |
| Overdue | `dueDate ≤ 2026-09-28` |
| Due Soon | `dueDate > 2026-09-28` AND `dueDate ≤ 2026-10-12` (14-day window) |
| Forensic Triage Required | `forensicTriage = "Yes"` |

No KPI values are hard-coded.

---

## File Structure

```
langflow/web/                  ← application root (serve from here)
├── index.html                 ← single-page application shell
├── styles.css                 ← light workstation design and layout
├── app.js                     ← existing data logic, charts, and rendering
├── README.md
└── dataset/
    └── known_exploited_vulnerabilities.json   ← unchanged source data
```

---

## Local Run Instructions

### Prerequisites

- Python 3 installed (for the built-in HTTP server)
- No internet connection required. IBM Plex Sans / Mono are used when installed locally, with system font fallbacks. Icons are inline SVG.

### Start the server

From `langflow/web` (where `index.html` lives):

```bash
python -m http.server 8080
```

### Open in browser

```
http://localhost:8080
```

> **Important:** The application fetches the dataset via `fetch()`. It must be served over HTTP — opening `index.html` directly as a `file://` URL will fail due to browser CORS restrictions on local file requests.

---

## Features

- **Application header** with product name, tagline, dataset source, and reference date
- **KPI strip** with dynamically computed totals
- **Operational Attention overview** with a single proportional distribution bar, counts, and percentages
- **KEV activity** with an SVG line chart of monthly `dateAdded` counts for the latest 12 calendar months in the dataset; missing months count as zero, and the last month may be partial
- **Vendor exposure** showing top 8 vendors by record count
- **Search** across CVE ID, vendor, product, vulnerability name, and CWE
- **Filters** for Attention Level, Ransomware Use, Forensic Triage, and Vendor — combinable
- **Result count** updates as filters change
- **Vulnerability table** with pagination (50 rows per page), default remediation sort
- **Detail drawer** with all available source fields; missing optional fields shown as "Not provided"
- **Loading / error / empty states** for all conditions
- **Keyboard accessible** — table rows navigable with Enter/Space, Escape closes drawer, focus returns to the selected row, and keyboard focus stays within an open drawer

---

## Technology

- HTML5
- CSS3 (custom properties for design tokens)
- Vanilla JavaScript (ES2020, no frameworks)
- IBM Plex Sans / IBM Plex Mono (local fonts with system fallbacks)
- Inline outline SVG icons and data-derived charts

No build step required.
