# PRD — KEV PatchOps

## 1. Product Summary

**Product:** KEV PatchOps  
**Tagline:** Vulnerability Remediation Command Center

KEV PatchOps is a local, single-page security operations dashboard that helps security teams explore, filter, and prioritize vulnerabilities from the **CISA Known Exploited Vulnerabilities (KEV)** dataset.

The product is not a chatbot. Its primary job is to turn a large KEV dataset into a fast, scannable remediation workspace for analysts.

## 2. Problem Statement

CISA KEV contains valuable information about vulnerabilities known to be exploited, but reviewing the raw dataset directly is inefficient for day-to-day remediation work.

Security analysts often need to answer questions such as:
- Which vulnerabilities are associated with known ransomware use?
- Which items are overdue or approaching their due date?
- Which vendors or products appear most often?
- Which entries require forensic triage?
- What action does CISA require for a specific CVE?

Reading, sorting, and filtering the raw dataset manually creates unnecessary friction and makes prioritization slower.

KEV PatchOps should make this information operational without inventing risk data that is not present in the source dataset.

## 3. Target Users

Primary users:
- Security Analyst
- SOC Analyst
- Vulnerability Management Team
- Security Engineer
- System Administrator

User characteristics:
- Comfortable with CVE/CWE terminology.
- Needs dense information rather than marketing-style presentation.
- Often works with many vulnerability records at once.
- Needs fast search, filtering, prioritization, and remediation context.
- Values accuracy and traceability to source data.

## 4. Dataset

Use the full local dataset:

```text
./dataset/known_exploited_vulnerabilities.json
```

The source dataset directory must remain unchanged.

Use only fields that actually exist. Expected useful fields include:
- `cveID`
- `vendorProject`
- `product`
- `vulnerabilityName`
- `dateAdded`
- `shortDescription`
- `requiredAction`
- `dueDate`
- `knownRansomwareCampaignUse`
- `forensicTriage`
- `notes`
- `cwes`

Do not invent CVSS scores, exploit maturity, affected versions, patch versions, threat actors, ransomware family names, organization asset exposure, or official CISA severity levels unless those values are actually present in the dataset.

## 5. Reference Date

Use a fixed reference date for this capstone:

```text
2026-09-28
```

Clearly label this in the UI as the **Reference Date**.

## 6. Operational Attention Level

KEV PatchOps uses an application-specific classification called **Operational Attention Level**. It is not an official CISA severity or risk score.

### URGENT
```text
knownRansomwareCampaignUse = "Known"
```

### HIGH
```text
knownRansomwareCampaignUse != "Known"
AND
dueDate <= 2026-09-28
```

### PRIORITY
```text
knownRansomwareCampaignUse != "Known"
AND
dueDate > 2026-09-28
```

Precedence:
```text
URGENT > HIGH > PRIORITY
```

## 7. Core Product Requirements

### 7.1 Application Header

Show:
- KEV PatchOps
- Vulnerability Remediation Command Center
- CISA KEV as dataset source
- Reference Date: 28 Sep 2026

Keep the header compact. This is an operational product, not a marketing landing page.

### 7.2 KPI Summary

Calculate from the loaded dataset:
- Total KEV
- Known Ransomware
- Overdue
- Due Soon
- Forensic Triage Required

Definitions:

**Overdue**
```text
dueDate <= reference date
```

**Due Soon**
```text
dueDate > reference date
AND
dueDate <= reference date + 14 days
```

**Forensic Triage Required**
```text
forensicTriage = "Yes"
```

No KPI may be hard-coded.

### 7.3 Operational Attention Overview

Show the distribution of:
- URGENT
- HIGH
- PRIORITY

Requirements:
- exact count
- proportional visual representation
- calculated from full dataset
- never imply official CISA severity

### 7.4 Vendor Exposure

Calculate vendors with the highest number of KEV entries.

Show approximately the top 8 vendors using a compact horizontal comparison visualization built with HTML/CSS.

No external charting library.

### 7.5 Vulnerability Explorer

This is the primary working surface.

Search across:
- CVE
- vendor
- product
- vulnerability name
- CWE

Filters:
- Operational Attention Level
- Ransomware Use
- Forensic Triage
- Vendor

Requirements:
- filters must work together
- search and filters must work together
- show number of matching records
- preserve accurate full-dataset match count
- use pagination or controlled rendering if needed for performance

Table columns:
- CVE
- Vendor
- Product
- Vulnerability
- Due Date
- Ransomware Use
- Forensic Triage
- Operational Attention

Default remediation order:
1. URGENT
2. HIGH
3. PRIORITY

Within the same level, sort by nearest due date first.

### 7.6 Vulnerability Detail

Selecting a vulnerability should open a focused detail panel or drawer.

Display available data:
- CVE ID
- vendor
- product
- vulnerability name
- short description
- CWE
- date added
- due date
- ransomware campaign use
- forensic triage
- Operational Attention Level
- required action
- notes / references

Do not invent missing values.

For missing optional fields, use a restrained label such as:
```text
Not provided
```

Do not display fake placeholder content.

### 7.7 Required Application States

Support:
- loading
- populated
- empty / no results
- error
- edge state

Edge cases include:
- long product names
- missing CWE
- missing notes
- large result counts
- combined filters
- long remediation text

## 8. Technical Scope

Use only:
- HTML5
- CSS3
- vanilla JavaScript

Do not use:
- React
- Vue
- Angular
- frontend frameworks
- backend
- database
- external chart library
- CDN-dependent UI framework

Expected files:
```text
index.html
styles.css
app.js
README.md
```

Keep:
```text
./dataset/
```
unchanged.

## 9. Local Run

Run:
```bash
python -m http.server 8080
```

Open:
```text
http://localhost:8080
```

## 10. Functional Acceptance Criteria

The project is complete when:
- the full KEV dataset loads successfully
- KPI values are computed from data
- Operational Attention Level is calculated correctly
- search returns relevant CVEs
- vendor filtering works
- combined filters work
- result counts remain accurate
- sorting follows remediation priority
- detail view shows source-grounded information
- missing optional fields do not break layout
- empty search state is handled
- dataset load failure is handled
- no JavaScript console errors occur during the main flow

## 11. Product Boundaries

KEV PatchOps is a vulnerability exploration and remediation-support interface.

It must not present itself as:
- an official CISA scoring system
- a vulnerability scanner
- an exploit detection system
- an asset inventory
- an automated patch deployment tool
- a replacement for analyst judgment

The application must remain grounded in the supplied KEV dataset.

## 12. Bob Development Workflow

Use this document as the source of truth for **what must be built**.

Before coding:
1. inspect the current workspace
2. inspect the KEV dataset structure
3. read `DESIGN.md`
4. create a short implementation plan

Then implement the application directly in the current workspace.

Do not rewrite the dataset. Do not add unnecessary infrastructure.

After implementation:
1. run the local app
2. test the required interactions
3. inspect browser console errors
4. compare output against this PRD
5. report completed items and remaining gaps

## 13. Targeted Refinement Rule

Future revisions should be scoped.

If the problem is visual:
```text
revise DESIGN.md / presentation layer only
```

If the problem is functional:
```text
revise the related PRD requirement only
```

Do not redesign the entire product when only one layer has a gap.
