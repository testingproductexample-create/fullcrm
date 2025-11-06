import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push with VAPID keys
// In production, these should be environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key',
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

interface NotificationPayload {
  title: string;
  body: string;
  type?: 'order' | 'appointment' | 'compliance' | 'general';
  data?: any;
  userId?: string;
  userIds?: string[];
  icon?: string;
  badge?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json();
    
    // Validate payload
    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine target users
    let targetUserIds: string[] = [];
    
    if (payload.userId) {
      targetUserIds = [payload.userId];
    } else if (payload.userIds) {
      targetUserIds = payload.userIds;
    } else {
      // Send to all users if no specific targets
      const { data: users, error: usersError } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .not('user_id', 'is', null);
      
      if (usersError) {
        throw usersError;
      }
      
      targetUserIds = [...new Set(users.map(u => u.user_id))];
    }

    // Get subscriptions for target users
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No subscriptions found', sent: 0 },
        { status: 200 }
      );
    }

    // Prepare notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      data: {
        type: payload.type || 'general',
        url: getNotificationUrl(payload.type, payload.data),
        timestamp: new Date().toISOString(),
        ...payload.data
      },
      actions: payload.actions || [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: payload.type === 'compliance' || payload.type === 'appointment',
      vibrate: [200, 100, 200],
      tag: `${payload.type}-${Date.now()}`,
    };

    // Send notifications
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth_key,
            p256dh: subscription.p256dh_key,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );

        return { success: true, userId: subscription.user_id };
      } catch (error) {
        console.error(`Failed to send notification to user ${subscription.user_id}:`, error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }

        return { success: false, userId: subscription.user_id, error: error.message };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Log notification in database
    await supabase
      .from('notification_logs')
      .insert({
        title: payload.title,
        body: payload.body,
        type: payload.type || 'general',
        target_users: targetUserIds,
        sent_count: successful,
        failed_count: failed,
        payload: notificationPayload,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      message: 'Notifications sent',
      sent: successful,
      failed: failed,
      total: results.length
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getNotificationUrl(type?: string, data?: any): string {
  switch (type) {
    case 'order':
      return data?.orderId ? `/dashboard/orders/${data.orderId}` : '/dashboard/orders';
    case 'appointment':
      return data?.appointmentId ? `/dashboard/appointments/${data.appointmentId}` : '/dashboard/appointments';
    case 'compliance':
      return '/dashboard/visa-compliance';
    default:
      return '/dashboard';
  }
}

// Test endpoint for sending notifications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  
  if (test === 'true') {
    // Send test notification
    const testPayload = {
      title: 'Test Notification',
      body: 'This is a test notification from Tailoring CRM PWA',
      type: 'general' as const,
      icon: '/icons/icon-192x192.png'
    };

    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(testPayload)
    });

    return POST(mockRequest);
  }

  return NextResponse.json({ message: 'Push notification service is running' });
}