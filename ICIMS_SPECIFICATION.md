# ICIMS — Integrated Church Information Management System
### Centralized Digital Platform for Church & Ministry Operations

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Understanding Church vs Denomination](#understanding-church-vs-denomination)
3. [Package & Subscription Model](#package--subscription-model)
4. [Package → Roles Mapping](#package--roles-mapping)
5. [Registration Flow](#registration-flow)
6. [User Roles & Church Hierarchy](#user-roles--church-hierarchy)
7. [12 Functional Modules](#12-functional-modules)
8. [Key Workflows & Approvals](#key-workflows--approvals)
9. [Technical Specifications](#technical-specifications)
10. [Performance Requirements](#performance-requirements)
11. [Maintenance & Support](#maintenance--support)

---

## System Overview

ICIMS is a **SaaS (Software as a Service)** platform — churches subscribe and get access to modules based on their chosen package. It is **not** just a booking system; it is a full church management ecosystem covering membership, finance, governance, attendance, communication, and performance.

| Pillar | Description |
|---|---|
| Secure & User-Friendly | Role-based access, PCI-compliant payments, encrypted data storage |
| Multi-Level Administration | National → Regional → District → Local congregation hierarchies |
| Transparency & Reporting | Real-time dashboards for giving, revenue, attendance, and performance |
| Member Engagement | Communication portals, Bible study resources, prayer request channels |
| Evidence-Based Leadership | Integrated KPI tracking and performance tools for data-driven decisions |
| Scalable Infrastructure | Cloud-hosted, 5,000+ concurrent users, 99.5% uptime SLA |

---

## Understanding Church vs Denomination

This distinction is critical to how ICIMS works.

### Single Local Church (Basic / Standard Package)
A **single local church** is one congregation in one location — a standalone entity managing its own membership, giving, attendance, and events. It does not have sub-branches or a hierarchical network.

> Example: Blantyre Community Church — one location, one admin, one congregation.

### Denomination (Premium Package)
A **denomination** is **one church body** that has many congregation branches spread across a country or the world, organized under a unified national structure. The denomination is NOT a collection of separate independent churches — all branches belong to the same church identity and are governed under the same leadership hierarchy.

> Example: CCAP (Church of Central Africa Presbyterian) is one church. It has congregations (branches) in every district of Malawi — in the Northern Region, Central Region, Southern Region. Each congregation is a branch of CCAP, not a separate independent church.

> Other examples: The Catholic Church, RCCG (Redeemed Christian Church of God), COGIC, DRCM, Living Waters Church.

The Premium/Denominational package gives the **national headquarters** of a denomination a single account from which they can see and manage all their congregation branches, organized by region and district.

```
ONE DENOMINATION  (e.g., CCAP — one church body)
│
├── NORTHERN REGION
│       ├── Mzimba District
│       │       ├── Ekwendeni Congregation  ← branch of CCAP
│       │       ├── Embangweni Congregation ← branch of CCAP
│       │       └── Mzimba Central Congregation
│       └── Rumphi District
│               └── Rumphi Congregation
│
├── CENTRAL REGION
│       ├── Lilongwe District
│       │       ├── Capital Hill Congregation
│       │       └── Area 25 Congregation
│       └── Kasungu District
│               └── Kasungu Congregation
│
└── SOUTHERN REGION
        ├── Blantyre District
        │       ├── Chilomoni Congregation
        │       └── Limbe Congregation
        └── Zomba District
                └── Zomba Congregation
```

Every congregation in this tree is a **branch of the same denomination** — not a separate church — and all their data (giving, attendance, membership, performance) rolls up to the national dashboard.

---

## Package & Subscription Model

Churches register on ICIMS, choose a package, and pay monthly or annually for access to selected modules.

### Package Tiers

#### 1. Basic Package — Single Local Church
For a single congregation at one location with no branches.

Modules included:
- Membership Management
- Service Attendance Tracking
- Basic Giving Records
- Basic Reports & Dashboards
- Local-level access only (one church, one location)

Roles available: Local Church Admin, Finance Officer, Ministry Leader, Volunteer, Regular Member

> Best for small independent local congregations getting started with digital administration.

---

#### 2. Standard Package — Growing Single Church
For a growing single congregation that needs more tools for events, communication, and finances. Still one location, one congregation.

Everything in Basic, plus:
- Event Management
- Communication Portal (Email/SMS/Push)
- Revenue Management
- Meeting Management & Minutes
- Advanced Reports & Exports

Roles available: Local Church Admin, Finance Officer, Event Coordinator, Ministry Leader, Volunteer, Regular Member

> Best for medium-sized churches with active programmes, growing membership, and more complex operations — still one congregation, one location.

---

#### 3. Premium / Denominational Package — Church Denomination Network
For a **denomination** (one church body) that has congregation branches spread across the country, organized by regions and districts. This is not for managing separate independent churches — it is for managing the branch network of a single denomination.

All 12 modules, plus:
- Full national hierarchy management (National HQ → Regions → Districts → Local Congregations)
- Register and manage unlimited congregation branches under the denomination
- KPI & Performance Management across all branches
- Complete dashboards at national, regional, district, and congregation level
- API integrations (Stripe, PayPal, Mobile Money, Calendar, Accounting)
- Priority 24/7 support
- Dedicated customer success manager

Roles available: National Administrator, Regional Leader, District Overseer, Local Church Admin (per congregation branch), Finance Officer, Event Coordinator, Ministry Leader, Volunteer, Regular Member

> Best for national denominations managing their congregation branch network across regions and districts — one church body, many branches.

---

### Pricing Dimensions

| Dimension | Description |
|---|---|
| Member count | Price scales with number of registered members |
| Number of congregation branches | For denominations with many branches |
| Modules included | Add-on modules available beyond base package |
| Billing cycle | Monthly or annual (annual at a discount) |
| Add-ons | SMS credits, extra storage, third-party integrations |

---

## Package → Roles Mapping

Understanding which roles are available per package prevents confusion during setup.

| Role | Basic | Standard | Premium/Denominational |
|---|---|---|---|
| National Administrator | ✗ | ✗ | ✓ |
| Regional Leader | ✗ | ✗ | ✓ |
| District Overseer | ✗ | ✗ | ✓ |
| Local Church Admin | ✓ | ✓ | ✓ (per branch) |
| Finance Officer | ✓ | ✓ | ✓ |
| Event Coordinator | ✗ | ✓ | ✓ |
| Ministry Leader | ✓ | ✓ | ✓ |
| Volunteer | ✓ | ✓ | ✓ |
| Regular Member | ✓ | ✓ | ✓ |

**Key points:**
- On **Basic or Standard**, the highest role is **Local Church Admin** — managing one church, one location. There is no way to register additional congregation branches or manage a hierarchy.
- On **Premium/Denominational**, the **National Administrator** has full oversight of all congregation branches and can register new branches under the hierarchy. Each branch gets its own **Local Church Admin**.

> If you need to manage more than one congregation location under one church body, you need the **Premium/Denominational package**.

---

## Registration Flow

There are **two registration paths** depending on whether it is a single local church (Basic/Standard) or a denomination managing a branch network (Premium).

---

### Path A — Single Local Church Registration (Basic / Standard)

For a standalone congregation registering one church at one location.

**Step 1 — Create Account**
1. Visit ICIMS platform → Click **Get Started Free**
2. Select account type: **Single Church**
3. Fill in **Church Details**:
   - Church name
   - Denomination / Affiliation (optional — if this congregation is a branch of a larger denomination but the denomination itself is not on ICIMS)
   - Country, Region, District
   - Physical address
   - Church size (approx. member count)
   - Year established
4. Fill in **Administrator Details**:
   - Full name & role (e.g., Senior Pastor, Admin Officer)
   - Email address & phone number
   - Password (min 8 characters, 1 uppercase, 1 number)
5. Select **Package** (Basic / Standard)
6. Accept Terms of Service & Privacy Policy
7. Submit → Email verification sent
8. Verify email → Account activated
10. After trial → Enter payment details to continue

**Step 2 — Configure the Church**
1. Log in to the Local Church Admin dashboard
2. Complete the church profile (logo, banner, service times, contact info)
3. Set up departments and ministries
4. Assign staff roles (Finance Officer, Event Coordinator, Ministry Leader, etc.)
5. Begin importing or registering members

---

### Path B — Denominational Registration (Premium)

For a **denomination** (one church body) that wants to manage all its congregation branches from a central account, organized under a national hierarchy.

> Note: "Denomination" here means one church organisation — e.g., CCAP, Catholic Diocese, RCCG national office — registering their branch network. Each branch is a congregation of the same church, not a separate independent church.

#### Step 1 — Register the Denomination (National Headquarters Account)

1. Visit ICIMS platform → Click **Get Started Free**
2. Select account type: **Denomination / Organisation**
3. Fill in **Denomination Details**:
   - Official denomination name
   - Legal registration number
   - Country of headquarters
   - Estimated number of congregation branches
   - Estimated total membership across all congregations
4. Fill in **National Administrator Details**:
   - Full name & title (e.g., General Secretary, National Director)
   - Official email & phone
   - Password
5. Select **Premium / Denominational Package**
6. Accept Terms of Service & Privacy Policy
7. Submit → Email verification sent
8. Verify email → National Admin account activated
9. ICIMS support team contacts within 1 business day to assist with hierarchy setup

---

#### Step 2 — Set Up the National Hierarchy

The National Administrator configures the denominational structure to match how the church is geographically organised.

**Create Regions**
1. Dashboard → Administration → Regions → **Add Region**
2. Enter region name and geographical area (e.g., Northern Region, Central Region)
3. Assign a Regional Leader (invite by email)
4. Regional Leader receives invitation → accepts → gains access to their regional dashboard

**Create Districts (within each Region)**
1. Dashboard → Regions → Select Region → Districts → **Add District**
2. Enter district name (e.g., Mzimba District, Lilongwe District)
3. Assign a District Overseer (invite by email)
4. District Overseer accepts invitation → gains access to their district dashboard

**Register Congregation Branches (within each District)**

> This is where each individual congregation branch of the denomination is added to the system.

**Option 1 — National Admin or District Overseer registers a congregation directly:**
1. Dashboard → Districts → Select District → Congregations → **Add Congregation**
2. Fill in:
   - Congregation name & branch code (e.g., "CCAP Ekwendeni" / ECK-001)
   - Physical address
   - Senior Pastor / Congregation Leader name
   - Approximate membership size
   - Service days and times
3. Invite the Local Church Admin for that congregation (by email)
4. Local Church Admin receives invite → sets password → logs in to their congregation dashboard

**Option 2 — Congregation registers itself and requests to join the denomination:**
1. Congregation visits ICIMS platform → **Join a Denomination**
2. Searches for the denomination by name or unique denomination code
3. Submits a join request with congregation details
4. District Overseer or National Admin **approves** the request
5. Congregation is linked to the correct district automatically

---

#### Step 3 — Full Hierarchy Structure

```
DENOMINATION ACCOUNT  (National Administrator — e.g., CCAP National HQ)
│
├── REGION: Northern Region  (Regional Leader)
│       ├── DISTRICT: Mzimba  (District Overseer)
│       │       ├── Congregation: Ekwendeni Branch   (Local Church Admin)
│       │       ├── Congregation: Embangweni Branch  (Local Church Admin)
│       │       └── Congregation: Mzimba Central     (Local Church Admin)
│       └── DISTRICT: Rumphi  (District Overseer)
│               └── Congregation: Rumphi Branch      (Local Church Admin)
│
├── REGION: Central Region  (Regional Leader)
│       ├── DISTRICT: Lilongwe  (District Overseer)
│       │       ├── Congregation: Capital Hill Branch (Local Church Admin)
│       │       └── Congregation: Area 25 Branch     (Local Church Admin)
│       └── DISTRICT: Kasungu  (District Overseer)
│               └── Congregation: Kasungu Branch     (Local Church Admin)
│
└── REGION: Southern Region  (Regional Leader)
        ├── DISTRICT: Blantyre  (District Overseer)
        │       ├── Congregation: Chilomoni Branch   (Local Church Admin)
        │       └── Congregation: Limbe Branch       (Local Church Admin)
        └── DISTRICT: Zomba  (District Overseer)
                └── Congregation: Zomba Branch       (Local Church Admin)
```

Every congregation in this tree is a **branch of the same denomination**. Each has its own Local Church Admin managing day-to-day operations, but all data rolls up to the national dashboard for the National Administrator to view across regions and districts.

---

#### Step 4 — Adding More Congregation Branches Over Time

As the denomination grows and plants new congregations:

1. National Admin or District Overseer → Dashboard → **Add New Congregation**
2. Fill in congregation details and assign to the correct district
3. Invite the Local Church Admin for that congregation → they receive an email to set up their account
4. New congregation is immediately visible in the national, regional, and district dashboards
5. The new congregation inherits the denomination's Premium package and all module access

> There is **no limit** to the number of congregation branches that can be added. Pricing adjusts based on the number of active congregations and total registered members.

---

#### Step 5 — Deactivating a Congregation Branch

If a congregation closes or is dissolved by the denomination:
1. National Admin or District Overseer → Congregations → Select Congregation → **Deactivate**
2. The congregation's data is archived (not deleted) for audit and historical purposes
3. The congregation branch loses access to the system

> Since all branches are part of the same denomination, deactivated branches do not continue independently — they remain archived under the denomination's records.

---

### Member Registration (Within a Congregation)

Once a congregation is set up, its members are registered by the Local Church Admin:

1. Admin navigates to **Membership Management**
2. Clicks **Add Member**
3. Fills in member profile:
   - Full name, date of birth, gender
   - Contact details (phone, email, address)
   - Family links (spouse, children)
   - Church role (member, deacon, elder, leader, etc.)
   - Joining date
4. System generates unique **Member ID**
5. Member receives welcome email with portal access credentials
6. Member can log in to view:
   - Their giving history
   - Upcoming events
   - Announcements
   - Bible study materials
   - Prayer requests

---

## User Roles & Church Hierarchy

### Denomination Hierarchy (Premium Package Only)

#### 1. National Level
**National Administrator**
- Full oversight of the entire denomination
- Global dashboards across all regions, districts, and congregations
- Financial and performance reporting at the national level
- Can register new regions, districts, and congregation branches

#### 2. Regional Level
**Regional Leader**
- Manages all congregation branches within their region
- Reviews regional performance, giving, and attendance
- Coordinates multi-district activities within the region

#### 3. District Level
**District Overseer**
- Supervises all congregation branches within their district
- Reviews attendance and giving reports per congregation
- Can register new congregation branches in their district
- Escalates issues to the regional leader

#### 4. Congregation / Local Level
**Local Church Admin**
- Manages membership, services, events, giving, and meeting records for their specific congregation branch
- Day-to-day operational control of one congregation
- Available on all packages (Basic, Standard, Premium)

### All Packages

**Additional Roles (available within any congregation):**

| Role | Access |
|---|---|
| Finance Officer | Giving and Revenue modules for their congregation |
| Event Coordinator | Event Management module |
| Ministry Leader | Their specific ministry or team |
| Volunteer | Assigned tasks and events |
| Regular Member | Personal dashboard — giving history, events, announcements, Bible study |

---

## 12 Functional Modules

### People & Community Modules (01 · 02 · 03)

#### 01. Membership Management
- Member registration and profile creation
- Personal & family profiles
- Role assignment and membership tracking
- Integration with Giving, Events, Attendance, and Performance modules

#### 02. Church Management
- Manage departments, ministries, and leadership structure
- Task and resource allocation
- Ministry performance reports

#### 03. Activity Teams
- Create ministry/volunteer teams
- Task assignment and tracking
- Team attendance and engagement monitoring

---

### Worship & Finance Modules (04 · 05 · 09)

#### 04. Service Attendance Reporting
- Service scheduling
- Attendance recording (manual or automated)
- Real-time dashboards and demographic breakdowns

#### 05. Giving & Donations
- Online and offline giving (tithes, offerings, pledges)
- Donor history and recurring donations
- Automated receipts
- Integration with Revenue Management module

#### 09. Revenue Management
- Consolidated revenue tracking (tithes, offerings, events, grants)
- Automated reconciliation with Giving module
- Real-time dashboards
- Audit trails
- Monthly, quarterly, and annual reports

---

### Communication & Resources Modules (06 · 07 · 08)

#### 06. Communication Portal
- Announcements, newsletters, updates
- Email, SMS & push notifications
- Prayer requests and feedback channels

#### 07. Bible Study Resources
- Digital Bible and devotionals
- Study plans and multimedia resources
- Searchable sermon and lesson library

#### 08. Event Management
- Event creation and scheduling
- Registration and volunteer coordination
- Resource allocation
- Attendance tracking
- Post-event reporting

---

### Administration & Governance Modules (10 · 11 · 12)

#### 10. Church Administration
- Multi-level hierarchy: National → Regional → District → Local Congregation
- Congregation profile creation (location, leader, membership size)
- Integration with all modules
- Hierarchical reporting and visual dashboards

#### 11. Official Church Meetings
- Meeting scheduling and invitations
- Agenda preparation and document attachment
- Minutes recording and archiving
- Action item tracking with reminders

#### 12. Performance Management
- KPI definition and tracking (growth, attendance, giving, outreach)
- Target setting per ministry, leader, or congregation
- Automated measurement using Attendance, Giving, Events, and Revenue data

---

## Key Workflows & Approvals

| Area | Flow |
|---|---|
| **Membership** | Registration → Admin Approval → Role Assignment → Member Portal Access |
| **Events** | Event Proposal → Admin Approval → Public Registration → Event Day Attendance → Post-Event Report |
| **Giving** | Contribution Entry → Automated Acknowledgement → Finance Officer Review → Reconciliation |
| **Revenue** | Collection → Categorisation → Audit Trail → Dashboard Update → Exportable Report |
| **Meetings** | Scheduling → Agenda Distributed → Meeting Held → Minutes Recorded → Approvals → Archived |
| **Performance** | KPI Definition → Data Collection (auto) → Tracking → Monthly Report → Leadership Review |
| **Branch Registration** | National/District Admin registers congregation → Local Admin invited → Admin accepts → Congregation goes live |

---

## Technical Specifications

### Platform
- Web-based (desktop and mobile browsers)
- Optional mobile app (iOS / Android) — future roadmap
- Cloud-hosted or on-premise deployment options

### Database
- MySQL / PostgreSQL
- Encrypted in transit (TLS) and at rest (AES-256)
- Scalable for global church networks

### Security
- Role-based access control (RBAC)
- PCI DSS-compliant payment processing
- Regular automated backups
- Disaster recovery plan

### Reporting & Analytics
- Real-time dashboards for all key domains
- Exportable reports (Excel, PDF)
- Graphical performance visualisation

### Integrations
- **Payments:** Stripe, PayPal, Mobile Money (M-Pesa, Airtel Money)
- **Communication:** Email / SMS service providers
- **Calendar:** Google Calendar, Outlook
- **Accounting:** QuickBooks, Xero (optional)

### User Interface
- Fully responsive design (mobile-first)
- Multi-language support (planned)
- Accessibility features (WCAG 2.1 compliant)

---

## Performance Requirements

| Metric | Target |
|---|---|
| Concurrent Users | 5,000+ |
| Page Load Time | < 2 seconds |
| Uptime SLA | 99.5% |
| Support Availability | 24/7 |

---

## Maintenance & Support

- User manuals and onboarding training (live sessions + video guides)
- 24/7 ticket-based technical support
- Regular software updates and security patches
- Dedicated customer success manager (Premium package)
- Webinars and training sessions for church staff

---

## Summary

| Feature | Value |
|---|---|
| Modules | 12 integrated functional modules |
| Admin Levels | 4-level hierarchical administration (Premium) |
| Analytics | Real-time dashboards and reporting |
| Infrastructure | Secure, scalable cloud platform |
| Workflows | Streamlined approvals across all domains |
| Engagement | Giving, communication, governance, and Bible study tools |

> **ICIMS is built to help churches grow sustainably, maintain accountability, and make data-driven decisions at every level of their denomination.**

---

*Document version 1.1 — ICIMS Platform Specification*
