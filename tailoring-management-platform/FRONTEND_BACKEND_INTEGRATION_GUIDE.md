# Frontend-Backend Integration Guide

## Overview
This guide documents the Supabase integration for Communication Systems and Analytics Dashboard.

## Completed Infrastructure

### 1. React Query Setup
- **Provider**: Already configured in `/components/providers.tsx`
- **Devtools**: Installed for debugging

### 2. Custom Hooks Created

#### Communication Hooks (`/hooks/useCommunication.ts`)
```typescript
// Data fetching hooks
useCommunicationChannels(organizationId)
useCustomerCommunications(organizationId, filters)
useMessageTemplates(organizationId, channelType)
useBulkCampaigns(organizationId)
useCommunicationAnalytics(organizationId, dateRange)
useAutomatedNotifications(organizationId)
useChatSessions(organizationId, status)
useVideoConsultations(organizationId, status)

// Mutation hooks
useCreateMessageTemplate()
useSendBulkMessage()
useUpdateChannel()
```

#### Analytics Hooks (`/hooks/useAnalytics.ts`)
```typescript
// Data fetching hooks
useBusinessIntelligence(organizationId, filters)
useKPIMetrics(organizationId)
useCustomReports(organizationId)
useDashboardConfigs(userId)
usePerformanceMetrics(organizationId, metricType)
useTrendAnalysis(organizationId, metricName)
useReportSchedules(organizationId)

// Mutation hooks
useCreateCustomReport()
useUpdateKPIMetric()
useSaveDashboardConfig()
useCreateReportSchedule()
```

#### Auth Hook (`/hooks/useAuth.ts`)
```typescript
const { user, session, loading } = useAuth();
const organizationId = user?.user_metadata?.organization_id || 'default-id';
```

### 3. Database Tables Available

#### Communication Tables (10)
1. `communication_channels` - Channel configurations
2. `customer_communications` - Message history
3. `message_templates` - Reusable templates
4. `automated_notifications` - System notifications
5. `chat_sessions` - Live chat sessions
6. `chat_messages` - Chat history
7. `video_consultations` - Video appointments
8. `bulk_messaging` - Campaign management
9. `communication_preferences` - User preferences
10. `communication_analytics` - Performance metrics

#### Analytics Tables (9)
1. `business_intelligence` - Cross-system analytics
2. `kpi_metrics` - Key performance indicators
3. `custom_reports` - User-defined reports
4. `dashboard_configs` - Dashboard layouts
5. `performance_metrics` - Real-time metrics
6. `trend_analysis` - Trend data
7. `report_schedules` - Automated reports
8. `communication_analytics` - (shared)
9. Additional analytics tables from existing systems

## Integration Pattern

### Step 1: Import Required Hooks
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCustomerCommunications, useMessageTemplates } from '@/hooks/useCommunication';
```

### Step 2: Get Organization Context
```typescript
const { user } = useAuth();
const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
```

### Step 3: Fetch Data with Hooks
```typescript
const { data: communications, isLoading, error } = useCustomerCommunications(organizationId);
const { data: templates } = useMessageTemplates(organizationId, 'sms');
```

### Step 4: Replace Mock Data
```typescript
// Before (mock data)
const [messages, setMessages] = useState([...mockData]);

// After (real data)
const messages = communications || [];
```

### Step 5: Handle Loading and Error States
```typescript
if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
```

### Step 6: Use Mutations for Create/Update/Delete
```typescript
const createTemplate = useCreateMessageTemplate();

const handleSubmit = async (data) => {
  await createTemplate.mutateAsync({
    organization_id: organizationId,
    name: data.name,
    channel_type: 'sms',
    content: data.content,
    ...data
  });
};
```

## Examples

### Example 1: SMS Management Page
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCustomerCommunications, useCreateMessageTemplate } from '@/hooks/useCommunication';

export default function SMSManagement() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
  
  const { data: smsMessages, isLoading } = useCustomerCommunications(organizationId, { channel: 'sms' });
  
  const stats = {
    totalSent: smsMessages?.filter(m => m.status === 'sent').length || 0,
    delivered: smsMessages?.filter(m => m.status === 'delivered').length || 0,
    pending: smsMessages?.filter(m => m.status === 'pending').length || 0,
  };
  
  return (
    <div>
      <h1>SMS Management</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div>Total Sent: {stats.totalSent}</div>
          <div>Delivered: {stats.delivered}</div>
          <div>Pending: {stats.pending}</div>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Analytics KPI Page
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useKPIMetrics, useUpdateKPIMetric } from '@/hooks/useAnalytics';

export default function PerformanceTracking() {
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000000';
  
  const { data: kpis, isLoading } = useKPIMetrics(organizationId);
  const updateKPI = useUpdateKPIMetric();
  
  const handleUpdateKPI = async (id: string, value: number) => {
    await updateKPI.mutateAsync({ id, updates: { current_value: value } });
  };
  
  return (
    <div>
      <h1>KPI Tracking</h1>
      {isLoading ? (
        <div>Loading KPIs...</div>
      ) : (
        <div>
          {kpis?.map(kpi => (
            <div key={kpi.id}>
              <h3>{kpi.kpi_name}</h3>
              <p>Current: {kpi.current_value}</p>
              <p>Target: {kpi.target_value}</p>
              <p>Progress: {((kpi.current_value / kpi.target_value) * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Integration Checklist for Each Page

- [ ] Import `useAuth` hook
- [ ] Get `organizationId` from user metadata
- [ ] Import relevant data hooks from `/hooks/useCommunication.ts` or `/hooks/useAnalytics.ts`
- [ ] Replace useState mock data with hook data
- [ ] Add loading states (`isLoading`)
- [ ] Add error handling
- [ ] Update calculations to use real data
- [ ] Test CRUD operations with mutation hooks

## Best Practices

1. **Always handle loading states**: Show spinners or skeletons while data loads
2. **Error handling**: Display user-friendly error messages
3. **Optimistic updates**: Use React Query's optimistic update patterns
4. **Real-time subscriptions**: Add Supabase real-time listeners for live updates (future enhancement)
5. **Data validation**: Validate data before mutations
6. **Toast notifications**: Already configured in mutation hooks

## Next Steps

1. Complete integration for remaining 15 pages using the patterns above
2. Add sample data to database tables for testing
3. Test all CRUD operations
4. Add real-time subscriptions for live updates
5. Implement error boundaries
6. Add loading skeletons instead of simple text
7. Test with production deployment

## Files Modified

- ✅ `/lib/react-query-provider.tsx` (new)
- ✅ `/hooks/useCommunication.ts` (new)
- ✅ `/hooks/useAnalytics.ts` (new)
- ✅ `/hooks/useAuth.ts` (new)
- ✅ `/components/auth-provider.tsx` (updated - exported AuthContext)
- ✅ `/app/communication/page.tsx` (integrated)
- ✅ `/app/analytics/page.tsx` (integrated)

## Database Migration Status

✅ All 9 backend tables created successfully via migration:
- automated_notifications
- bulk_messaging
- business_intelligence
- kpi_metrics
- custom_reports
- dashboard_configs
- performance_metrics
- trend_analysis
- report_schedules

Existing tables already in database:
- communication_channels
- customer_communications
- communication_preferences
- communication_analytics

## Testing Recommendations

1. **Create sample data**: Insert test records into all tables
2. **Test each hook**: Verify queries return expected data
3. **Test mutations**: Create, update, delete operations
4. **Performance**: Monitor query performance with React Query Devtools
5. **Edge cases**: Test with empty states, errors, large datasets

---

Created: 2025-11-10 16:47:08
Status: 2/17 pages integrated, infrastructure complete
