# TASK-001: Project Initialization

**Estimate:** 2 hours
**Priority:** P0 (Critical)
**Dependencies:** None

---

## 🎯 Objective

Set up a new Next.js 14 project with TypeScript, Tailwind CSS, and all necessary dependencies for the Bustadurinn.is corporate platform.

---

## 📋 Requirements

**Must Have:**
- [x] Next.js 14 with App Router
- [x] TypeScript (strict mode)
- [x] Tailwind CSS configured
- [x] ESLint + Prettier
- [x] Proper folder structure
- [x] Development server running

**Should Have:**
- [x] Environment variables template
- [x] README with setup instructions
- [x] Git repository initialized
- [x] .gitignore configured

---

## 🛠️ Step-by-Step Implementation

### **Step 1: Create Next.js Project (10 min)**

Run this command in your terminal:

```bash
npx create-next-app@latest bustadurinn-corporate --typescript --tailwind --app --src-dir --import-alias "@/*"
```

When prompted, choose:
- ✅ TypeScript: Yes
- ✅ ESLint: Yes
- ✅ Tailwind CSS: Yes
- ✅ `src/` directory: Yes
- ✅ App Router: Yes
- ✅ Import alias: Yes (@/*)

### **Step 2: Install Dependencies (10 min)**

Navigate to project directory:
```bash
cd bustadurinn-corporate
```

Install required packages:
```bash
npm install firebase firebase-admin zustand react-hook-form zod @hookform/resolvers react-big-calendar date-fns lucide-react
```

Install dev dependencies:
```bash
npm install -D prettier prettier-plugin-tailwindcss @types/react-big-calendar
```

### **Step 3: Configure Prettier (5 min)**

Create `.prettierrc` file:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Create `.prettierignore` file:
```
node_modules
.next
out
build
dist
*.md
package-lock.json
```

### **Step 4: Update TypeScript Config (5 min)**

Edit `tsconfig.json` to enable strict mode:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### **Step 5: Create Folder Structure (10 min)**

Create these folders in `src/`:

```bash
mkdir -p src/app/api
mkdir -p src/components/admin
mkdir -p src/components/properties
mkdir -p src/components/bookings
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/services
mkdir -p src/stores
mkdir -p src/types
mkdir -p src/hooks
```

### **Step 6: Create Type Definitions (15 min)**

Create `src/types/models.ts`:

```typescript
import { Timestamp } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'company' | 'union' | 'municipality';
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_start: Timestamp;
  subscription_end: Timestamp;
  billing_email: string;
  settings: OrganizationSettings;
  admin_user_ids: string[];
  stats: OrganizationStats;
  created_at: Timestamp;
  created_by: string;
  updated_at: Timestamp;
}

export interface OrganizationSettings {
  require_access_approval: boolean;
  auto_approve_company_email: boolean;
  allowed_email_domains: string[];
  require_booking_approval: boolean;
  payment_required: boolean;
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  price_per_night?: number;
  max_nights_per_booking?: number;
  max_bookings_per_year?: number;
  advance_booking_days?: number;
}

export interface OrganizationStats {
  total_properties: number;
  total_members: number;
  active_members: number;
  total_bookings: number;
}

export interface AccessRequest {
  id: string;
  email: string;
  name: string;
  employee_id?: string;
  department?: string;
  phone?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  email_domain_verified: boolean;
  employee_id_verified: boolean;
  reviewed_by?: string;
  reviewed_at?: Timestamp;
  review_notes?: string;
  denial_reason?: string;
  requested_at: Timestamp;
  ip_address?: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  employee_id?: string;
  department?: string;
  hire_date?: Timestamp;
  status: 'pending' | 'approved' | 'active' | 'suspended';
  access_level: 'guest' | 'full';
  approved_by?: string;
  approved_at?: Timestamp;
  approval_method?: 'manual' | 'auto';
  bookings_this_year: number;
  bookings_total: number;
  days_booked_this_year: number;
  last_booking_date?: Timestamp;
  payment_balance: number;
  total_paid: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BookingRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  house_id: string;
  house_name: string;
  start_date: Timestamp;
  end_date: Timestamp;
  num_nights: number;
  num_guests: number;
  purpose: 'personal' | 'family' | 'work_retreat';
  notes?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  has_conflicts: boolean;
  conflict_details?: string;
  quota_check_passed: boolean;
  reviewed_by?: string;
  reviewed_at?: Timestamp;
  review_notes?: string;
  denial_reason?: string;
  payment_required: boolean;
  payment_amount?: number;
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  payment_status?: 'pending' | 'paid' | 'invoiced';
  invoice_id?: string;
  booking_id?: string;
  requested_at: Timestamp;
  ip_address?: string;
}

export interface House {
  id: string;
  name: string;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  organization_id?: string;
  organization_name?: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  square_meters?: number;
  image_url?: string;
  gallery_urls?: string[];
  amenities: string[];
  house_rules?: string;
  check_in_time?: string;
  check_out_time?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  emergency_contact?: string;
  min_nights?: number;
  max_nights?: number;
  seasonal_availability?: {
    winter_closed?: boolean;
    available_months?: number[];
  };
  created_at: Timestamp;
  created_by: string;
  updated_at: Timestamp;
}

export interface Booking {
  id: string;
  house_id: string;
  organization_id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  start: Timestamp;
  end: Timestamp;
  num_nights: number;
  num_guests: number;
  type: 'personal' | 'family' | 'work_retreat';
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  payment_amount: number;
  payment_status: 'pending' | 'paid' | 'invoiced';
  payment_method?: 'invoice' | 'online' | 'payroll' | 'free';
  payment_due_date?: Timestamp;
  invoice_id?: string;
  paid_at?: Timestamp;
  approved_by?: string;
  approved_at?: Timestamp;
  created_from_request_id?: string;
  created_at: Timestamp;
  cancelled_at?: Timestamp;
  cancelled_by?: string;
  cancellation_reason?: string;
}

export interface AdminAction {
  id: string;
  admin_user_id: string;
  admin_name: string;
  action_type:
    | 'approve_access'
    | 'deny_access'
    | 'approve_booking'
    | 'deny_booking'
    | 'cancel_booking'
    | 'suspend_member'
    | 'reactivate_member'
    | 'update_settings';
  target_id: string;
  target_type: 'access_request' | 'booking_request' | 'member' | 'settings';
  target_name?: string;
  details?: string;
  notes?: string;
  timestamp: Timestamp;
  ip_address?: string;
}
```

### **Step 7: Environment Variables (10 min)**

Create `.env.local.example`:
```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# Other
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.local` (copy from example):
```bash
cp .env.local.example .env.local
```

Add to `.gitignore`:
```
.env.local
.env*.local
```

### **Step 8: Update README (10 min)**

Update `README.md`:

```markdown
# Bustadurinn.is - Corporate Edition

Summer house booking platform for organizations, companies, and employee associations.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Firebase Firestore
- **Authentication:** Firebase Authentication
- **Storage:** Firebase Storage
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Calendar:** React Big Calendar

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Add your Firebase credentials to `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Utility libraries
├── services/         # Business logic services
├── stores/           # Zustand state stores
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

## Documentation

See `/docs` folder for detailed documentation.
```

### **Step 9: Clean Up Default Files (10 min)**

Update `src/app/page.tsx`:
```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Bustadurinn.is - Corporate Edition</h1>
      <p className="mt-4 text-gray-600">
        Summer house booking platform for organizations
      </p>
    </main>
  );
}
```

Update `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bustadurinn.is - Corporate',
  description: 'Summer house booking platform for organizations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="is">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### **Step 10: Test Everything (15 min)**

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
   - Should see homepage
   - No console errors
   - Tailwind classes working

3. Run linter:
   ```bash
   npm run lint
   ```
   - Should pass with no errors

4. Test TypeScript:
   ```bash
   npx tsc --noEmit
   ```
   - Should compile with no errors

---

## ✅ Acceptance Criteria

- [x] `npm run dev` starts without errors
- [x] Page loads at http://localhost:3000
- [x] Tailwind CSS is working (text is styled)
- [x] TypeScript strict mode enabled
- [x] ESLint passes
- [x] All dependencies installed
- [x] Folder structure created
- [x] Type definitions created
- [x] README updated
- [x] Environment variables configured

---

## 📝 Status Update Template

After completing, update `STATUS.md` with:

```markdown
## [DATE] - TASK-001: Project Initialization

**Status:** ✅ Complete

**Completed:**
- [x] Created Next.js 14 project with TypeScript
- [x] Installed all dependencies
- [x] Configured Tailwind CSS and Prettier
- [x] Set up folder structure
- [x] Created TypeScript type definitions
- [x] Updated README
- [x] Created environment variables template

**Files Created:**
- Next.js scaffolding (package.json, next.config.js, etc.)
- `src/types/models.ts` (all TypeScript interfaces)
- `.prettierrc` (Prettier config)
- `.env.local.example` (env template)
- Updated `README.md`
- Updated `src/app/page.tsx` and `src/app/layout.tsx`

**Dependencies Installed:**
- firebase, firebase-admin
- zustand
- react-hook-form, zod, @hookform/resolvers
- react-big-calendar, date-fns
- lucide-react
- prettier, prettier-plugin-tailwindcss

**Testing:**
- [x] `npm run dev` works (no errors)
- [x] http://localhost:3000 loads successfully
- [x] Tailwind CSS working
- [x] TypeScript compiles (strict mode)
- [x] ESLint passes

**Project Structure:**
```
src/
├── app/
├── components/
│   ├── admin/
│   ├── properties/
│   ├── bookings/
│   └── ui/
├── lib/
├── services/
├── stores/
├── types/
│   └── models.ts ✅
└── hooks/
```

**Issues/Questions:**
None

**Next Steps:**
Ready for TASK-002: Firebase Setup
```

---

## 🎯 Success Criteria

**You're done when:**
1. Dev server runs without errors
2. Homepage displays correctly
3. All type definitions are in place
4. Folder structure matches spec
5. STATUS.md is updated
6. No TypeScript or ESLint errors

---

## 💡 Tips

- Use `npm run lint` frequently
- Check for TypeScript errors often
- Keep terminal open to catch errors
- Test in browser after each step
- Commit to git after completion

---

**Ready? Let's build! 🚀**
