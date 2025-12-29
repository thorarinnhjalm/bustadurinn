# Bústaðurinn.is

**Stafrænn arkitektúr fyrir sumarhúsið.**

A premium SaaS platform for managing shared summer houses. Built with modern tech stack following Scandi-minimalist design principles.

## 📊 Project Status

**Version**: 1.1.0  
**Status**: ✅ Production-Ready  
**Last Updated**: 2025-12-29  
**Deployment**: Live on Vercel Pro

### Current State
- ✅ Full user authentication and onboarding
- ✅ Complete booking calendar with fairness rules
- ✅ Task management system
- ✅ Shopping list functionality  
- ✅ Internal logbook (owner communication)
- ✅ Real-time weather integration (Open-Meteo)
- ✅ Guest access via magic links
- ✅ Super Admin dashboard with impersonation
- ✅ Mobile-optimized experience
- ✅ House image upload and management
- ✅ GPS-based location search (HMS + Google Maps)

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 19.2.0 + Vite 7.2.4
- **Language**: TypeScript 5.9.3
- **Styling**: Custom CSS Design System (Scandi-minimalist)
- **Icons**: Lucide React 0.562.0
- **State Management**: Zustand 5.0.9
- **Routing**: React Router DOM 7.11.0

### Backend & Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage (house images)
- **Email**: Resend API
- **Maps**: Google Maps API + HMS Staðfangaskrá
- **Weather**: Open-Meteo API (free tier)

### Deployment
- **Hosting**: Vercel Pro
- **CI/CD**: Automatic deployment from `main` branch
- **Domain**: bustadurinn.is

---

## 🎨 Design System

**"Scandi-Minimalist"** - Inspired by high-end architectural magazines

### Colors
- **Base**: Off-White/Bone (#FDFCF8)
- **Primary**: Charcoal Black (#1a1a1a)
- **Accent**: Warm Amber/Gold (#e8b058)
- **Grey Scale**: Stone shades (100-900)

### Typography
- **Headings**: Fraunces (Serif) - Elegant, architectural feel
- **Body**: Inter (Sans-serif) - Clean, readable
- **Code/Admin**: JetBrains Mono - Technical sections

### Principles
- High whitespace for breathing room
- Split-screen layouts
- Sharp corners (minimal border-radius: 0.375rem = 6px)
- Subtle animations (200ms transitions)
- Mobile-first responsive design

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account (Blaze plan for Cloud Functions)
- Google Maps API key
- Resend API key (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thorarinnhjalm/bustadurinn.git
   cd bustadurinn.is
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   
   Create `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=bustadurinn-599f2.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=bustadurinn-599f2
   VITE_FIREBASE_STORAGE_BUCKET=bustadurinn-599f2.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   VITE_RESEND_API_KEY=re_xxxxxxxxx
   ```

4. **Deploy Firestore Rules**
   ```bash
   npx firebase deploy --only firestore:rules
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Navigate to `http://localhost:5173`

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AdminLayout.tsx       # Super Admin page wrapper
│   ├── DataTable.tsx         # Admin data tables
│   ├── ImpersonationBanner.tsx  # God Mode indicator
│   ├── MobileNav.tsx         # Bottom navigation (mobile)
│   ├── ShoppingList.tsx      # Shopping list widget
│   ├── InternalLogbook.tsx   # Owner communication
│   └── tasks/               # Task management components
├── pages/              # Page components
│   ├── LandingPage.tsx      # Public homepage
│   ├── LoginPage.tsx        # Authentication
│   ├── OnboardingPage.tsx   # New user setup
│   ├── DashboardPage.tsx   # Main user dashboard
│   ├── CalendarPage.tsx    # Booking calendar
│   ├── TasksPage.tsx       # Task management
│   ├── SettingsPage.tsx    # House & user settings
│   ├── GuestPage.tsx       # Magic link guest access
│   ├── SuperAdminPage.tsx  # Admin dashboard
│   └── SandboxPage.tsx     # Public demo (/prufa)
├── lib/                # Core utilities
│   └── firebase.ts          # Firebase initialization
├── hooks/              # Custom React hooks
│   └── useEffectiveUser.ts  # Impersonation support
├── contexts/           # React contexts
│   └── ImpersonationContext.tsx  # God Mode state
├── store/              # Zustand state management
│   └── appStore.ts          # Global app state
├── types/              # TypeScript definitions
│   └── models.ts            # Data models
├── utils/              # Helper functions
│   ├── weather.ts           # Open-Meteo integration
│   ├── hmsSearch.ts         # Iceland address search
│   ├── icelandicHolidays.ts # Holiday calendar
│   └── analytics.ts         # Google Analytics
└── index.css           # Global styles and design system

functions/              # Firebase Cloud Functions
└── src/
    └── index.ts             # Email handlers, etc.
```

---

## 🔑 Features

### ✅ User Features (Production)
- [x] **Authentication** - Email/password login with Google OAuth option
- [x] **Onboarding** - Step-by-step house setup wizard
- [x] **Dashboard** - Beautiful overview with weather, bookings, tasks
- [x] **Booking Calendar** - Month/week/day views with conflict detection
- [x] **Fairness System** - Auto-calculated holiday rotation ("Sanngirnisregla")
- [x] **Task Management** - List & board views, assignment, status tracking
- [x] **Shopping List** - Shared grocery/supply list with check-off
- [x] **Internal Logbook** - Private owner communication ("Gestapósturinn")
- [x] **Guest Access** - Magic link system for temporary guest view
- [x] **Weather Widget** - Real-time temp, wind, conditions
- [x] **House Settings** - Image upload, WiFi, rules, check-in instructions
- [x] **Member Management** - Invite owners via code, manage access
- [x] **Mobile Experience** - Responsive design with bottom navigation

### ✅ Admin Features (Production)
- [x] **Super Admin Dashboard** - `/super-admin` route (email-gated)
- [x] **God Mode (Impersonation)** - View app as any user for support
- [x] **House Registry** - All houses with trial status, MRR tracking
- [x] **User Management** - Full user list with impersonation buttons
- [x] **Contact Inbox** - View website contact form submissions
- [x] **Coupon System** - Create and manage discount codes
- [x] **Email Templates** - Edit dynamic email content
- [x] **Trial Extension** - Manual 14-day trial extensions
- [x] **Free/Comped Accounts** - Mark houses as complimentary
- [x] **Demo Data Seeding** - Populate test data for demos

### 🟡 Future Enhancements
- [ ] Google Analytics 4 widget in Super Admin
- [ ] Facebook Ads metrics integration
- [ ] Admin audit logging (track all admin actions)
- [ ] Newsletter composer for bulk emails
- [ ] Payday.is checkout interface
- [ ] Push notifications (PWA)
- [ ] Offline mode support

---

## 🗄️ Data Schema

### Firestore Collections

#### `houses`
```typescript
{
  id: string
  name: string
  address: string
  location: { lat: number, lng: number }
  image_url?: string
  manager_id: string
  owner_ids: string[]
  invite_code: string
  guest_token?: string
  wifi_ssid?: string
  wifi_password?: string
  house_rules?: string
  check_in_time?: string
  check_out_time?: string
  directions?: string
  access_instructions?: string
  emergency_contact?: string
  holiday_mode: 'fairness' | 'freeforall'
  subscription_status: 'trial' | 'active' | 'free'
  subscription_end?: Date
  created_at: Date
  updated_at: Date
}
```

#### `bookings`
```typescript
{
  id: string
  house_id: string
  user_id: string
  user_name: string
  start: Date
  end: Date
  type: 'personal' | 'guest' | 'rental' | 'maintenance'
  notes?: string
  created_at: Date
}
```

#### `tasks`
```typescript
{
  id: string
  house_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  assigned_to_name?: string
  created_by: string
  due_date?: Date
  created_at: Date
  completed_at?: Date
}
```

#### `shopping_list`
```typescript
{
  id: string
  house_id: string
  item: string
  checked: boolean
  added_by: string
  created_at: Date
}
```

#### `internal_logs`
```typescript
{
  id: string
  house_id: string
  user_id: string
  user_name: string
  message: string
  created_at: Date
}
```

#### `guest_views`
```typescript
{
  houseId: string
  name: string
  address: string
  wifi_ssid?: string
  wifi_password?: string
  house_rules?: string
  check_in_time?: string
  weather?: { temp: number, condition: string }
}
```

---

## 💳 Pricing

- **Price**: 1,990 kr/month per house
- **Trial**: 14 days free (no credit card required)
- **Billing**: Monthly auto-renewal via Payday.is (planned)

**Business Logic**:
- Trial starts on house creation
- MRR = Active paid houses × 1,990 kr
- Demo/comped houses excluded from revenue calculations

---

## 🌐 Environment Variables

Required in `.env.local`:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# External APIs
VITE_GOOGLE_MAPS_API_KEY=
VITE_RESEND_API_KEY=
```

---

## 📝 Scripts

```bash
npm run dev          # Start development server (port 5173)
npm run build        # Build for production (dist/)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Firebase Commands
```bash
npx firebase deploy --only firestore:rules   # Deploy security rules
npx firebase deploy --only functions        # Deploy Cloud Functions
```

---

## 🔒 Security & Access Control

### Super Admin
- **Email Whitelist**: `thorarinnhjalmarsson@gmail.com`
- **Route**: `/super-admin`
- **Permissions**: Read/write access to all collections

### Firestore Rules
- Users can only access their own houses
- Super admin has global read/write
- Guest views are publicly readable (via token)
- Contact forms allow public creation
- Strict validation on joins/invites

**Rules Location**: `firestore.rules`  
**Last Updated**: 2025-12-29

---

## 🚀 Deployment

### Vercel Configuration
- **Plan**: Vercel Pro ($20/month)
- **Deployments**: Automatic from `main` branch
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Set in Vercel dashboard

### CI/CD Pipeline
1. Push to `main` branch
2. Vercel detects change via GitHub webhook
3. Runs `npm run build`
4. Deploys to production if build passes
5. ~2-3 minute deployment time

---

## 🎯 Development Workflow

### Branch Strategy
- `main` - Production (auto-deploys to Vercel)
- Feature branches - For new development

### Commit Convention
```
feat: add new feature
fix: bug fix
chore: maintenance task
docs: documentation update
```

### Testing Super Admin Locally
1. Set your email in `ADMIN_EMAILS` constant
2. Create demo data: Click "Seed Demo Data" in `/super-admin`
3. Test impersonation on demo users
4. Exit God Mode to return to admin view

---

## 📊 Analytics & Monitoring

### Current Setup
- **Error Tracking**: Console logs (Sentry recommended for production)
- **Performance**: Built-in Vercel metrics
- **User Analytics**: Placeholder (GA4 integration ready)

### Improvement Roadmap
- [ ] Sentry for error tracking
- [ ] Google Analytics 4 for user behavior
- [ ] Uptime monitoring (UptimeRobot recommended)
- [ ] Performance budget enforcement

---

## 🔧 Known Issues & Limitations

### Current Limitations
- **Bundle Size**: 1.09MB (consider code splitting)
- **Email**: Dependent on Resend API (rate limits apply)
- **Weather**: Open-Meteo free tier (10,000 calls/day)
- **Maps**: Google Maps usage billed per request

### Future Optimizations
- Implement lazy loading for heavy components
- Add service worker for offline support
- Optimize image loading (consider Cloudinary)
- Implement database query pagination

---

## 📖 Development Notes

- **Language**: All user-facing text is in Icelandic  
- **Currency**: ISK (Icelandic Króna)  
- **Date Format**: Icelandic locale (`is-IS`)  
- **Time Zone**: UTC (Iceland doesn't use DST)

### Design Principles
1. Mobile-first responsive design
2. Accessibility (WCAG AA target)
3. Performance (< 3s load time)
4. Minimalist aesthetic
5. Clear user feedback

---

## 🤝 Contributing

This is a private project for **Neðri Hóll Hugmyndahús ehf**.  
Contact: thor arinnhjalmarsson@gmail.com

---

## 📄 License

**Proprietary** - All rights reserved  
© 2025 Neðri Hóll Hugmyndahús ehf

---

## 📞 Support

**Production Issues**: Email super admin  
**Feature Requests**: Create GitHub issue (if repo access granted)  
**Security Issues**: Email directly (do not file public issues)

---

## 🎓 Technical Decisions Log

### Why React 19?
- Modern concurrent features
- Better TypeScript support
- Improved dev tools

### Why Zustand over Redux?
- Simpler API
- Less boilerplate
- Better TypeScript inference
- Smaller bundle size

### Why Vercel over Firebase Hosting?
- Better build caching
- Edge functions
- Professional deployment analytics
- Superior DX (developer experience)

### Why Firestore over PostgreSQL?
- Real-time updates out of the box
- No server management
- Scales automatically
- Integrated with Firebase Auth

---

## 📈 Project Milestones

### Phase 1: MVP (✅ Complete - Dec 2024)
- Basic authentication
- House creation
- Booking calendar
- Task management

### Phase 2: Production Polish (✅ Complete - Dec 2025)
- Weather integration
- Mobile optimization
- Super Admin dashboard
- Guest access system
- Email templates

### Phase 3: Growth (🟡 Planned - Q1 2026)
- Payment integration (Payday.is)
- Analytics dashboard
- Marketing automation
- Referral system

---

**Built with ❤️ for Icelandic summer house owners** 🇮🇸

**Current Version**: 1.1.0  
**Last Updated**: 2025-12-29  
**Status**: ✅ Production-Ready
