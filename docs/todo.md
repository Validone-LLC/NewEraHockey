# Todo

## ✅ Fixed - Local Environment Variables Not Loading

### Issue
`ADMIN_EMAIL environment variable is not set` when testing locally with Netlify Dev.

### Root Cause
Netlify CLI requires `netlify.toml` configuration file to properly set up the development environment.

### Solution Applied
Created `netlify.toml` with proper configuration:
- Build settings
- Dev server configuration (port 8888, targets Vite on 5173)
- Functions directory specification

### Next Steps
1. **Restart your dev server** to pick up the new `netlify.toml`:
   ```bash
   # Stop current dev server (Ctrl+C)
   # Start fresh:
   netlify dev
   ```

2. **Netlify CLI will now**:
   - Auto-detect `.env` file
   - Load environment variables for Functions
   - Proxy Vite dev server on port 8888
   - Make Functions available at `http://localhost:8888/.netlify/functions/contact`

3. **Test contact form** at: http://localhost:8888/contact

### Verification
After restarting dev server, check that:
- ✅ No more "ADMIN_EMAIL not set" errors
- ✅ Contact form submits successfully
- ✅ Console shows email sending logs
- ✅ Email JSON files created in `src/data/emails/`

### Alternative: Manual Environment Variable Loading
If `netlify.toml` doesn't work, you can explicitly load env vars:
```bash
netlify dev --env .env
```

Or use `dotenv-cli`:
```bash
npm install -D dotenv-cli
# Then run:
dotenv -e .env -- netlify dev
```
