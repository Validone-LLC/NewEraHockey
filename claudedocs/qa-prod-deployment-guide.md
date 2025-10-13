# QA/Production Deployment Strategy for New Era Hockey

**Research Date**: 2025-10-13
**Project**: newerahockey
**Current Setup**: Feature branches → master (production)
**Goal**: Implement QA testing environment before production deployment

---

## 📋 Executive Summary

**All Questions Answered:**

1. ✅ **QA Branch Strategy**: Create persistent `qa` branch with feature → qa → master workflow
2. ✅ **Netlify Configuration**: FREE tier supports unlimited branch deploys
3. ✅ **Custom Subdomain**: YES, `test.newerahockeytraining.com` is possible (requires DNS configuration)

**Cost**: $0/month on Netlify Free tier (sufficient for current project needs)

---

## 🌳 Git Branching Strategy

### Recommended: Three-Branch Strategy

```
master (prod)     ←─── qa (staging)     ←─── feature branches (NEH-*)
    ↓                      ↓                        ↓
Production          QA Testing              Active Development
newerahockeytraining.com   test.newerahockeytraining.com   Deploy previews
```

### Branch Purposes

| Branch | Purpose | Deployment | Merge Policy |
|--------|---------|------------|--------------|
| `master` | Production environment | Auto-deploy to prod domain | Only from `qa` after approval |
| `qa` | QA/testing environment | Auto-deploy to test subdomain | From feature branches |
| `NEH-*` | Feature development | Deploy previews | Short-lived, merge to `qa` |

### Workflow Steps

1. **Create Feature**: `git checkout -b NEH-19` from `qa`
2. **Develop**: Work on feature, commit regularly
3. **Merge to QA**: PR to `qa` branch → auto-deploys to test.newerahockeytraining.com
4. **Test**: Verify functionality on QA environment
5. **Merge to Prod**: PR from `qa` → `master` → auto-deploys to production
6. **Cleanup**: Delete feature branch after merge

---

## ⚙️ Netlify Configuration

### Step 1: Create QA Branch

```bash
# From master branch
git checkout master
git pull origin master

# Create and push qa branch
git checkout -b qa
git push -u origin qa
```

### Step 2: Enable Branch Deploys in Netlify

1. **Navigate to**: Site settings → Build & deploy → Continuous deployment
2. **Find**: "Branches and deploy contexts" section
3. **Click**: "Configure"
4. **Select**: "Let me add individual branches"
5. **Add**: `qa` branch name
6. **Save**: Configuration

**Result**: Netlify will now auto-deploy the `qa` branch to a URL like: `qa--newerahockeytraining.netlify.app`

### Step 3: Configure Custom Subdomain (Optional)

#### Option A: Using Netlify DNS (Recommended)

**Requirements**: Domain must use Netlify DNS

1. **Navigate to**: Domain management → Automatic deploy subdomains
2. **Click**: "Edit custom domains"
3. **Find**: "Branch deploys" section
4. **Click**: "Add custom domain"
5. **Select**: Your custom domain
6. **Enter**: Subdomain prefix: `test`
7. **Save**: Configuration

**Result**: QA branch deploys to `test.newerahockeytraining.com` automatically

**Netlify will**:
- Generate wildcard DNS records automatically
- Provision SSL certificates for the subdomain
- Route `test.newerahockeytraining.com` → qa branch deployment

#### Option B: External DNS Provider

**If using external DNS** (GoDaddy, Cloudflare, etc.):

1. **Add CNAME Record**:
   - **Name**: `test`
   - **Value**: `qa--newerahockeytraining.netlify.app`
   - **TTL**: 3600 (or auto)

2. **In Netlify**: Site settings → Domain management → Custom domains
   - Add domain: `test.newerahockeytraining.com`
   - Verify DNS configuration

**Note**: Automatic deploy subdomains feature requires Netlify DNS. Manual CNAME requires updating for each branch name change.

---

## 💰 Cost Analysis

### Netlify Free Tier (Starter Plan)

**Included**:
- ✅ Unlimited static sites
- ✅ **Unlimited branch deploys** (no extra cost!)
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automated SSL certificates
- ✅ Deploy previews for PRs
- ✅ Custom domains

**Current Project Usage**:
- Build time: ~10 seconds
- 300 minutes = ~1,800 builds/month (highly sufficient)
- Estimated bandwidth: <10GB/month (well under limit)

**Conclusion**: **FREE tier is sufficient** for QA + Production setup

### ⚠️ Important Warnings

1. **Bandwidth Overage**: Netlify charges automatically if you exceed 100GB
   - Monitor: Site settings → Analytics → Bandwidth usage
   - Current project unlikely to hit this limit

2. **Build Minutes**: 300/month should be plenty
   - ~60 builds per branch per month at 10s each
   - Monitor: Site settings → Deploys → Build minutes

3. **No Credit Card Required**: Can use free tier without payment info

---

## 🔧 Environment Variables Configuration

### Branch-Specific Variables

Netlify supports different env var values per deploy context:

1. **Navigate to**: Site settings → Environment variables
2. **For each variable**:
   - Set **Production** value (master branch)
   - Set **Branch deploy** value (qa branch)
   - Set **Deploy Preview** value (feature branches)

**Common Use Cases**:
```bash
# Production (master)
API_URL=https://api.newerahockeytraining.com
ANALYTICS_ID=prod-123
DEBUG_MODE=false

# QA (qa branch)
API_URL=https://api-staging.newerahockeytraining.com
ANALYTICS_ID=qa-456
DEBUG_MODE=true

# Deploy Previews (feature branches)
API_URL=https://api-dev.newerahockeytraining.com
ANALYTICS_ID=preview-789
DEBUG_MODE=true
```

---

## 📝 Implementation Checklist

### Phase 1: Git Setup
- [ ] Create `qa` branch from `master`
- [ ] Push `qa` branch to GitHub
- [ ] Update team workflow documentation
- [ ] Consider branch protection rules (require PR reviews)

### Phase 2: Netlify Configuration
- [ ] Enable branch deploys for `qa` in Netlify settings
- [ ] Verify qa branch auto-deploys successfully
- [ ] Test default URL: `qa--newerahockeytraining.netlify.app`

### Phase 3: Custom Subdomain (Optional)
- [ ] Verify DNS provider (Netlify DNS vs external)
- [ ] Configure automatic deploy subdomain OR CNAME record
- [ ] Wait for DNS propagation (up to 48 hours, usually <1 hour)
- [ ] Verify SSL certificate provisioned
- [ ] Test: `test.newerahockeytraining.com`

### Phase 4: Environment Variables (If Needed)
- [ ] Identify environment-specific variables
- [ ] Configure Production values (master)
- [ ] Configure Branch deploy values (qa)
- [ ] Test variable values in each environment

### Phase 5: Team Workflow
- [ ] Document new workflow for team
- [ ] Update PR templates if applicable
- [ ] Establish QA approval process
- [ ] Train team on new branch strategy

---

## 🚀 Recommended Workflow

### For Feature Development

```bash
# 1. Create feature branch from qa
git checkout qa
git pull origin qa
git checkout -b NEH-20-new-feature

# 2. Develop and commit
git add .
git commit -m "Add new feature"
git push -u origin NEH-20-new-feature

# 3. Create PR to qa branch (not master!)
# → GitHub: Create pull request NEH-20 → qa
# → Netlify: Auto-creates deploy preview

# 4. After PR approval, merge to qa
# → Netlify: Auto-deploys to test.newerahockeytraining.com

# 5. Test on QA environment
# → Visit test.newerahockeytraining.com
# → Verify functionality, run tests

# 6. If QA passes, create PR: qa → master
# → GitHub: Create pull request qa → master
# → After approval and merge, Netlify deploys to production

# 7. Cleanup
git branch -d NEH-20-new-feature
git push origin --delete NEH-20-new-feature
```

### For Hotfixes

```bash
# Option 1: Follow normal workflow (recommended)
qa → test → master

# Option 2: Emergency hotfix (use sparingly)
# Create from master, merge to master, then backport to qa
git checkout master
git checkout -b hotfix-critical-bug
# ... fix and test locally ...
git push -u origin hotfix-critical-bug
# PR to master, then merge qa from master to sync
```

---

## 📊 Monitoring & Maintenance

### What to Monitor

1. **Build Minutes Usage**
   - Location: Netlify Dashboard → Team overview
   - Alert threshold: >200 minutes used

2. **Bandwidth Usage**
   - Location: Site settings → Analytics
   - Alert threshold: >75GB

3. **Deploy Success Rate**
   - Location: Site deploys tab
   - Monitor for failing builds

4. **Branch Staleness**
   - Delete feature branches after merge
   - Review `qa` branch regularly for sync with `master`

### Quarterly Review

- Review branch strategy effectiveness
- Assess if free tier still sufficient
- Update documentation as needed
- Gather team feedback on workflow

---

## 🔗 Useful Resources

**Netlify Documentation**:
- [Branch Deploys](https://docs.netlify.com/deploy/deploy-types/branch-deploys/)
- [Automatic Deploy Subdomains](https://docs.netlify.com/manage/domains/manage-domains/automatic-deploy-subdomains/)
- [Environment Variables](https://docs.netlify.com/build/environment-variables/overview/)

**Git Branching Strategies**:
- [Three-Branch Strategy](https://medium.com/@marcelokopmann/git-flow-vs-three-branch-strategy-dev-staging-prod-3ec023c51e8a)
- [GitHub Flow vs GitFlow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)

---

## ❓ FAQ

**Q: Can I have more than 2 environments (e.g., dev, qa, staging, prod)?**
A: Yes, Netlify free tier supports unlimited branch deploys. Create additional branches (e.g., `staging`, `dev`) and configure each as a branch deploy.

**Q: What happens if I exceed 100GB bandwidth?**
A: Netlify automatically charges overage fees. Monitor bandwidth usage to avoid surprises. Current project size should stay well under limit.

**Q: Do I need to upgrade to use custom subdomains?**
A: No, automatic deploy subdomains are available on the free tier if using Netlify DNS. Manual CNAME records work with any DNS provider.

**Q: Can I password-protect the QA environment?**
A: Basic auth is available on paid plans ($19+/month). On free tier, use obscure URLs or Netlify's deploy preview passwords.

**Q: Should I keep `qa` branch synced with `master`?**
A: Yes, periodically merge `master` → `qa` to keep environments aligned, especially after hotfixes deployed directly to production.

---

## ✅ Next Steps

1. **Immediate**: Create `qa` branch and enable Netlify branch deploys
2. **This Week**: Configure custom subdomain (if desired)
3. **Ongoing**: Adopt new feature → qa → prod workflow
4. **Monthly**: Review bandwidth/build usage to ensure within free tier limits

**Estimated Setup Time**: 30-60 minutes for complete configuration

**Risk Level**: Low (non-destructive, can revert anytime)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-13
**Author**: Claude Code Research Agent
