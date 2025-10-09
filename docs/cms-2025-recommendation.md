# CMS Recommendation for New Era Hockey (2025)

**Client Need**: WordPress-like experience for non-technical users to edit copy & assets
**Current Stack**: React + Vite + Static hosting
**Previous Research**: Decap CMS explored but needs 2025 update

---

## 🎯 Top 3 Recommendations (Easy → Advanced)

### 1. **Sveltia CMS** ⭐ RECOMMENDED
**Best For**: Drop-in Netlify/Decap CMS replacement with modern UX

#### ✅ Why Choose This
- **WordPress-like UI**: Beautiful admin panel, drag-drop images, markdown editor
- **Zero Backend**: Git-based (commits to GitHub)
- **Lightning Fast**: <300 KB vs Decap's 1.5 MB
- **Drop-in Replacement**: One-line code change from Decap CMS
- **Mobile Support**: Edit content from phone/tablet
- **Active Development**: Solving 260+ issues from Decap, v1.0 early 2026

#### 📦 Setup (15 minutes)
```bash
# 1. Install
npm install @sveltia/cms

# 2. Create admin interface
# public/admin/index.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>New Era Hockey Admin</title>
</head>
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
</body>
</html>

# 3. Configure content structure (use existing Decap config.yml)
# public/admin/config.yml
backend:
  name: git-gateway
  branch: main

media_folder: "public/assets"
public_folder: "/assets"

collections:
  - name: "content"
    label: "Site Content"
    files:
      - label: "Home Page"
        name: "home"
        file: "src/data/home.json"
        fields:
          - {label: "Hero Title", name: "heroTitle", widget: "string"}
          - {label: "Hero Text", name: "heroText", widget: "text"}
          - {label: "Hero Image", name: "heroImage", widget: "image"}

      - label: "Core Values"
        name: "coreValues"
        file: "src/data/coreValues.js"
        fields:
          - label: "Values"
            name: "coreValues"
            widget: "list"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Description", name: "description", widget: "text"}
              - {label: "Icon", name: "icon", widget: "select", options: ["Flame", "Dumbbell", "Trophy"]}
              - {label: "Gradient", name: "gradient", widget: "string"}

  - name: "testimonials"
    label: "Testimonials"
    folder: "src/data/testimonials"
    create: true
    fields:
      - {label: "Name", name: "name", widget: "string"}
      - {label: "Role", name: "role", widget: "string"}
      - {label: "Text", name: "text", widget: "text"}
      - {label: "Image", name: "image", widget: "image", required: false}

  - name: "gallery"
    label: "Gallery Images"
    folder: "src/data/gallery"
    create: true
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Description", name: "description", widget: "text"}
      - {label: "Image", name: "image", widget: "image"}
      - {label: "Category", name: "category", widget: "select", options: ["Training", "Events", "Players"]}

# 4. Deploy to Netlify
# - Enable Identity service
# - Enable Git Gateway
# - Invite client as user

# 5. Access admin
https://yourdomain.com/admin
```

#### 💰 Cost
- **FREE** (open source)
- Hosting: Netlify free tier works

#### ⚡ Pros
- Fastest setup for your use case
- Already have Decap research → easy migration
- GraphQL API = instant search/filter
- Mobile editing support
- Version control via Git
- No database needed

#### ⚠️ Cons
- Beta (v1.0 early 2026)
- Requires Netlify/similar for Git Gateway auth
- Limited to file-based content

---

### 2. **TinaCMS**
**Best For**: Visual editing with live preview

#### ✅ Why Choose This
- **Visual Editing**: Edit content directly on page
- **Git-Based**: Markdown/JSON in repo
- **GraphQL API**: Type-safe content queries
- **React-Native**: Built for Next.js/React
- **Enterprise Support**: SSW acquired, strong backing

#### 📦 Setup (30 minutes)
```bash
npm install tinacms

# Configure schema in tina/config.ts
# Content stored in content/ folder as Markdown
# GraphQL API auto-generated
```

#### 💰 Cost
- Free tier: 2 users, 1000 API requests/month
- Pro: $29/month (10 users, 100k requests)

#### ⚡ Pros
- Live preview editing
- Strong TypeScript support
- AI chatbot (TinaGPT) for help
- No external dependencies

#### ⚠️ Cons
- More complex setup than Sveltia
- Requires TinaCloud account (or self-host backend)
- Only supports React frameworks

---

### 3. **Payload CMS**
**Best For**: Full control, scalable future-proof solution

#### ✅ Why Choose This
- **Next.js Native**: Built on React Server Components
- **Code-First**: TypeScript config (no GUI lock-in)
- **Full-Featured**: Authentication, file uploads, relationships
- **Self-Hosted**: Complete control
- **MongoDB/Postgres**: Real database

#### 📦 Setup (1-2 hours)
```bash
npx create-payload-app@latest
# Choose Next.js template
# Configure collections in payload.config.ts
```

#### 💰 Cost
- **FREE** (open source)
- Hosting: ~$5-20/month (Vercel + MongoDB Atlas)

#### ⚡ Pros
- Enterprise-ready
- Advanced features (conditional logic, blocks, relationships)
- Full API + Admin UI
- Best for growth/scaling

#### ⚠️ Cons
- Requires backend server
- Steeper learning curve
- Overkill for simple static site

---

## 📊 Comparison Matrix

| Feature | Sveltia CMS | TinaCMS | Payload CMS |
|---------|-------------|---------|-------------|
| **Setup Time** | 15 min | 30 min | 1-2 hours |
| **Backend Required** | ❌ | ⚠️ (TinaCloud) | ✅ |
| **WordPress-like UX** | ✅✅✅ | ✅✅ | ✅✅ |
| **Cost (Free Tier)** | Free | Free (limited) | Free |
| **Mobile Editing** | ✅ | ⚠️ | ✅ |
| **Live Preview** | ❌ | ✅✅✅ | ✅ |
| **File Size** | 300 KB | ~500 KB | N/A (server) |
| **Best For** | Static sites | React apps | Full apps |

---

## 🎯 My Recommendation: **Sveltia CMS**

### Why?
1. **Your Use Case Match**: Static React site with Git workflow
2. **Easy Migration**: Already researched Decap → Sveltia is drop-in replacement
3. **WordPress-like UX**: Client gets familiar editing experience
4. **No Backend Complexity**: No server costs or management
5. **Fast Setup**: 15 minutes vs hours for alternatives
6. **Active Development**: Modern, well-maintained (260+ improvements)

### When to Choose Alternatives?

**Choose TinaCMS if**:
- Need visual in-context editing
- Want live preview
- Budget allows $29/month

**Choose Payload CMS if**:
- Planning complex features (user accounts, e-commerce)
- Need real database
- Want enterprise scalability
- Have dev resources for backend

---

## 🚀 Implementation Plan (Sveltia CMS)

### Phase 1: Setup (1 hour)
- [ ] Create `public/admin/` folder
- [ ] Add `index.html` + `config.yml`
- [ ] Deploy to Netlify
- [ ] Enable Identity + Git Gateway

### Phase 2: Content Migration (2 hours)
- [ ] Convert existing data files to CMS-editable format
- [ ] Configure collections for:
  - Home page content
  - Core values
  - Testimonials
  - Gallery images
  - Events
  - Coach info
  - FAQs
- [ ] Test CRUD operations

### Phase 3: Training (30 min)
- [ ] Create admin user for client
- [ ] Record 5-min tutorial video
- [ ] Document common tasks

### Total Time: ~3.5 hours

---

## 📝 Sample Config for Your Current Structure

```yaml
# public/admin/config.yml
backend:
  name: git-gateway
  branch: main

media_folder: "public/assets/images"
public_folder: "/assets/images"

collections:
  # Existing data files
  - name: "site-content"
    label: "Site Content"
    files:
      - label: "Core Values"
        name: "coreValues"
        file: "src/data/coreValues.js"
        fields:
          - label: "Values"
            name: "coreValues"
            widget: "list"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Description", name: "description", widget: "text"}
              - {label: "Icon", name: "icon", widget: "select", options: ["Flame", "Dumbbell", "Trophy"]}
              - {label: "Gradient", name: "gradient", widget: "string"}

      - label: "Coach Info"
        name: "coachInfo"
        file: "src/data/coachInfo.js"
        fields:
          - {label: "Name", name: "name", widget: "string"}
          - {label: "Bio", name: "bio", widget: "markdown"}
          - {label: "Statement", name: "statement", widget: "text"}
          - {label: "Image", name: "image", widget: "image"}

      - label: "FAQ"
        name: "faqs"
        file: "src/data/faqs.js"
        fields:
          - label: "FAQs"
            name: "faqs"
            widget: "list"
            fields:
              - {label: "Question", name: "question", widget: "string"}
              - {label: "Answer", name: "answer", widget: "text"}

  - name: "testimonials"
    label: "Testimonials"
    folder: "src/data/testimonials"
    create: true
    slug: "{{slug}}"
    fields:
      - {label: "Author", name: "author", widget: "string"}
      - {label: "Role", name: "role", widget: "string"}
      - {label: "Text", name: "text", widget: "text"}
      - {label: "Image", name: "image", widget: "image", required: false}

  - name: "events"
    label: "Events"
    folder: "src/data/events"
    create: true
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Date", name: "date", widget: "datetime"}
      - {label: "Location", name: "location", widget: "string"}
      - {label: "Description", name: "description", widget: "text"}
      - {label: "Price", name: "price", widget: "number"}
      - {label: "Registration Open", name: "registrationOpen", widget: "boolean"}
      - {label: "Image", name: "image", widget: "image"}
```

---

## 🔗 Resources

- [Sveltia CMS GitHub](https://github.com/sveltia/sveltia-cms)
- [Netlify Identity Setup](https://docs.netlify.com/visitor-access/identity/)
- [Git Gateway Config](https://docs.netlify.com/visitor-access/git-gateway/)

---

**Next Steps**:
1. Review this recommendation
2. Confirm hosting platform (Netlify recommended)
3. Schedule 3.5-hour implementation session
4. Train client on new CMS
