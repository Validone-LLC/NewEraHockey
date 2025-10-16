# Calendar Implementation - Required Dependencies

## NPM Package Installation

After Phase 1 (Google Cloud Setup) is complete, install the following npm packages:

### Backend Dependencies

```bash
npm install google-auth-library googleapis
```

**Packages**:
- `google-auth-library@^9.0.0` - Google authentication with Workload Identity support
- `googleapis@^130.0.0` - Google Calendar API v3 client library

### Frontend Dependencies

```bash
npm install react-big-calendar date-fns
```

**Packages**:
- `react-big-calendar@^1.11.0` - Calendar UI component
- `date-fns@^3.0.0` - Date formatting and manipulation (localizer for react-big-calendar)

### Existing Dependencies (Already Installed)

These packages are already in your project:
- ✅ `react` - Core React library
- ✅ `framer-motion` - Animations (used in components)
- ✅ `react-icons` - Icon library (HiCalendar, HiClock, etc.)
- ✅ `react-router-dom` - Routing

---

## Installation Commands

### Full Installation (All at Once)
```bash
npm install google-auth-library googleapis react-big-calendar date-fns
```

### Step-by-Step Installation

#### Step 1: Backend Dependencies
```bash
npm install google-auth-library googleapis
```

**Purpose**: Netlify function authentication and Google Calendar API access

#### Step 2: Frontend Dependencies
```bash
npm install react-big-calendar date-fns
```

**Purpose**: Calendar UI rendering and date handling

---

## Dependency Details

### google-auth-library
**Version**: ^9.0.0
**Purpose**: Handles Workload Identity Federation authentication
**Size**: ~500KB
**License**: Apache-2.0

**Key Features**:
- Workload Identity Federation support
- Service account impersonation
- OIDC token handling
- Automatic token refresh

### googleapis
**Version**: ^130.0.0
**Purpose**: Google Calendar API v3 client
**Size**: ~8MB (includes all Google APIs, tree-shakeable)
**License**: Apache-2.0

**Key Features**:
- Calendar events CRUD operations
- Incremental sync with sync tokens
- Event filtering and querying
- Batch operations support

### react-big-calendar
**Version**: ^1.11.0
**Purpose**: React calendar component
**Size**: ~200KB
**License**: MIT

**Key Features**:
- Month, week, day views
- Event rendering and styling
- Custom event components
- Responsive design
- Localizer support (date-fns, moment, etc.)

### date-fns
**Version**: ^3.0.0
**Purpose**: Date manipulation and formatting
**Size**: ~300KB (tree-shakeable)
**License**: MIT

**Key Features**:
- Lightweight alternative to moment.js
- Immutable date functions
- Tree-shakeable (import only what you need)
- TypeScript support
- Comprehensive date formatting

---

## Package.json Update

After installation, your `package.json` dependencies section should include:

```json
{
  "dependencies": {
    "date-fns": "^3.0.0",
    "google-auth-library": "^9.0.0",
    "googleapis": "^130.0.0",
    "react-big-calendar": "^1.11.0"
  }
}
```

---

## Import Verification

After installation, verify imports work:

### Backend (Netlify Function)
```javascript
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
```

### Frontend (React Components)
```javascript
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
```

---

## CSS Import Required

`react-big-calendar` requires CSS import. This is already included in:

**File**: `src/components/schedule/EventCalendar/EventCalendar.jsx`

```javascript
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css'; // Custom overrides
```

---

## Build Verification

After installing dependencies, verify build succeeds:

```bash
npm run build
```

**Expected**:
- ✅ No TypeScript errors
- ✅ No missing dependency errors
- ✅ Build completes successfully

---

## Troubleshooting

### Dependency Installation Errors

**Error**: `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
npm install --legacy-peer-deps
```

### Import Errors After Installation

**Error**: `Module not found: Can't resolve 'react-big-calendar'`

**Solution**:
1. Delete `node_modules/` and `package-lock.json`
2. Run `npm install` again
3. Restart dev server

### Build Size Concerns

**Issue**: `googleapis` package is large (~8MB)

**Solution**: Only imported modules are bundled. Netlify functions tree-shake automatically, so only Calendar API is included in final build.

---

## Development vs Production

### Development
```bash
npm install --save-dev
```
- No additional dev dependencies needed
- Existing dev dependencies sufficient

### Production
```bash
npm install --production
```
- Only installs dependencies (not devDependencies)
- Netlify automatically handles this during build

---

## Next Steps After Installation

1. ✅ Verify `node_modules/` contains all packages
2. ✅ Run `npm run build` to test compilation
3. ✅ Start dev server: `npm run dev`
4. ✅ Navigate to `/schedule` route
5. ✅ Check browser console for import errors

**Installation Status**: Ready for immediate installation

**Estimated Install Time**: 2-3 minutes (depending on internet speed)
