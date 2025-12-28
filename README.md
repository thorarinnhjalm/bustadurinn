# Bústaðurinn.is

**Stafrænn arkitektúr fyrir sumarhúsið.**

A premium SaaS platform for managing shared summer houses. Built with modern tech stack following Scandi-minimalist design principles.

## 🏗️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Custom CSS Design System (Scandi-minimalist)
- **Icons**: Lucide React
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Routing**: React Router DOM
- **Deployment**: Vercel (target)

## 🎨 Design System

**"Scandi-Minimalist"** - Inspired by high-end architectural magazines

### Colors
- **Base**: Off-White/Bone (#FDFCF8)
- **Primary**: Charcoal Black (#1a1a1a)
- **Accent**: Warm Amber/Gold (#e8b058)

### Typography
- **Headings**: Fraunces (Serif)
- **Body**: Inter (Sans-serif)

### Principles
- High whitespace
- Split-screen layouts
- Sharp corners (minimal border-radius)
- Subtle animations and micro-interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bustadurinn.is
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy `.env.example` to `.env.local`
   - Add your Firebase credentials to `.env.local`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components (Landing, Dashboard, etc.)
├── lib/            # Firebase and utility functions
├── hooks/          # Custom React hooks
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── index.css       # Global styles and design system
```

## 🔑 Features (MVP)

### ✅ Implemented
- [x] Landing page with Icelandic copy
- [x] Authentication (Login/Signup)
- [x] Onboarding wizard
- [x] Basic routing structure
- [x] Design system foundation
- [x] Super admin dashboard structure

### 🚧 In Development
- [ ] Booking calendar (drag-and-drop)
- [ ] Task management
- [ ] Financial ledger
- [ ] Weather integration
- [ ] Guest access (magic links)
- [ ] Google Maps integration
- [ ] House image upload

## 🗄️ Data Schema

### Firestore Collections

**houses**
```typescript
{
  id: string
  name: string
  address: string
  location: { lat: number, lng: number }
  image_url?: string
  rules?: string
  owner_ids: string[]
  created_at: Date
  updated_at: Date
}
```

**users**
```typescript
{
  uid: string
  email: string
  name: string
  avatar?: string
  house_ids: string[]
  created_at: Date
}
```

**bookings**
```typescript
{
  id: string
  house_id: string
  user_id: string
  start: Date
  end: Date
  type: 'personal' | 'guest' | 'rental' | 'maintenance'
  notes?: string
}
```

**tasks**
```typescript
{
  id: string
  house_id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  assigned_to?: string
  due_date?: Date
}
```

**finance**
```typescript
{
  id: string
  house_id: string
  amount: number
  type: 'expense' | 'rental_income' | 'contribution'
  description: string
  date: Date
}
```

## 💳 Pricing

- **Monthly**: 2,490 kr/month
- **Annual**: 19,900 kr/year (recommended)
- **Trial**: 14 days free

## 🌐 Environment Variables

See `.env.example` for required environment variables:
- Firebase configuration
- Google Maps API key

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🎯 Next Steps

1. **Set up Firebase**
   - Enable Authentication
   - Create Firestore database
   - Deploy Firestore security rules

2. **Implement Core Features**
   - Booking calendar with conflict detection
   - Task management system
   - Financial tracking

3. **Integrate External Services**
   - Google Maps for location
   - Weather API for forecasts

4. **Deploy to Vercel**
   - Connect repository
   - Add environment variables
   - Configure custom domain

## 📖 Development Notes

- All UI text must be in **Icelandic**
- Currently in **DEVELOPMENT** environment
- Focus on functionality and structure first
- Use mock data for testing

## 🤝 Contributing

This is a private project. Contact the project owner for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for Icelandic summer house owners**
