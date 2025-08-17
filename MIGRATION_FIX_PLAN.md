# Migration Fix Plan - Prioritized Actions

## 🔥 CRITICAL FIXES (Do Today)

### 1. Fix EditLetterForm State Management
**Issue**: EditLetterForm uses direct Supabase calls, won't trigger UI updates
**Location**: `src/features/letters/components/EditLetterForm.tsx` (lines 95-100)
**Impact**: Editing letters requires manual refresh
**Fix**: Refactor to use `useLetters.updateLetter`

### 2. Remove Unused Files
**Issue**: Orphaned `Letters.tsx` page creates confusion
**Status**: ✅ DONE - Already removed

### 3. Add Error Boundaries for Events
**Issue**: Custom events can fail silently
**Locations**: `App.tsx`, `AuthenticatedLayout.tsx`
**Fix**: Add try-catch and fallback mechanisms

## 🟡 HIGH PRIORITY (This Week)

### 4. Standardize Form Submission Pattern
**Current Issues**:
- `CreateLetterForm`: Uses direct Supabase + custom event refresh
- `EditLetterForm`: Uses direct Supabase, no refresh trigger
- Inconsistent success handling

**Target Pattern**:
```tsx
// All forms should follow this pattern:
const [letterState, letterActions] = useLetters();
const handleSubmit = async (data) => {
  await letterActions.createLetter(data); // or updateLetter
  onSuccess?.(result);
};
```

### 5. Audit All Component Props
**Check these components**:
- `LettersView` - now expects `refreshTrigger` (added)
- `CreateLetterForm` - interface matches usage?
- `EditLetterForm` - interface matches usage?

## 🟢 MEDIUM PRIORITY (Next Sprint)

### 6. Replace Custom Events with React Context
**Current Custom Events**:
- `openCreateForm`
- `viewLetter`
- `refreshLetters`

**Proposed Context Structure**:
```tsx
interface AppContextType {
  createLetter: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
  };
  navigation: {
    viewLetter: (letter: Letter) => void;
    viewAllLetters: () => void;
  };
  data: {
    refreshLetters: () => void;
  };
}
```

### 7. Create Integration Tests
**Critical User Journeys**:
- Create letter → appears in list immediately
- Edit letter → changes reflect immediately
- Navigate between pages → data loads correctly
- Error scenarios → graceful handling

## 📋 IMMEDIATE ACTION ITEMS

### Today's Tasks:
1. ✅ Remove unused `Letters.tsx`
2. ✅ Fix `EditLetterForm` to use `useLetters` hook
3. ✅ Add error handling to event system
4. ✅ Fix missing handlers for letter view/edit clicks
5. ✅ Fix AI enhancement data storage (preserve both original and enhanced versions)
6. 🔄 Test complete end-to-end flows

### Code Changes Needed:

#### EditLetterForm.tsx Fix:
```tsx
// BEFORE (lines 95-100):
const { data, error } = await supabase
  .from('letters')
  .update(updateData)
  .eq('id', letter.id)

// AFTER:
const [, { updateLetter }] = useLetters();
const updatedLetter = await updateLetter(letter.id, updateData);
```

#### Event Error Handling:
```tsx
// Add to AuthenticatedLayout:
const handleCreateSuccess = () => {
  setShowCreateForm(false);
  navigate('/letters');
  try {
    setTimeout(() => {
      const event = new CustomEvent("refreshLetters");
      window.dispatchEvent(event);
    }, 100);
  } catch (error) {
    console.error('Failed to refresh letters:', error);
    // Could show a toast or retry mechanism
  }
};
```

## 🧪 Testing Checklist

Before considering this migration stable, test:
- [ ] Create new letter → appears immediately
- [ ] Edit existing letter → changes appear immediately  
- [ ] Navigate Dashboard → Letters → data loads
- [ ] Error scenarios → user sees feedback
- [ ] No console errors in browser
- [ ] TypeScript compiles without warnings

## 🎯 Success Metrics

**We'll know the migration is stable when**:
1. Zero manual refresh requirements
2. All forms trigger proper state updates
3. Navigation feels instant and consistent
4. Error handling provides user feedback
5. No more "architectural surprises"

---

**Next Step**: Fix EditLetterForm state management (30-60 minutes)
