# Fixed: Frontend Balance Validation

## The Problem
On the Select Date screen, the "Continue to Review" button was clickable even when the user selected more days than available balance (considering PENDING leaves).

### Example:
- Annual Leave: 13 available
- User selects 15 days
- Button was still clickable ❌
- User could proceed to next screen ❌

## The Fix
Now the "Continue to Review" button is disabled when:
1. No dates selected
2. Calculating duration
3. **Selected days > Available balance** ✅ (NEW)

### How It Works Now:
- Annual Leave: 13 available
- User selects 15 days
- Button becomes disabled (grayed out) ✅
- User cannot proceed ✅
- Alert shows: "You can only select 13 days. Selected range would be 15 days."

## What Changed

### File: `screens/SelectDateScreen.js`

**1. Button Disabled Condition:**
```javascript
// Before
disabled={!startDate || !endDate || calculating}

// After
disabled={!startDate || !endDate || calculating || totalDuration > leaveType.balance}
```

**2. Button Style:**
```javascript
// Before
style={[
  styles.continueButton,
  (!startDate || !endDate || calculating) && styles.continueButtonDisabled
]}

// After
style={[
  styles.continueButton,
  (!startDate || !endDate || calculating || totalDuration > leaveType.balance) && styles.continueButtonDisabled
]}
```

**3. Added Disabled Style:**
```javascript
continueButtonDisabled: {
  backgroundColor: '#2d2d2d',
  opacity: 0.5,
  shadowOpacity: 0,
}
```

**4. Calendar Date Selection:**
Added validation when selecting end date:
```javascript
const tempDuration = getDatesInRange(startDate, selected).length;

if (tempDuration > leaveType.balance) {
  Alert.alert(
    'Insufficient Balance',
    `You can only select ${leaveType.balance} days. Selected range would be ${tempDuration} days.`,
    [{ text: 'OK' }]
  );
  return;
}
```

## User Experience

### Scenario 1: Sufficient Balance
- Annual Leave: 13 available
- User selects: Mar 1 - Mar 10 (10 days)
- Button: **Enabled** (green) ✅
- User can proceed to review

### Scenario 2: Insufficient Balance
- Annual Leave: 13 available
- User selects: Mar 1 - Mar 15 (15 days)
- Alert: "You can only select 13 days. Selected range would be 15 days."
- End date: **Not set** ❌
- Button: **Disabled** (grayed out) ❌

### Scenario 3: Exact Balance
- Annual Leave: 13 available
- User selects: Mar 1 - Mar 13 (13 days)
- Button: **Enabled** (green) ✅
- User can proceed to review

## Visual Feedback

### Button States:

**Enabled (Green):**
- Background: #ff5722 (orange)
- Shadow: Visible
- Clickable: Yes

**Disabled (Gray):**
- Background: #2d2d2d (dark gray)
- Opacity: 0.5
- Shadow: None
- Clickable: No

### Balance Display:
```
Remaining Balance After
13 - 15 = -2 Days (RED - indicates insufficient)
13 - 10 = 3 Days (GREEN - indicates sufficient)
```

## Combined with Backend Validation

### Frontend (SelectDateScreen):
- Prevents selecting more days than available
- Shows immediate feedback
- Disables button if insufficient

### Backend (leave.controller.js):
- Checks APPROVED + PENDING leaves
- Blocks application if insufficient
- Returns error message

### Result:
**Double protection** - User cannot apply for more leaves than available!

## Testing

### Test 1: Try to Select Too Many Days
1. Go to Apply Leave
2. Select Annual Leave (13 available)
3. Select start date: Mar 1
4. Try to select end date: Mar 20 (20 days)
5. **Expected:** Alert shows, end date not set, button disabled

### Test 2: Select Within Balance
1. Go to Apply Leave
2. Select Annual Leave (13 available)
3. Select start date: Mar 1
4. Select end date: Mar 10 (10 days)
5. **Expected:** Button enabled, can proceed

### Test 3: With Pending Leaves
1. Apply 7 days Annual Leave (PENDING)
2. Try to apply 7 more days
3. **Expected:** 
   - Frontend: Shows 6 available (13 - 7 pending)
   - Cannot select more than 6 days
   - Button disabled if trying to select 7+

## Summary

✅ **Frontend Validation:** Button disabled if insufficient balance
✅ **Calendar Validation:** Cannot select end date exceeding balance
✅ **Visual Feedback:** Button grays out, balance shows in red
✅ **Backend Validation:** Double-checks before creating request
✅ **User Experience:** Clear error messages and immediate feedback

No more clicking "Continue to Review" with insufficient balance! 🎉
