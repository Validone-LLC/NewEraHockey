# Netlify CMS Setup Guide for New Era Hockey

**Domain**: newerahockey.validone-llc.com
**Platform**: Netlify
**CMS**: Sveltia CMS (Netlify/Decap CMS successor)

---

## ✅ Implementation Complete

The following files have been added to your project:

```
public/admin/
├── index.html      # CMS admin interface
└── config.yml      # CMS configuration

src/data/
├── testimonials/   # CMS-managed testimonials (new)
├── gallery/        # CMS-managed gallery images (new)
└── camp-photos/    # CMS-managed camp photos (new)
```

---

## 🚀 Deployment Steps (Post-Implementation)

### Step 1: Commit and Push Changes

```bash
# From your project directory
git add .
git commit -m "Add Sveltia CMS admin interface

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin NEH-3
```

### Step 2: Merge to Main Branch (if applicable)

If deploying from `main` or `master` branch:

```bash
# Create PR or merge directly
git checkout main
git merge NEH-3
git push origin main
```

**Important**: Update `public/admin/config.yml` line 2 to match your deployment branch:

```yaml
backend:
  branch: main # Change from NEH-3 to main
```

### Step 3: Enable Netlify Identity

1. **Go to Netlify Dashboard**
   - Site: newerahockey.validone-llc.com
   - Navigate to: **Site Settings → Identity**

2. **Enable Identity Service**
   - Click "Enable Identity"
   - Wait for activation (~30 seconds)

3. **Configure Registration**
   - **Registration preferences**: `Invite only` (recommended)
   - **External providers**: Optional (Google, GitHub, etc.)
   - **Email confirmations**: Enable for security

### Step 4: Enable Git Gateway

1. **In Netlify Identity settings**
   - Scroll to "Services" section
   - Click "Enable Git Gateway"
   - This allows CMS to commit changes to your repo

2. **GitHub Access**
   - Netlify will request GitHub repo access
   - Approve the connection

### Step 5: Invite Admin User(s)

1. **Go to**: Identity tab in Netlify dashboard
2. **Click**: "Invite users"
3. **Enter email**: Client's email address
4. **Send invitation**

**User receives**:

- Email with "Accept Invitation" link
- Creates password on first login
- Gets admin access to CMS

### Step 6: Access CMS Admin

**Admin URL**: `https://newerahockey.validone-llc.com/admin`

**First Login**:

1. Go to admin URL
2. Click "Log in with Netlify Identity"
3. Enter email/password
4. Access CMS dashboard

---

## 📝 How to Use the CMS (Client Training)

### Editing Existing Content

1. **Go to**: `https://newerahockey.validone-llc.com/admin`
2. **Log in** with Netlify Identity
3. **Click** on collection (e.g., "Site Content" → "Core Values")
4. **Edit** text, upload images, modify fields
5. **Click** "Save"
6. **Click** "Publish" (changes commit to GitHub)
7. **Wait** ~2-3 minutes for auto-deployment

### Adding New Content

**Example: Add Testimonial**

1. Click "Testimonials" collection
2. Click "New Testimonial"
3. Fill in fields:
   - ID: Auto-increment number
   - Author Name
   - Role
   - Testimonial Text
   - Upload image (optional)
   - Featured checkbox
4. Click "Save" → "Publish"

**Example: Add Gallery Image**

1. Click "Gallery Images"
2. Click "New Gallery Image"
3. Upload image
4. Fill description/alt text
5. Select category (players/camps/behind-scenes)
6. Check "Featured" if needed
7. Save → Publish

### Uploading Images

- **Drag & drop** images into image fields
- **Or click** to browse files
- Supported: JPG, PNG, WebP, SVG
- Images saved to: `public/assets/images/`

### Content Organization

| Collection             | What It Controls         |
| ---------------------- | ------------------------ |
| **Core Values**        | Home page values section |
| **Coach Information**  | Coach Will page content  |
| **FAQs**               | Contact page questions   |
| **Gallery Categories** | Gallery page categories  |
| **Privacy Policy**     | Legal page sections      |
| **Terms & Conditions** | Legal page sections      |
| **Testimonials**       | Testimonials page items  |
| **Gallery Images**     | Gallery page photos      |
| **Camp Photos**        | Home page carousel       |

---

## 🔧 Configuration Details

### Media Storage

- **Folder**: `public/assets/images/`
- **Public URL**: `/assets/images/`
- All uploaded images stored in Git repo

### Publishing Mode

- **Current**: `simple` (immediate publish)
- **Alternative**: `editorial_workflow` (draft → review → publish)

To enable draft workflow, change `config.yml`:

```yaml
publish_mode: editorial_workflow
```

### Branch Configuration

**Current**: `NEH-3` (your dev branch)
**Production**: Change to `main` after merge

Update `public/admin/config.yml`:

```yaml
backend:
  branch: main # or master, depending on your default branch
```

---

## 🛡️ Security Best Practices

### User Management

- **Invite only**: Never enable open registration
- **Minimum users**: Only add necessary admins
- **Remove access**: Delete users when no longer needed

### Access Control

1. **Review users regularly**: Netlify Identity tab
2. **Monitor commits**: Check GitHub for unexpected changes
3. **Enable 2FA**: Recommend for all admin users

### Backup Strategy

- **Git history**: All changes version-controlled
- **Rollback**: Use Git to revert bad changes
- **Manual backup**: Export data files periodically

---

## 🐛 Troubleshooting

### "Unable to access Netlify Identity"

**Solution**:

1. Check Identity is enabled in Netlify dashboard
2. Verify email confirmation was completed
3. Clear browser cache and retry

### "Error loading config.yml"

**Solution**:

1. Check file exists: `public/admin/config.yml`
2. Verify YAML syntax (use YAML validator)
3. Check file is committed to Git

### "Cannot save/publish changes"

**Solution**:

1. Verify Git Gateway is enabled
2. Check GitHub connection in Netlify
3. Ensure user has Identity access
4. Check browser console for errors

### "Images not uploading"

**Solution**:

1. Check image size (max 10MB recommended)
2. Verify media folder path in config
3. Check file format (JPG/PNG/WebP)
4. Ensure sufficient storage in Git repo

### "Changes not appearing on site"

**Solution**:

1. Wait 2-3 minutes for deployment
2. Check Netlify deploy log for errors
3. Clear browser cache (Ctrl+Shift+R)
4. Verify branch in config matches deploy branch

---

## 📊 Monitoring

### Check Deployment Status

1. **Netlify Dashboard** → "Deploys"
2. **Look for**: Green checkmark = success
3. **Check logs**: Click deploy for details

### Verify CMS Changes

1. **GitHub repo** → Commits
2. **Look for**: "Update [collection]" commits
3. **Author**: netlify-cms-backend

---

## 🔄 Workflow Summary

```
Client edits content in CMS
         ↓
Clicks "Save" → "Publish"
         ↓
CMS commits to GitHub
         ↓
Netlify detects commit
         ↓
Auto-build triggered
         ↓
Site deploys (~2-3 min)
         ↓
Changes live on newerahockey.validone-llc.com
```

---

## 📞 Support

### For Technical Issues

- **Developer**: Review this guide
- **Netlify Docs**: https://docs.netlify.com/visitor-access/identity/
- **Sveltia CMS**: https://github.com/sveltia/sveltia-cms

### For Content Editing Help

- **Admin URL**: https://newerahockey.validone-llc.com/admin
- **Training**: Provide client with video walkthrough
- **Documentation**: Share this guide's "How to Use" section

---

## ✨ Next Steps After Setup

### Immediate (Post-Deployment)

- [ ] Verify `/admin` URL loads
- [ ] Test login with invited user
- [ ] Edit one piece of content
- [ ] Confirm changes appear on site

### Training

- [ ] Record 5-minute video tutorial
- [ ] Walk client through common tasks
- [ ] Share this documentation

### Ongoing

- [ ] Monitor first few edits
- [ ] Address any user questions
- [ ] Adjust config based on feedback

---

## 🎯 Key Benefits for Client

✅ **WordPress-like experience** - Familiar editing interface
✅ **No coding required** - Point-and-click editing
✅ **Safe changes** - Version control via Git
✅ **Mobile editing** - Edit from phone/tablet
✅ **Free forever** - No monthly CMS costs
✅ **Fast updates** - Changes live in minutes

---

## 📁 Files Modified in This Implementation

```
✅ Created:
- public/admin/index.html
- public/admin/config.yml
- src/data/testimonials/.gitkeep
- src/data/gallery/.gitkeep
- src/data/camp-photos/.gitkeep
- docs/netlify-cms-setup.md (this file)

⚠️ No existing files modified
⚠️ No breaking changes
```

---

**Implementation Date**: 2025-01-XX
**CMS Version**: Sveltia CMS (latest from CDN)
**Deployment**: Netlify
**Domain**: newerahockey.validone-llc.com
