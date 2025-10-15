# Custom CMS Research & Implementation Guide
## New Era Hockey - admin.newerahockeytraining.com

**Research Date:** 2025-10-15
**Purpose:** Evaluate building a custom CMS to replace Sveltia/Netlify CMS with enhanced features and custom UI

---

## Executive Summary

Building a custom CMS for New Era Hockey is feasible with three primary approaches, each offering different trade-offs between cost, timeline, and flexibility:

**🏆 RECOMMENDED: Payload CMS with Custom UI**
- **Cost:** $30,000 - $50,000
- **Timeline:** 2-3 months
- **Best For:** Balanced approach - custom UI with enterprise features and reasonable investment

**Alternatives:**
- **Option 2:** Refine + Custom Backend ($50,000-$150,000, 4-6 months) - Maximum flexibility
- **Option 3:** Enhanced Sveltia/Decap Fork ($5,000-$20,000, 1-2 months) - Budget-conscious

---

## Table of Contents

1. [Current Situation Analysis](#current-situation-analysis)
2. [Requirements & Goals](#requirements--goals)
3. [Technology Research](#technology-research)
4. [Architecture Options](#architecture-options)
5. [Recommended Solution](#recommended-solution)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Cost & Timeline Breakdown](#cost--timeline-breakdown)
8. [Subdomain Deployment Guide](#subdomain-deployment-guide)
9. [Security & Authentication](#security--authentication)
10. [Maintenance & Scaling](#maintenance--scaling)

---

## 1. Current Situation Analysis

### Current Setup: Sveltia CMS (Netlify CMS Successor)

**Strengths:**
- ✅ Git-based workflow (JSON files in repo)
- ✅ Fast, lightweight
- ✅ Free and open-source
- ✅ Framework-agnostic
- ✅ Modern UX with i18n support

**Limitations Identified:**
- ❌ Limited UI customization options
- ❌ Missing specific features you need
- ❌ Built with Svelte (not React) - harder to customize for React developers
- ❌ Constrained by Git-based architecture for certain use cases

### Business Impact

You're managing:
- Contact form submissions (Email Management)
- Coaches profiles
- Testimonials
- Gallery images
- Content pages (Home, About, Contact, etc.)
- Camp photos

**Need:** More control, custom workflows, and admin-specific features not available in Sveltia.

---

## 2. Requirements & Goals

### Functional Requirements

1. **Content Management**
   - CRUD operations for all content types
   - Media management (images, files)
   - Rich text editing
   - Drag-and-drop interfaces
   - Preview functionality

2. **Custom Features (Beyond Sveltia)**
   - Email management system (viewing, replying, status tracking)
   - Advanced filtering and search
   - Bulk operations
   - Custom widgets and field types
   - Workflow automation

3. **User Experience**
   - Modern, intuitive UI
   - Mobile-responsive admin panel
   - Fast performance
   - Custom branding (New Era Hockey theme)

4. **Technical Requirements**
   - React-based (matches your stack)
   - TypeScript support
   - RESTful and/or GraphQL API
   - Self-hosted or cloud-deployable
   - Integration with existing AWS SES email system

### Non-Functional Requirements

- **Security:** Role-based access control, secure authentication
- **Performance:** Fast load times, efficient data handling
- **Scalability:** Support growing content and users
- **Maintainability:** Clean codebase, good documentation
- **Deployment:** Subdomain setup (admin.newerahockeytraining.com)

---

## 3. Technology Research

### 3.1 Frontend Admin Frameworks

#### **Refine (★★★★★ Recommended for Custom Build)**

**Overview:** React-based framework for building admin panels with headless architecture

**Key Features:**
- Hook-based and atomic components (highly customizable)
- Works with ANY UI library (Material UI, Chakra UI, Ant Design, or custom)
- Built-in support for React Router, Next.js, Remix
- Full SSR support
- All enterprise features are open-source (unlike React Admin)
- Integrates with react-query for state management

**Pros:**
- Maximum flexibility and customization
- Modern architecture with hooks
- No UI framework lock-in
- Excellent documentation and community
- Free and open-source

**Cons:**
- Requires backend implementation
- More initial setup than all-in-one solutions
- Steeper learning curve

**Best For:** Teams wanting maximum control and willing to invest in custom backend

---

#### **React Admin**

**Overview:** Mature frontend framework from Marmelabs (5+ years, powers 3,000 apps/month)

**Key Features:**
- Component-based architecture
- Backend agnostic (REST or GraphQL)
- Uses Redux and Redux-Saga
- Only supports Material UI (limitation)

**Pros:**
- Very mature and battle-tested
- Huge community and documentation
- Rich ecosystem of plugins
- Great for rapid development

**Cons:**
- Locked into Material UI
- No real SSR support
- Only React Router support
- Enterprise features are paid

**Best For:** Teams comfortable with Material UI and wanting proven, mature framework

---

#### **AdminJS**

**Overview:** Auto-generated admin panel specifically for Node.js applications

**Key Features:**
- Tight ORM/ODM integration
- Auto-generates admin from database schema
- Built with React
- REST API included

**Pros:**
- Fastest setup with existing Node.js backend
- Automatically picks up validation rules and relationships
- Good for simple CRUD operations

**Cons:**
- No SSR/Next.js support
- Limited customization (lots of boilerplate for custom UI)
- Runs inside your app (shares resources with backend)
- Less flexible than Refine or React Admin

**Best For:** Existing Node.js backends needing quick admin panel

---

### 3.2 Headless CMS Solutions

#### **Payload CMS (★★★★★ RECOMMENDED)**

**Overview:** Modern headless CMS built with Next.js, TypeScript, and React - designed for custom admin panels

**Key Features:**
- Code-first approach with TypeScript
- Built on Next.js 14+ with React
- Highly customizable React admin UI
- Built-in authentication and access control
- GraphQL and REST APIs
- Self-hosted or cloud
- Local API for serverless functions
- Rich text editor with Slate.js

**Pros:**
- **Best-in-class for custom admin panels** (per 2024-2025 research)
- Developer-friendly with full TypeScript support
- Unlimited customization of admin UI
- Modern tech stack (matches your existing React/Vite setup)
- Active development and growing community
- Open-source and free
- Can maintain Git workflow if desired (collections as files)

**Cons:**
- Relatively newer (less mature than Strapi)
- Smaller ecosystem than Strapi
- Requires Node.js backend hosting

**Cost:** Free (open-source), self-hosting ~$20-50/month

**Best For:** Developers wanting maximum control over admin UI with modern tech stack

---

#### **Strapi**

**Overview:** Most popular open-source headless CMS with 5+ years of maturity

**Key Features:**
- React-based admin panel
- Plugin ecosystem
- REST and GraphQL APIs
- Content type builder (visual)
- Role-based access control
- Media library

**Pros:**
- Very mature and widely adopted
- Large plugin ecosystem
- Strong community support
- Enterprise support available
- Good balance of features and customization

**Cons:**
- Admin UI customization more limited than Payload
- Can be heavy for simple use cases
- Some advanced features in Enterprise tier only

**Cost:** Free (Community), Enterprise pricing on request

**Best For:** Teams wanting proven solution with extensive ecosystem

---

#### **KeystoneJS**

**Overview:** Headless CMS and application framework for Node.js

**Key Features:**
- GraphQL-first API
- Flexible schema builder
- Customizable admin UI
- Access control
- Extensible with plugins

**Pros:**
- Simple and extensible
- Good documentation
- Modern GraphQL-first approach
- Clean architecture

**Cons:**
- Smaller community than Strapi
- Less out-of-the-box features
- Steeper learning curve for GraphQL

**Best For:** GraphQL-focused teams wanting framework approach

---

### 3.3 Git-Based CMS Options

#### **Sveltia CMS** (Current)

**Overview:** Netlify CMS successor built with Svelte

**Limitations for Custom UI:**
- Built with Svelte (harder to customize with React)
- Limited extensibility without forking
- Constrained by Git-based architecture

#### **Decap CMS** (formerly Netlify CMS)

**Overview:** Open-source React-based Git CMS

**Customization Options:**
- Extensible with custom React widgets
- Can create custom previews
- Can add custom UI components

**Viability for Custom CMS:**
- Medium - can extend but architecture constraints remain
- Better than Sveltia for React customization
- Still limited compared to headless CMS options

#### **Tina CMS**

**Overview:** Git-based CMS with visual editing

**Key Features:**
- Real-time visual editing
- Git workflow
- React/Next.js focused

**Pros:**
- Modern visual editing experience
- Good for content-heavy sites

**Cons:**
- SaaS model (not fully self-hosted)
- Paid plans for production use

---

## 4. Architecture Options

### Option 1: Payload CMS with Custom UI (★★★★★ RECOMMENDED)

**Architecture:**
```
┌─────────────────────────────────────────┐
│  admin.newerahockeytraining.com         │
│  (Payload CMS Admin - Next.js)          │
│  - Custom React UI components           │
│  - Tailwind CSS (match main site)       │
│  - Custom email management interface    │
│  - Role-based access control            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Payload CMS Backend (Node.js)          │
│  - TypeScript collections               │
│  - Custom endpoints                     │
│  - Built-in authentication              │
│  - MongoDB or PostgreSQL                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  newerahockeytraining.com               │
│  (Main React site - Vite)               │
│  - Fetches content via API              │
│  - Static generation or SSR             │
└─────────────────────────────────────────┘
```

**Implementation Details:**

1. **Admin Panel:**
   - Deploy as separate Next.js app on Netlify
   - Custom React components for all admin views
   - Tailwind CSS with New Era Hockey branding
   - Custom email management dashboard
   - Responsive mobile-friendly interface

2. **Backend:**
   - Self-hosted Payload CMS on Railway, Render, or AWS
   - MongoDB Atlas (free tier) or PostgreSQL
   - Custom collections for coaches, testimonials, emails, etc.
   - AWS SES integration for email system
   - Webhook integration for deployments

3. **Content Delivery:**
   - Main site fetches content from Payload API
   - Can keep JSON files in Git or transition to database
   - Incremental migration possible

**Pros:**
- ✅ Best admin UI customization
- ✅ Modern tech stack (TypeScript, Next.js, React)
- ✅ Code-first approach (developer-friendly)
- ✅ All features open-source
- ✅ Can maintain Git workflow if desired
- ✅ Active development and community

**Cons:**
- ❌ Requires backend hosting ($20-50/month)
- ❌ Database setup and management
- ❌ Migration effort from current Git-based system

**Estimated Cost:** $30,000 - $50,000
**Timeline:** 2-3 months

**Breakdown:**
- Setup & Architecture: 1 week
- Collection Schema Design: 1 week
- Custom Admin UI: 3-4 weeks
- Email Management Features: 2-3 weeks
- Integration with Main Site: 2 weeks
- Authentication & Security: 1 week
- Testing & Deployment: 2 weeks

---

### Option 2: Refine + Custom Backend

**Architecture:**
```
┌─────────────────────────────────────────┐
│  admin.newerahockeytraining.com         │
│  (Refine Admin App - React/Vite)        │
│  - Headless UI (any design system)      │
│  - Custom data providers                │
│  - Full customization freedom           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Custom API (Node.js/Express)           │
│  - RESTful endpoints                    │
│  - Business logic layer                 │
│  - Authentication middleware            │
│  - Database ORM (Prisma/TypeORM)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Database (PostgreSQL/MongoDB)          │
│  - Content storage                      │
│  - User management                      │
│  - Audit logs                           │
└─────────────────────────────────────────┘
```

**Implementation Details:**

1. **Frontend (Refine):**
   - Maximum UI flexibility
   - Choose any UI framework or build custom
   - Hook-based architecture
   - Built-in CRUD operations
   - Real-time updates with react-query

2. **Backend (Custom):**
   - Build REST API with Node.js/Express
   - Or use Fastify for better performance
   - Prisma ORM for type-safe database access
   - Custom business logic
   - Full control over data models

3. **Authentication:**
   - Integrate Clerk or Supabase Auth
   - JWT-based auth
   - Role-based access control
   - Session management

**Pros:**
- ✅ **Maximum flexibility and control**
- ✅ No framework constraints
- ✅ Modern React patterns (hooks)
- ✅ All features free and open-source
- ✅ Can use any UI library
- ✅ Excellent TypeScript support

**Cons:**
- ❌ **Highest development cost**
- ❌ Longest timeline
- ❌ More maintenance burden
- ❌ Backend development from scratch
- ❌ No built-in CMS features

**Estimated Cost:** $50,000 - $150,000
**Timeline:** 4-6 months

**Breakdown:**
- Backend API Development: 6-8 weeks
- Database Schema & Migrations: 2 weeks
- Admin UI with Refine: 4-6 weeks
- Custom Features: 4-6 weeks
- Authentication & Authorization: 2-3 weeks
- Testing & QA: 3-4 weeks
- Deployment & DevOps: 2 weeks

**Best For:** Teams with budget and time for maximum customization and long-term control

---

### Option 3: Enhanced Sveltia/Decap Fork

**Architecture:**
```
┌─────────────────────────────────────────┐
│  admin.newerahockeytraining.com         │
│  (Forked Sveltia/Decap - React)         │
│  - Add custom React widgets             │
│  - Extended field types                 │
│  - Custom previews                      │
│  - Enhanced UI components               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  GitHub Repository                      │
│  - JSON files in src/data/              │
│  - Git-based workflow maintained        │
│  - Netlify Functions for backend logic  │
└─────────────────────────────────────────┘
```

**Implementation Details:**

1. **Fork Strategy:**
   - Fork Decap CMS (React-based, easier than Sveltia)
   - Add custom React components
   - Extend with custom widgets
   - Add missing features as plugins

2. **Custom Features:**
   - Build custom email management widget
   - Add enhanced filtering and search
   - Custom field types for your use cases
   - Improved media management

3. **Limitations:**
   - Still constrained by Git-based architecture
   - Harder to add complex features (like email threading)
   - Performance limitations with large JSON files
   - Merge conflicts if multiple admins editing

**Pros:**
- ✅ Lowest cost option
- ✅ Shortest timeline
- ✅ Maintains Git workflow
- ✅ Familiar architecture
- ✅ No backend hosting needed

**Cons:**
- ❌ Limited by base architecture
- ❌ Complex features harder to implement
- ❌ Git merge conflicts with multiple editors
- ❌ Performance issues with large datasets
- ❌ Fork maintenance burden

**Estimated Cost:** $5,000 - $20,000
**Timeline:** 1-2 months

**Breakdown:**
- Fork setup & evaluation: 1 week
- Custom widget development: 2-3 weeks
- UI enhancements: 2 weeks
- Feature additions: 2-3 weeks
- Testing: 1 week

**Best For:** Budget-conscious projects with simpler feature requirements

---

## 5. Recommended Solution

### 🏆 Winner: Payload CMS with Custom UI

**Why Payload CMS?**

1. **Perfect Balance:**
   - Customizable admin UI (unlike Strapi's constraints)
   - Enterprise CMS features out-of-the-box (unlike custom builds)
   - Reasonable cost and timeline (unlike Option 2)
   - Modern tech stack matching your expertise

2. **Technical Alignment:**
   - Built with React, TypeScript, Next.js (familiar stack)
   - Code-first approach (developer-friendly)
   - Customizable without forking (unlike Sveltia)
   - Self-hosted control (unlike SaaS options)

3. **Feature Richness:**
   - Built-in authentication & RBAC
   - Flexible content modeling
   - Rich text editor
   - Media management
   - Webhooks & API access
   - Local API for serverless integration

4. **Future-Proof:**
   - Active development (updated 2024-2025)
   - Growing community
   - Modern architecture
   - Scalable as needs grow

5. **Best for Custom Admin Panels:**
   - Research confirms: "Payload CMS has emerged as the leading solution for developers seeking a powerful, flexible platform to build custom admin panels"
   - Focus on admin UX matches your needs

---

## 6. Implementation Roadmap

### Phase 1: Setup & Foundation (Week 1-2)

**Week 1: Environment Setup**
- [ ] Create new repository: `newhockey-admin`
- [ ] Initialize Payload CMS project with Next.js 14
- [ ] Setup MongoDB Atlas (free tier) or PostgreSQL
- [ ] Configure TypeScript and linting
- [ ] Setup Tailwind CSS with New Era Hockey theme
- [ ] Configure environment variables
- [ ] Setup development environment

**Week 2: Database & Architecture**
- [ ] Design database schema for all content types
- [ ] Create Payload collections:
  - Coaches
  - Testimonials
  - Gallery Images
  - Camp Photos
  - Email Submissions
  - Users (admin accounts)
- [ ] Setup authentication with Payload's built-in auth
- [ ] Configure access control rules
- [ ] Create seed data for development

**Deliverable:** Working Payload CMS instance with basic collections

---

### Phase 2: Admin UI Customization (Week 3-6)

**Week 3-4: Core Admin Interface**
- [ ] Customize Payload admin theme
  - New Era Hockey branding
  - Tailwind CSS integration
  - Custom color scheme (teal/dark theme)
  - Responsive layout
- [ ] Create custom dashboard
  - Welcome screen
  - Quick stats
  - Recent activity
- [ ] Build collection list views
  - Custom table layouts
  - Filtering and sorting
  - Bulk actions
  - Search functionality

**Week 5-6: Custom Components**
- [ ] Build custom field components
  - Rich media fields
  - Enhanced image upload with preview
  - Custom relationship fields
- [ ] Create custom cell components for lists
- [ ] Add custom validation logic
- [ ] Build preview functionality

**Deliverable:** Fully branded admin interface with custom components

---

### Phase 3: Email Management System (Week 7-9)

**Week 7: Email Dashboard**
- [ ] Create custom email management collection view
- [ ] Build email list with status filters (NEW, VIEWED, RESPONDED)
- [ ] Add email detail view
  - Display sender info
  - Show message thread
  - Format timestamps
- [ ] Implement status updates

**Week 8: Reply Functionality**
- [ ] Build reply composer interface
- [ ] Integrate with AWS SES (existing setup)
- [ ] Add email threading display
- [ ] Implement attachment handling (if needed)
- [ ] Add reply templates feature

**Week 9: Advanced Features**
- [ ] Add search and filtering
  - By sender
  - By date range
  - By status
- [ ] Implement bulk operations
  - Mark as read/unread
  - Archive emails
  - Delete multiple
- [ ] Add email notifications for new submissions

**Deliverable:** Complete email management system integrated with AWS SES

---

### Phase 4: Integration with Main Site (Week 10-11)

**Week 10: API Integration**
- [ ] Create API endpoints for main site
  - Public content endpoints (coaches, testimonials, etc.)
  - Webhook endpoints for deployment triggers
- [ ] Add API authentication for main site
- [ ] Implement caching strategy
- [ ] Setup CORS configuration

**Week 11: Content Migration**
- [ ] Build migration scripts from JSON to database
- [ ] Migrate existing content:
  - Coaches profiles
  - Testimonials
  - Gallery images
  - Contact page content
  - Home page content
- [ ] Update main site to fetch from API
- [ ] Test content updates and deployment flow

**Deliverable:** Main site integrated with new CMS

---

### Phase 5: Security & Authentication (Week 12)

**Week 12: Security Hardening**
- [ ] Configure role-based access control
  - Admin role
  - Editor role (if needed)
  - View-only role (if needed)
- [ ] Setup two-factor authentication (2FA)
- [ ] Implement session management
- [ ] Add audit logging
- [ ] Security testing
  - SQL injection prevention
  - XSS protection
  - CSRF protection
- [ ] Rate limiting on APIs
- [ ] Configure backup strategy

**Deliverable:** Secure, production-ready admin system

---

### Phase 6: Deployment & Testing (Week 13-14)

**Week 13: Subdomain Deployment**
- [ ] Setup backend hosting
  - Railway.app (~$20/month) OR
  - Render.com (~$25/month) OR
  - AWS/DigitalOcean (~$30-50/month)
- [ ] Configure MongoDB Atlas production cluster
- [ ] Deploy admin frontend to Netlify
- [ ] Configure DNS:
  - Create CNAME: admin.newerahockeytraining.com → Netlify
  - Update backend DNS settings
- [ ] Setup SSL certificates
- [ ] Configure environment variables in production

**Week 14: Testing & Launch**
- [ ] End-to-end testing
  - User authentication flow
  - Content CRUD operations
  - Email management workflow
  - API integration
- [ ] Performance testing
  - Load times
  - API response times
  - Database query optimization
- [ ] User acceptance testing
  - Admin creates content
  - Admin manages emails
  - Content appears on main site
- [ ] Bug fixes and polish
- [ ] Documentation:
  - Admin user guide
  - Developer documentation
  - Deployment procedures

**Deliverable:** Live, production-ready CMS at admin.newerahockeytraining.com

---

### Phase 7: Training & Handoff (Week 15)

**Week 15: Knowledge Transfer**
- [ ] Admin user training
  - Content management workflows
  - Email management system
  - Media upload procedures
- [ ] Create video tutorials
- [ ] Developer handoff documentation
- [ ] Maintenance procedures
- [ ] Backup and recovery guide
- [ ] Troubleshooting guide

**Deliverable:** Fully trained team and comprehensive documentation

---

## 7. Cost & Timeline Breakdown

### Payload CMS Recommended Approach

**Development Costs:**

| Phase | Duration | Estimated Hours | Cost Range (@$100-150/hr) |
|-------|----------|-----------------|---------------------------|
| Setup & Foundation | 2 weeks | 60-80 hours | $6,000 - $12,000 |
| Admin UI Customization | 4 weeks | 120-150 hours | $12,000 - $22,500 |
| Email Management | 3 weeks | 80-100 hours | $8,000 - $15,000 |
| Main Site Integration | 2 weeks | 50-70 hours | $5,000 - $10,500 |
| Security & Auth | 1 week | 30-40 hours | $3,000 - $6,000 |
| Deployment & Testing | 2 weeks | 60-80 hours | $6,000 - $12,000 |
| Training & Handoff | 1 week | 20-30 hours | $2,000 - $4,500 |
| **TOTAL** | **15 weeks** | **420-550 hours** | **$42,000 - $82,500** |

**Realistic Estimate:** $50,000 - $60,000 for quality implementation

---

**Ongoing Costs (Monthly):**

| Service | Purpose | Cost |
|---------|---------|------|
| Backend Hosting | Railway/Render/AWS | $20-50 |
| MongoDB Atlas | Database (free tier → paid) | $0-57 |
| Domain & SSL | Admin subdomain | Included |
| Backup Storage | Database backups | $5-10 |
| **TOTAL** | | **$25-117/month** |

**Average: $40-60/month** with free tiers

---

### Comparison with Other Options

| Approach | Development Cost | Timeline | Monthly Cost |
|----------|-----------------|----------|--------------|
| **Payload CMS (Recommended)** | $50,000 - $60,000 | 3 months | $40-60 |
| Refine + Custom Backend | $100,000 - $150,000 | 6 months | $50-100 |
| Enhanced Sveltia Fork | $15,000 - $25,000 | 2 months | $0 |
| Keep Sveltia (Current) | $0 | 0 | $0 |

---

## 8. Subdomain Deployment Guide

### Architecture for admin.newerahockeytraining.com

```
┌──────────────────────────────────────────┐
│ admin.newerahockeytraining.com           │
│ (Netlify Site #2)                        │
│ - Payload CMS Admin UI (Next.js)         │
│ - Separate git repository                │
│ - Independent deployment pipeline        │
└──────────────────────────────────────────┘
                    ↓ HTTPS API Calls
┌──────────────────────────────────────────┐
│ api.newerahockeytraining.com             │
│ (Railway/Render/AWS)                     │
│ - Payload CMS Backend (Node.js)          │
│ - MongoDB/PostgreSQL database            │
│ - REST & GraphQL APIs                    │
└──────────────────────────────────────────┘
                    ↓ Webhooks
┌──────────────────────────────────────────┐
│ newerahockeytraining.com                 │
│ (Netlify Site #1 - existing)             │
│ - React/Vite main site                   │
│ - Fetches content from API               │
│ - Triggered rebuild on content changes   │
└──────────────────────────────────────────┘
```

---

### Step-by-Step Deployment Process

#### Step 1: Backend Deployment (Railway Example)

**1.1 Create Railway Project:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to GitHub repo
railway link
```

**1.2 Configure Environment:**
```bash
# Set environment variables in Railway dashboard
DATABASE_URI=mongodb+srv://...
PAYLOAD_SECRET=your-secret-key
ADMIN_EMAIL=admin@newerahockeytraining.com
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

**1.3 Deploy:**
```bash
railway up
# Railway provides URL: https://newerahockey-admin-production.up.railway.app
```

#### Step 2: Admin Frontend Deployment (Netlify)

**2.1 Create New Netlify Site:**
1. Push admin repo to GitHub
2. Go to Netlify Dashboard
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub repo: `newhockey-admin`
5. Configure build:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Framework: Next.js

**2.2 Configure Environment Variables:**
```bash
# In Netlify: Site settings → Environment variables
NEXT_PUBLIC_API_URL=https://api.newerahockeytraining.com
NEXT_PUBLIC_SITE_URL=https://admin.newerahockeytraining.com
```

**2.3 Deploy:**
- Netlify auto-deploys on git push
- Provides temporary URL: `newhockey-admin.netlify.app`

#### Step 3: Configure Custom Subdomain

**3.1 Setup in Netlify:**
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter: `admin.newerahockeytraining.com`
4. Netlify provides DNS record:
   ```
   Type: CNAME
   Name: admin
   Value: newhockey-admin.netlify.app
   ```

**3.2 Configure DNS (at domain registrar):**

**If using Netlify DNS (full domain):**
```
Type: CNAME
Name: admin
Value: newhockey-admin.netlify.app
TTL: 3600
```

**If using external DNS (Cloudflare, GoDaddy, etc.):**
```
Type: CNAME
Name: admin
Value: newhockey-admin.netlify.app
TTL: 3600 (or automatic)
```

**3.3 SSL Configuration:**
- Netlify automatically provisions Let's Encrypt SSL
- Wait 5-30 minutes for DNS propagation
- SSL certificate auto-renews

#### Step 4: API Subdomain (Optional but Recommended)

**Setup api.newerahockeytraining.com:**

**4.1 In Railway (or hosting provider):**
- Add custom domain in settings
- Railway provides DNS target

**4.2 Add DNS Record:**
```
Type: CNAME
Name: api
Value: [Railway provided URL]
TTL: 3600
```

---

### DNS Configuration Summary

**Complete DNS Setup:**

```
# Main site (existing)
newerahockeytraining.com → Netlify Site #1

# Admin subdomain (new)
admin.newerahockeytraining.com → Netlify Site #2

# API subdomain (new, optional)
api.newerahockeytraining.com → Railway/Render/AWS

# Email (existing)
@ → MX records for email service
_dmarc → DMARC policy
_amazonses → SES verification
```

---

### Deployment Workflow

**Development:**
```bash
# Local development
npm run dev
# Admin UI: http://localhost:3000
# API: http://localhost:3001
```

**Staging (Optional):**
```bash
# Create staging branch
git checkout -b staging

# Deploy to staging subdomain
# staging-admin.newerahockeytraining.com
```

**Production:**
```bash
# Merge to main branch
git checkout main
git merge develop
git push origin main

# Auto-deploys to:
# - admin.newerahockeytraining.com
# - api.newerahockeytraining.com
```

---

### Benefits of Subdomain Architecture

**Separation of Concerns:**
- ✅ Admin and main site are isolated
- ✅ Different deployment pipelines
- ✅ Independent scaling
- ✅ Separate security boundaries

**Flexibility:**
- ✅ Can use different tech stacks
- ✅ Different hosting providers
- ✅ Independent updates
- ✅ Easier to maintain

**Security:**
- ✅ Admin isolated from public site
- ✅ Can restrict admin subdomain by IP (optional)
- ✅ Different authentication systems
- ✅ Reduced attack surface

**Performance:**
- ✅ No admin code in main bundle
- ✅ Separate caching strategies
- ✅ Optimized for different use cases

---

## 9. Security & Authentication

### Authentication Strategy

#### Option 1: Payload Built-in Auth (Recommended)

**Features:**
- JWT-based authentication
- Built into Payload CMS
- Email/password or OAuth
- Session management
- Password reset flows
- Two-factor authentication (2FA)

**Implementation:**
```typescript
// payload.config.ts
import { buildConfig } from 'payload/config';

export default buildConfig({
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- New Era Hockey Admin',
      ogImage: '/assets/admin-og.jpg',
    },
  },
  collections: [
    {
      slug: 'users',
      auth: {
        tokenExpiration: 7200, // 2 hours
        verify: true, // Email verification
        maxLoginAttempts: 5,
        lockTime: 600 * 1000, // 10 minutes
        cookies: {
          secure: true,
          sameSite: 'strict',
        },
      },
      access: {
        read: ({ req: { user } }) => !!user, // Must be logged in
        create: () => false, // Only manually create users
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      fields: [
        {
          name: 'role',
          type: 'select',
          options: ['admin', 'editor', 'viewer'],
          defaultValue: 'editor',
          required: true,
        },
      ],
    },
  ],
});
```

---

#### Option 2: Clerk (Third-Party Auth)

**Features:**
- Modern authentication platform
- Beautiful pre-built UI components
- Social OAuth (Google, GitHub, etc.)
- Multi-tenancy support
- User management dashboard

**Pricing:**
- Free tier: Up to 5,000 monthly active users
- Pro: $25/month

**Integration:**
```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

#### Option 3: Supabase Auth

**Features:**
- Open-source authentication
- Email/password, magic links, OAuth
- Row-level security
- Free tier generous

**Pricing:**
- Free tier: Unlimited MAU
- Pro: $25/month (for extra features)

---

### Security Best Practices

**1. Access Control:**
```typescript
// Role-based access control example
export const Collections = {
  coaches: {
    access: {
      read: () => true, // Public
      create: ({ req: { user } }) => user?.role === 'admin',
      update: ({ req: { user } }) => ['admin', 'editor'].includes(user?.role),
      delete: ({ req: { user } }) => user?.role === 'admin',
    },
  },
  emails: {
    access: {
      read: ({ req: { user } }) => !!user, // Authenticated only
      create: () => true, // Public form submissions
      update: ({ req: { user } }) => user?.role === 'admin',
      delete: ({ req: { user } }) => user?.role === 'admin',
    },
  },
};
```

**2. API Security:**
- JWT tokens with short expiration
- HTTPS only (enforced)
- CORS configuration for specific origins
- Rate limiting (100 requests/minute)
- API key rotation
- Request validation with Zod or Yup

**3. Database Security:**
- Encrypted connections (SSL/TLS)
- Principle of least privilege
- Regular backups
- No sensitive data in logs
- Environment variable encryption

**4. Application Security:**
- XSS protection (React escapes by default)
- CSRF tokens
- Content Security Policy (CSP)
- Secure headers (Helmet.js)
- SQL injection prevention (Prisma/Mongoose)

**5. Operational Security:**
- Two-factor authentication (2FA) required for admins
- Strong password requirements
- Session timeout (2 hours)
- Audit logging (who did what when)
- Failed login attempt monitoring
- Regular security updates

**6. Subdomain Security:**
- Separate admin from public site
- Optional: Restrict admin subdomain by IP whitelist
- Use different authentication systems
- Isolate admin database credentials

---

### Security Checklist

**Before Launch:**
- [ ] Enable HTTPS only (force redirect)
- [ ] Configure CORS properly
- [ ] Setup rate limiting
- [ ] Enable 2FA for admin accounts
- [ ] Configure session timeouts
- [ ] Setup audit logging
- [ ] Implement CSP headers
- [ ] Test authentication flows
- [ ] Verify access control rules
- [ ] Setup monitoring and alerts
- [ ] Configure backup strategy
- [ ] Review all environment variables
- [ ] Scan for known vulnerabilities (npm audit)
- [ ] Perform security audit
- [ ] Setup incident response plan

---

## 10. Maintenance & Scaling

### Ongoing Maintenance Tasks

**Daily:**
- Monitor error logs
- Check email submissions
- Review user activity

**Weekly:**
- Database backup verification
- Security updates check
- Performance monitoring review

**Monthly:**
- Dependency updates
- Security audit
- Database optimization
- Backup restoration test
- Cost review

**Quarterly:**
- Feature roadmap review
- User feedback analysis
- Performance optimization
- Security penetration testing

---

### Scaling Considerations

**Database Scaling:**

| Users | Monthly Content Updates | Database Size | Recommended |
|-------|-------------------------|---------------|-------------|
| 1-5 | < 1,000 | < 1 GB | MongoDB Atlas Free Tier |
| 5-10 | 1,000 - 10,000 | 1-10 GB | MongoDB Atlas M10 ($57/mo) |
| 10+ | > 10,000 | > 10 GB | MongoDB Atlas M30+ ($250+/mo) |

**Backend Scaling:**

| Traffic | Requests/min | Recommended Hosting |
|---------|--------------|---------------------|
| Low | < 100 | Railway Hobby ($20/mo) |
| Medium | 100 - 1,000 | Render Pro ($25/mo) |
| High | > 1,000 | AWS/DO ($50-200/mo) |

**Content Delivery:**

- Use CDN for media files (Cloudflare, AWS CloudFront)
- Implement caching strategy (Redis)
- Optimize images (Next.js Image optimization)
- Use static site generation where possible

---

### Support & Updates

**Support Channels:**
- **Payload CMS:** GitHub issues, Discord community
- **Netlify:** Support tickets, documentation
- **Hosting:** Provider-specific support

**Update Strategy:**
- Minor updates: Monthly
- Security patches: Immediately
- Major version upgrades: Quarterly (with testing)

---

## 11. Conclusion & Next Steps

### Summary

**Recommended Solution:** Payload CMS with Custom UI
- **Best balance** of features, cost, and timeline
- **Modern tech stack** (React, TypeScript, Next.js)
- **Customizable** admin interface
- **Reasonable investment** ($50k-60k, 3 months)

### Decision Matrix

| Factor | Weight | Payload CMS | Refine + Custom | Sveltia Fork |
|--------|--------|-------------|-----------------|--------------|
| Customization | 25% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Cost | 20% | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Timeline | 20% | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Features | 20% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Maintenance | 15% | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **TOTAL** | 100% | **4.55/5** | **3.45/5** | **3.9/5** |

---

### Immediate Next Steps

**1. Validation Phase (Week 1-2):**
- [ ] Review this research document
- [ ] Confirm budget ($50k-60k range)
- [ ] Confirm timeline (3 months)
- [ ] List specific custom features needed
- [ ] Identify must-have vs nice-to-have features
- [ ] Review subdomain deployment approach

**2. Planning Phase (Week 3-4):**
- [ ] Create detailed feature specifications
- [ ] Design database schema
- [ ] Create UI/UX mockups for custom admin
- [ ] Define user roles and permissions
- [ ] Plan migration strategy from current CMS
- [ ] Setup development environment

**3. Development Phase (Week 5-16):**
- [ ] Follow 15-week implementation roadmap
- [ ] Weekly check-ins and demos
- [ ] Iterative feedback and adjustments

**4. Launch Phase (Week 17+):**
- [ ] User training
- [ ] Content migration
- [ ] Go-live checklist
- [ ] Post-launch monitoring

---

### Questions to Answer

**Before proceeding:**
1. What specific features are missing in Sveltia that you need?
2. What level of customization do you need for the UI?
3. Are you comfortable with monthly hosting costs ($40-60)?
4. Do you have budget for initial development ($50k-60k)?
5. Is 3-month timeline acceptable?
6. How many admin users will access the system?
7. Do you need version control / content history?
8. Do you need workflow/approval processes?
9. What's your long-term content growth projection?
10. Do you need multi-language support?

---

### Alternative Path: Incremental Approach

**If budget/timeline is a concern:**

**Phase 1:** Keep Sveltia, Build Email Management Separately ($10k-15k, 1 month)
- Build standalone email management app with Refine
- Deploy to admin.newerahockey.com
- Keep Sveltia for content at /admin path
- Add email management at /admin/emails

**Phase 2:** Migrate Content to Payload CMS Later (3-6 months out)
- Spread cost over time
- Prove value with email management first
- Full migration when ready

This gives you custom email management immediately while deferring full CMS migration.

---

## Appendix

### A. Technology Stack Details

**Frontend:**
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- React Hook Form (forms)
- React Query (data fetching)
- Radix UI (primitives)
- Lucide Icons (icons)

**Backend:**
- Payload CMS 2.x
- Node.js 18+
- MongoDB or PostgreSQL
- Express.js
- GraphQL (optional)

**DevOps:**
- Railway/Render (hosting)
- MongoDB Atlas (database)
- Netlify (frontend)
- GitHub Actions (CI/CD)
- Sentry (error tracking)

---

### B. Resources & Documentation

**Payload CMS:**
- Docs: https://payloadcms.com/docs
- GitHub: https://github.com/payloadcms/payload
- Discord: https://discord.com/invite/payload

**Refine:**
- Docs: https://refine.dev/docs
- GitHub: https://github.com/refinedev/refine
- Discord: https://discord.gg/refine

**React Admin:**
- Docs: https://marmelab.com/react-admin/
- GitHub: https://github.com/marmelab/react-admin

**Deployment:**
- Railway: https://railway.app/docs
- Netlify: https://docs.netlify.com
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

---

### C. Glossary

- **Headless CMS:** Backend-only CMS that provides content via API
- **Git-based CMS:** Stores content in Git repository as files
- **RBAC:** Role-Based Access Control
- **JWT:** JSON Web Token (authentication)
- **SSR:** Server-Side Rendering
- **API-first:** Designed with API as primary interface
- **Self-hosted:** Run on your own infrastructure
- **Code-first:** Define schema in code vs GUI

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Author:** Claude Code Research Team
**Contact:** For questions or clarifications about this research

---

**Next Steps:** Review this document and let's discuss your specific feature requirements and timeline preferences!
