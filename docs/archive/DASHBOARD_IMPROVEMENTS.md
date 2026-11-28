# Dashboard & Feature Improvements - In Progress

## ✅ Completed (Ready for Testing)

### 1. Shopping List Feature
- ✅ Created `ShoppingItem` model in types
- ✅ Built `ShoppingList.tsx` component with toggle/delete/add
- ✅ Added Firestore security rules for `shopping_list` collection
- ⏳ **NEXT**: Integrate into Dashboard and create dedicated page

### 2. Internal Logbook ("Gestapósturinn")
- ✅ Created `InternalLog` model (distinct from external Guestbook)
- ✅ Built `InternalLogbook.tsx` component with timeline UI
- ✅ Added Firestore security rules for `internal_logs` collection
- ⏳ **NEXT**: Integrate into Dashboard

### 3. Navigation Improvements
- ✅ Added back buttons to Calendar, Tasks, Finance, Settings pages
- ✅ Added Admin shield button for superuser access
- ✅ Added Logout buttons in Settings

### 4. Firestore Indexes Required
Create these in Firebase Console:
```
Collection: bookings
- house_id (ASC), start (ASC)
- house_id (ASC), end (ASC)
- house_id (ASC), user_id (ASC), start (ASC)

Collection: tasks
- house_id (ASC), status (ASC), created_at (DESC)
```

### 5. Firestore Rules Deployment
Run: `firebase deploy --only firestore:rules`

## 🚧 TODO - Dashboard Integration

### Immediate Priority
1. **Update DashboardPage.tsx**:
   - Add shopping list state and handlers
   - Add internal logs state and handlers
   - Integrate `<ShoppingList />` component
   - Integrate `<InternalLogbook />` component
   - Update mobile bottom nav to include ShoppingCart icon

2. **Calendar Enhancements**:
   - Add holiday markers to calendar grid
   - Make year legend dynamic (2024 → 2025)
   - Verify back button works

3. **House Image Upload**:
   - Install image cropping library (e.g. `react-easy-crop`)
   - Create ImageUploader component
   - Add to Settings page
   - Integrate Firebase Storage
   - Update House model with `image_url` field

4. **Mobile Responsiveness Audit**:
   - Test all pages on mobile viewport
   - Ensure proper spacing, touch targets
   - Verify bottom nav doesn't overlap content

## 📝 Data Structure Notes

### Shopping List (`shopping_list` collection)
```typescript
{
  id: string;
  house_id: string;
  item: string;
  checked: boolean;
  added_by: string;
  added_by_name: string;
  checked_by?: string;
  checked_by_name?: string;
  checked_at?: Date;
  created_at: Date;
}
```

### Internal Logs (`internal_logs` collection)
```typescript
{
  id: string;
  house_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: Date;
}
```

### Guestbook (Existing - for external visitors)
Already implemented in `GuestPage.tsx` - accessible via guest magic links.

## 🔗 Next Session Priorities

1. Complete Dashboard integration
2. Create dedicated Shopping List page (`/vantar` or `/shopping`)
3. Add house image upload to Settings
4. Calendar holiday markers
5. Full mobile testing pass
6. Deploy Firestore rules
