# Rekstraráætlun Enhancement Summary

## Overview
Enhanced the **Rekstraráætlun** (Operational Budget) feature to support income tracking, co-owner attribution, and monthly breakdown visualization.

## Key Changes

### 1. Data Model Updates (`src/types/models.ts`)
- Added `BudgetItemType` ('expense' | 'income')
- Extended `BudgetItem` interface with:
  - `type`: Distinguishes between expenses and income
  - `assigned_owner_id`: Tracks which co-owner contributes recurring income
  - `assigned_owner_name`: Display name for the contributing co-owner

### 2. New Component: MonthlyBreakdown (`src/components/finance/MonthlyBreakdown.tsx`)
**Features:**
- Expandable 12-month calendar view
- Shows for each month:
  - Expected income (green)
  - Expected expenses (red)
  - Net position (income - expenses)
  - Running balance throughout the year
- Visual indicators with trend icons (up/down)
- Year-end summary showing total income, expenses, and final balance
- Intelligent distribution:
  - Monthly items: Applied every month
  - Yearly items: Spread evenly across all months
  - One-time items: Applied in January

### 3. Enhanced Budget Form (`src/components/finance/BudgetForm.tsx`)
**New Features:**
- **Type Toggle**: Switch between "Kostnaður" (Expense) and "Tekjur" (Income)
- **Color Coding**: Red for expenses, green for income
- **Co-owner Selection**: When adding income, optionally assign to a specific meðeigandi
- **Owner Dropdown**: Fetches all co-owners from house.owner_ids and displays their names
- Dynamic placeholders based on type (e.g., "Rafmagn" for expenses, "Mánaðargjald" for income)

### 4. Updated Finance Page (`src/pages/FinancePage.tsx`)
**BudgetView Enhancements:**
- **Separate Calculations**: 
  - Total income (green, with + sign)
  - Total expenses (red, with - sign)
  - Net position (income - expenses)
- **Smart Card Color**: 
  - Green background if net position is positive
  - Red background if deficit
- **Required Monthly Contribution**: Shows how much co-owners need to contribute monthly to cover the deficit (if expenses > income)
- **Visual Budget Items**:
  - Income items have green background and "Tekjur" badge
  - Expenses have standard styling
  - Shows assigned co-owner name for income items
- **Integrated Monthly Breakdown**: Full-width component at bottom

### 5. Variance Widget Update
- Now filters to only show expense items (not income) for variance comparison
- Maintains comparison between planned expenses vs actual expenses from Bókhald

## Use Cases

### For Summer Houses (Like Yours)
1. **Add Monthly Contributions**:
   - Type: Income
   - Category: "Mánaðargjald"
   - Amount: e.g., 50,000 kr
   - Frequency: Monthly
   - Assigned to: Þórarinn (or other co-owner)

2. **Add Expected Expenses**:
   - Electricity: 30,000 kr/month
   - Property tax: 200,000 kr/year
   - Maintenance: 100,000 kr (one-time)

3. **View Monthly Breakdown**:
   - See how the balance evolves month-by-month
   - Identify potential cash flow issues
   - Plan for large expenses

### Key Distinctions

**Rekstraráætlun (Budget Plan)**:
- Forward-looking planning tool
- Predictable recurring costs and income
- Regular monthly contributions from co-owners
- Scheduled annual expenses
- **Does NOT affect actual hússjóður balance**

**Bókhald (Ledger)**: 
- Historical record of reality
- Unexpected expenses (broken windows)
- Guest rental income
- Actual utility bills
- **DOES affect actual hússjóður balance**

## Visual Features

### Summary Card
Shows three key metrics:
1. **Total Expected Income**: +XXX kr (green)
2. **Total Expected Expenses**: -XXX kr (red)
3. **Required Monthly Contribution**: XXX kr/mán (amber) - only what's needed to cover any deficit

### Monthly Breakdown
- Collapsible component with ChevronDown/Up icon
- Grid layout showing all 12 months
- Color-coded amounts (green for positive, red for negative)
- Running balance column shows cumulative effect
- Legend explains column headers

### Budget Items List
- Green-highlighted cards for income items
- "Tekjur" badge on income items
- Shows assigned co-owner name (e.g., "• Þórarinn")
- Plus signs (+) on income amounts

## Technical Implementation

### State Management
- Fetches budget plan from Firestore (`budget_plans` collection)
- Fetches co-owner details from `users` collection
- Real-time updates via Firestore listeners

### Calculations
- Annual amounts calculated based on frequency
- Monthly breakdown intelligently distributes yearly costs
- Running balance tracks cumulative position
- Net position = Total Income - Total Expenses

### Future Enhancements (Optional)
- [ ] Allow specifying which month for one-time expenses
- [ ] Add notes/descriptions to budget items
- [ ] Export monthly breakdown to CSV
- [ ] Set different contribution amounts per co-owner
- [ ] Compare multiple years
- [ ] Budget vs actual variance per month (not just YTD)

## Migration Notes

**Existing Budget Items**:
- Will need `type` field added
- Can run a migration script to set all existing items to `type: 'expense'`
- Or handle gracefully in code (default to 'expense' if undefined)

## Files Modified

1. `/src/types/models.ts` - Data model updates
2. `/src/components/finance/MonthlyBreakdown.tsx` - New component
3. `/src/components/finance/BudgetForm.tsx` - Enhanced form
4. `/src/pages/FinancePage.tsx` - Updated budget view

---

**Created**: 2026-01-01
**Feature**: Rekstraráætlun Income & Monthly Breakdown
