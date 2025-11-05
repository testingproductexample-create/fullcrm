# End-to-End Testing Guide

## Overview

This guide provides comprehensive testing scenarios to validate the complete Order Workflow & Status Tracking System in a production environment.

## Prerequisites

- Application deployed to Vercel (or similar platform)
- Test user account with owner/manager role
- Access to Supabase dashboard for monitoring
- Two browser windows/tabs for real-time testing

## Test Environment Setup

### 1. Deploy Application

Follow `VERCEL_DEPLOY_INSTRUCTIONS.md`:
```
1. Go to vercel.com
2. Import crm-app folder
3. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy
```

### 2. Create Test Data

Login to application and create:
- 2-3 test customers
- 3-5 test orders
- Assign orders to workflow stages

### 3. Monitoring Tools

Have ready:
- Supabase Dashboard (Functions logs, Database activity)
- Browser DevTools (Console, Network tab)
- Two browser sessions (real-time testing)

## Test Scenarios

### Test 1: Complete Order Lifecycle

**Objective:** Verify an order can progress through all 10 workflow stages

**Steps:**
1. Navigate to `/dashboard/orders/new`
2. Create a new order:
   - Select customer
   - Add 2 order items (e.g., Suit, Shirt)
   - Set delivery date
   - Add advance payment
   - Submit order

3. Verify order appears in workflow dashboard:
   - Go to `/dashboard/workflow`
   - Confirm order in "Consultation" stage
   - Check order card shows correct customer name

4. Progress through each stage:
   - Click on order card
   - Click "Change Status" button
   - Select next status
   - Add notes
   - Save

5. Verify at EACH stage:
   - Toast notification appears ("Order status updated to...")
   - Order moves to correct column in Kanban board
   - Order detail page reflects new status
   - Timeline shows status change entry
   - Progress percentage updates

6. Complete the workflow:
   - Consultation (0%)
   - Measurement (10%)
   - Design Approval (20%)
   - Cutting (30%)
   - First Fitting (40%)
   - Sewing (60%)
   - Quality Check (80%)
   - Final Fitting (90%)
   - Completion (95%)
   - Delivery (100%)

**Expected Results:**
- All status changes successful
- Toast notifications for each change
- Order appears in correct stage columns
- Timeline accurate and complete
- No errors in console
- Final status: Delivered, 100% complete

**Pass Criteria:**
- Order successfully moves through all 10 stages
- All toast notifications appear
- No JavaScript errors
- Data persists correctly

---

### Test 2: Real-Time Multi-User Updates

**Objective:** Verify real-time synchronization across multiple sessions

**Setup:**
- Open two browser windows side-by-side
- Login as same user in both
- Navigate to workflow dashboard in both

**Steps:**

1. **Window 1 (Primary):**
   - Select an order from any stage
   - Open order detail page
   - Click "Change Status"
   - Select different status
   - Add note: "Testing real-time sync"
   - Save

2. **Window 2 (Observer):**
   - Watch workflow dashboard
   - Observe without refreshing

3. **Verification in Window 2:**
   - Toast notification appears: "Workflow status updated"
   - Order moves to new stage column automatically
   - No manual refresh needed
   - Update happens within 1-2 seconds

4. **Repeat Test:**
   - Window 2: Make a status change
   - Window 1: Observe automatic update
   - Verify bidirectional synchronization

**Expected Results:**
- Changes appear in real-time (< 2 seconds)
- Toast notifications in observing window
- No page refresh required
- Data consistency across sessions
- WebSocket connection established (check Network tab)

**Pass Criteria:**
- Both windows show synchronized data
- Real-time updates work bidirectionally
- Toast notifications appear for updates
- No console errors
- Network tab shows WebSocket connection

---

### Test 3: Workflow Analytics & Bottleneck Detection

**Objective:** Validate analytics calculation and bottleneck identification

**Steps:**

1. **Setup Test Conditions:**
   - Create 5 orders
   - Assign 3 orders to "Sewing" stage
   - Leave them there for several hours (or modify entered_at timestamp in DB)
   - Distribute other orders across stages

2. **Trigger Analytics Calculation:**
   - Wait for hourly cron job, OR
   - Manually trigger via Supabase Functions:
     ```bash
     curl -X POST https://[PROJECT].supabase.co/functions/v1/calculate-workflow-analytics \
       -H "Authorization: Bearer [ANON_KEY]"
     ```

3. **Check Analytics Dashboard:**
   - Navigate to `/dashboard/workflow/analytics`
   - Review metrics:
     - Average completion time per stage
     - Bottleneck scores (0-100)
     - Efficiency ratings
     - Stage with most orders

4. **Verify Bottleneck Detection:**
   - "Sewing" stage should have high bottleneck score (> 50)
   - Red indicator should appear
   - Alert icon should be visible
   - Recommended action should display

5. **Check Automation Rules:**
   - Navigate to `/dashboard/workflow/manage`
   - Verify automation rules are active
   - Check "Delay Alert - 48 Hours" rule
   - Confirm it processed delayed orders

**Expected Results:**
- Analytics calculated correctly
- Bottleneck scores accurate
- Visual indicators for high scores (> 50)
- Automation rules triggered
- No calculation errors

**Pass Criteria:**
- All analytics metrics display correctly
- Bottlenecks identified accurately
- Visual alerts appropriate to data
- Automation rules execute
- Edge function logs show no errors

---

### Test 4: Toast Notification System

**Objective:** Validate all notification types and behaviors

**Test Cases:**

#### 4.1 Success Notifications
1. Create new order → "Order created successfully"
2. Update order status → "Order status updated to..."
3. Send customer update → "Update sent successfully to customer"
4. Save automation rule → "Automation rule saved"

#### 4.2 Error Notifications
1. Disconnect network
2. Try to load workflow dashboard
3. Verify error toast: "Failed to load workflow data..."
4. Reconnect network
5. Reload and verify success toast

#### 4.3 Info Notifications
1. Real-time update detected → "Workflow status updated"
2. Order updated externally → "Order updated"
3. Print button clicked → "Print functionality..."

#### 4.4 Warning Notifications (if implemented)
- Test any warning scenarios

#### 4.5 Multiple Toast Handling
1. Trigger 3 rapid actions (e.g., status changes)
2. Verify all 3 toasts appear stacked
3. Verify they auto-dismiss in order
4. Confirm no overlap or visual glitches

#### 4.6 Manual Dismiss
1. Trigger any toast
2. Click X button
3. Verify immediate dismissal
4. Confirm no console errors

#### 4.7 Auto-Dismiss Timing
1. Trigger success toast
2. Start timer
3. Verify toast disappears after ~5 seconds
4. Confirm no residual elements

**Expected Results:**
- All notification types display correctly
- Colors match severity (green, red, blue, yellow)
- Icons appropriate to type
- Auto-dismiss works (5 seconds)
- Manual close works
- Multiple toasts stack properly
- No z-index issues
- Smooth animations

**Pass Criteria:**
- 100% of notification scenarios work
- All toast types render correctly
- No visual glitches
- Timing accurate
- Mobile responsive

---

### Test 5: Error Handling & Recovery

**Objective:** Validate graceful error handling and recovery

**Test Cases:**

#### 5.1 Network Interruption
1. Load workflow dashboard
2. Open DevTools → Network tab
3. Throttle to "Offline"
4. Try to change order status
5. Verify error toast appears
6. Restore network
7. Retry action
8. Verify success

#### 5.2 Invalid Data
1. Open order edit page
2. Enter invalid data (e.g., negative amount)
3. Submit form
4. Verify validation error toast
5. Correct data
6. Verify success toast

#### 5.3 Permission Errors (if RLS configured)
1. Create test user with limited role
2. Try to access restricted data
3. Verify appropriate error message
4. Confirm graceful handling

#### 5.4 Concurrent Modifications
1. Open same order in two windows
2. Window 1: Change status to "In Progress"
3. Window 2: Simultaneously change to "Delivered"
4. Verify:
   - One change succeeds
   - Real-time sync updates other window
   - No data corruption
   - Consistent final state

**Expected Results:**
- All errors caught and handled
- User-friendly error messages
- No uncaught exceptions
- No white screen of death
- Graceful degradation
- Recovery after error correction

**Pass Criteria:**
- 100% error handling coverage
- No unhandled promise rejections
- Console shows no errors
- Application remains functional
- Data integrity maintained

---

### Test 6: Workflow Automation

**Objective:** Verify automation rules execute correctly

**Setup:**
Review automation rules in `/dashboard/workflow/manage`:
1. Delay Alert - 48 Hours
2. Fitting Notification
3. Milestone Progress Update
4. Quality Check Alert

**Test Procedure:**

#### 6.1 Time-Based Rule (Delay Alert)
1. Create order and assign to "Cutting" stage
2. Modify `entered_at` in database to 50 hours ago:
   ```sql
   UPDATE order_workflow_statuses
   SET entered_at = NOW() - INTERVAL '50 hours'
   WHERE order_id = '[order_id]';
   ```
3. Wait 5 minutes (automation runs every 5 min)
4. Check Supabase Functions logs
5. Verify notification created
6. Check application for alert

#### 6.2 Status Change Rule (Fitting Notification)
1. Move order to "First Fitting" stage
2. Save status change
3. Check communications table
4. Verify notification sent to customer
5. Review Functions logs

#### 6.3 Milestone Rule
1. Complete a workflow milestone
2. Save milestone completion
3. Verify progress percentage updates
4. Check workflow status updated

**Expected Results:**
- Automation rules trigger on schedule
- Time-based rules process delayed orders
- Status change rules execute on transitions
- Notifications created correctly
- Edge functions log successful execution
- No errors in Supabase logs

**Pass Criteria:**
- All 4 automation rules tested
- Rules execute correctly
- Logs show successful runs
- No failed executions
- Database updates correct

---

### Test 7: Mobile Responsiveness

**Objective:** Validate UI works on mobile devices

**Test Devices:**
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad)

**Test Areas:**

1. **Workflow Dashboard**
   - Navigate to `/dashboard/workflow`
   - Verify Kanban columns scroll horizontally
   - Tap order card
   - Verify detail view opens
   - Check toast notifications visible

2. **Order Detail Page**
   - Open any order
   - Verify tabs work (swipe/tap)
   - Test "Change Status" button
   - Verify modal displays correctly
   - Complete status change

3. **Navigation**
   - Test mobile menu (hamburger)
   - Verify all menu items accessible
   - Check logout works

4. **Forms**
   - Test order creation form
   - Verify inputs accessible
   - Check date pickers work
   - Verify dropdown selections

**Expected Results:**
- All pages responsive
- Touch targets adequate size
- Text readable without zoom
- Forms fully functional
- Navigation intuitive
- Toast notifications visible
- No horizontal scroll (except Kanban)

**Pass Criteria:**
- 100% mobile functionality
- No broken layouts
- Touch interactions smooth
- Forms submit correctly
- Professional appearance

---

### Test 8: Performance & Load Testing

**Objective:** Validate system performs under load

**Test Scenarios:**

#### 8.1 Large Dataset
1. Create 50+ orders in database
2. Assign across all workflow stages
3. Load workflow dashboard
4. Measure load time (< 3 seconds ideal)
5. Verify smooth scrolling
6. Test real-time updates still work

#### 8.2 Rapid Status Changes
1. Change order status 10 times rapidly
2. Verify all changes persist
3. Check timeline shows all entries
4. Confirm no race conditions
5. Verify real-time updates don't break

#### 8.3 Multiple Concurrent Users
1. 5+ users access system simultaneously
2. All users make status changes
3. Verify real-time sync works for all
4. Check database consistency
5. Monitor Supabase metrics

#### 8.4 WebSocket Connections
1. Open 10 browser tabs
2. Each tab: workflow dashboard
3. Verify all tabs get real-time updates
4. Check Supabase connection limits
5. Monitor memory usage

**Expected Results:**
- Load time < 3 seconds for 50 orders
- Smooth scrolling with large datasets
- No UI lag during operations
- Real-time updates scale to multiple users
- Database queries optimized
- WebSocket connections stable

**Pass Criteria:**
- Page load < 3 seconds
- No performance degradation
- Real-time works with 10+ connections
- Memory usage reasonable
- No connection drops

---

### Test 9: Data Integrity

**Objective:** Ensure data consistency across system

**Verification Points:**

1. **Order Status Consistency**
   - Check order status matches workflow status
   - Verify progress percentage aligns
   - Confirm timeline matches current state

2. **Workflow Analytics Accuracy**
   - Manually calculate stage metrics
   - Compare with analytics table
   - Verify bottleneck scores correct

3. **Automation Tracking**
   - Check all automation executions logged
   - Verify notifications created
   - Confirm database triggers fired

4. **Milestone Tracking**
   - Verify milestones match order stage
   - Check completion status accurate
   - Confirm timestamps correct

**SQL Verification Queries:**

```sql
-- Check order-workflow consistency
SELECT o.id, o.status, ows.current_status, o.progress_percentage
FROM orders o
LEFT JOIN order_workflow_statuses ows ON ows.order_id = o.id
WHERE o.status != ows.current_status;

-- Verify milestone completion
SELECT order_id, COUNT(*) as total, 
       SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed
FROM workflow_milestones
GROUP BY order_id;

-- Check automation rule execution
SELECT rule_name, COUNT(*) as executions, MAX(created_at) as last_run
FROM automation_rules
GROUP BY rule_name;
```

**Expected Results:**
- Zero inconsistencies
- All relationships valid
- Timestamps logical
- No orphaned records
- Foreign keys intact

**Pass Criteria:**
- 100% data integrity
- All verification queries pass
- No data anomalies
- Referential integrity maintained

---

### Test 10: Edge Cases

**Objective:** Validate system handles edge cases

**Test Cases:**

#### 10.1 Empty States
1. New organization with no data
2. Verify workflow dashboard shows empty state
3. Check analytics show "No data" message
4. Confirm no console errors

#### 10.2 Deleted Records
1. Delete a customer
2. Check their orders still accessible
3. Verify foreign key constraints
4. Confirm graceful handling

#### 10.3 Status Rollback
1. Move order from "Delivery" back to "Cutting"
2. Verify timeline shows rollback
3. Check progress percentage adjusts
4. Confirm milestones update

#### 10.4 Duplicate Actions
1. Double-click "Change Status" button rapidly
2. Verify only one update processes
3. Check no duplicate entries created
4. Confirm database constraints prevent duplicates

#### 10.5 Session Timeout
1. Leave application idle for extended period
2. Try to make changes
3. Verify session handled correctly
4. Check user redirected to login if needed

**Expected Results:**
- All edge cases handled gracefully
- No application crashes
- Appropriate error messages
- Data integrity maintained
- User experience smooth

**Pass Criteria:**
- 100% edge case coverage
- No unhandled scenarios
- Professional error handling
- Application remains stable

---

## Test Results Template

Use this template to document test results:

```
Test Date: [Date]
Tester: [Name]
Environment: [Production URL]
Browser: [Chrome/Safari/Firefox] [Version]

┌─────────────────────────┬────────┬─────────────────────┐
│ Test Scenario           │ Status │ Notes               │
├─────────────────────────┼────────┼─────────────────────┤
│ 1. Order Lifecycle      │ PASS   │                     │
│ 2. Real-Time Updates    │ PASS   │                     │
│ 3. Analytics            │ PASS   │                     │
│ 4. Toast Notifications  │ PASS   │                     │
│ 5. Error Handling       │ PASS   │                     │
│ 6. Automation           │ PASS   │                     │
│ 7. Mobile Responsive    │ PASS   │                     │
│ 8. Performance          │ PASS   │                     │
│ 9. Data Integrity       │ PASS   │                     │
│ 10. Edge Cases          │ PASS   │                     │
└─────────────────────────┴────────┴─────────────────────┘

Overall Result: PASS / FAIL
```

## Acceptance Criteria

For production release approval, all tests must:
- [ ] Pass without errors
- [ ] No console errors or warnings
- [ ] Real-time updates work consistently
- [ ] Toast notifications appear correctly
- [ ] Data integrity maintained
- [ ] Performance within acceptable limits
- [ ] Mobile responsive
- [ ] Edge cases handled
- [ ] Automation rules execute
- [ ] Multi-user scenarios work

## Post-Test Actions

1. **Document Issues:** Create tickets for any failures
2. **Performance Baseline:** Record metrics for future comparison
3. **User Feedback:** Gather feedback from test users
4. **Monitoring Setup:** Configure production monitoring
5. **Backup Verification:** Confirm backup strategy working

---

**Guide Version:** 1.0  
**Last Updated:** 2025-11-06  
**Author:** MiniMax Agent  
**Project:** Tailoring CRM - Workflow System
