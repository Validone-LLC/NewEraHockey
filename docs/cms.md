# CMS Solutions for New Era Hockey React App

## Option 2: Decap CMS (Formerly Netlify CMS) - Recommended ⭐

### Why This Is Best for You
- Free, open-source
- Beautiful admin UI (like WordPress)
- Works with your existing React app
- No backend needed
- GitHub integration
- Your friend can edit without touching code

### Setup Steps

**1. Install Decap CMS**
```bash
npm install decap-cms-app
```

**2. Create Admin Interface**
```
public/
└── admin/
    ├── index.html
    └── config.yml
```

**`public/admin/index.html`**
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Era Hockey Admin</title>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

**`public/admin/config.yml`**
```yaml
backend:
  name: git-gateway
  branch: main

media_folder: "public/assets/images"
public_folder: "/assets/images"

collections:
  - name: "pages"
    label: "Pages"
    files:
      - label: "Home Page"
        name: "home"
        file: "src/content/home.json"
        fields:
          - {label: "Hero Title", name: "heroTitle", widget: "string"}
          - {label: "Hero Subtitle", name: "heroSubtitle", widget: "string"}
          - {label: "Hero Image", name: "heroImage", widget: "image"}
          - label: "Core Values"
            name: "coreValues"
            widget: "list"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Description", name: "description", widget: "text"}
              - {label: "Image", name: "image", widget: "image"}
          - {label: "About Text", name: "aboutText", widget: "markdown"}
      
      - label: "Coach Will"
        name: "coach"
        file: "src/content/coach.json"
        fields:
          - {label: "Name", name: "name", widget: "string"}
          - {label: "Bio", name: "bio", widget: "markdown"}
          - {label: "Photo", name: "photo", widget: "image"}
          - label: "Certifications"
            name: "certifications"
            widget: "list"
            fields:
              - {label: "Title", name: "title", widget: "string"}
              - {label: "Description", name: "description", widget: "text"}

  - name: "testimonials"
    label: "Testimonials"
    folder: "src/content/testimonials"
    create: true
    fields:
      - {label: "Client Name", name: "name", widget: "string"}
      - {label: "Role", name: "role", widget: "string"}
      - {label: "Testimonial", name: "text", widget: "text"}
      - {label: "Rating", name: "rating", widget: "number", min: 1, max: 5}
      - {label: "Photo", name: "photo", widget: "image", required: false}

  - name: "events"
    label: "Events"
    folder: "src/content/events"
    create: true
    fields:
      - {label: "Event Name", name: "name", widget: "string"}
      - {label: "Date", name: "date", widget: "datetime"}
      - {label: "Description", name: "description", widget: "text"}
      - {label: "Location", name: "location", widget: "string"}
      - {label: "Price", name: "price", widget: "number"}
      - {label: "Image", name: "image", widget: "image"}
      - {label: "Registration Open", name: "registrationOpen", widget: "boolean"}
```

**3. Add Authentication (GitHub OAuth)**

Deploy to Netlify and enable Identity service:
```bash
# In Netlify Dashboard:
# 1. Enable Identity
# 2. Enable Git Gateway
# 3. Invite your friend as user
```

**4. Access Admin Panel**
```
https://yourdomain.com/admin
```

### Your Friend's Workflow
1. Go to `yourdomain.com/admin`
2. Log in with their email
3. Edit content in WordPress-like interface
4. Click "Publish"
5. Site auto-deploys in 2-3 minutes

### Pros
- ✅ WordPress-like interface
- ✅ Image upload with drag-and-drop
- ✅ Markdown editor
- ✅ No coding required
- ✅ Free
- ✅ Git version control

### Cons
- ❌ Requires Netlify hosting (or alternative setup)
- ❌ Initial setup needed

---


1. **Start with Decap CMS** - Best balance of features and ease
2. **Set up GitHub repo** - If not already done
3. **Deploy to Netlify** - Takes 5 minutes
4. **Configure Identity** - Enable Git Gateway
5. **Invite your friend** - Send them the admin URL
6. **Create a quick tutorial video** - Show them how to edit

Would you like me to create a detailed setup guide for Decap CMS specific to your project structure?