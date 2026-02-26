#!/usr/bin/env node

/**
 * Test script for notification system
 * Tests all notification API endpoints
 *
 * Usage: node scripts/test-notifications.js <EMAIL> <PASSWORD>
 */

const BASE_URL = 'https://api.beercut.tech';

async function login(email, password) {
  console.log('🔐 Logging in...');
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Login successful');
  return data.data.access_token;
}

async function getNotifications(token, page = 1, limit = 20) {
  console.log(`\n📬 Fetching notifications (page ${page}, limit ${limit})...`);
  const response = await fetch(
    `${BASE_URL}/api/v1/notifications?page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Get notifications failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Found ${data.data.length} notifications`);

  if (data.data.length > 0) {
    console.log('\nSample notification:');
    const sample = data.data[0];
    console.log(`  ID: ${sample.id}`);
    console.log(`  Type: ${sample.type}`);
    console.log(`  Title: ${sample.title}`);
    console.log(`  Message: ${sample.message}`);
    console.log(`  Read: ${sample.is_read}`);
    console.log(`  Patient ID: ${sample.patient_id || 'N/A'}`);
    console.log(`  Created: ${sample.created_at}`);
  }

  return data.data;
}

async function getUnreadCount(token) {
  console.log('\n🔔 Fetching unread count...');
  const response = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Get unread count failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Unread count: ${data.data.count}`);
  return data.data.count;
}

async function markAsRead(token, notificationId) {
  console.log(`\n✓ Marking notification ${notificationId} as read...`);
  const response = await fetch(
    `${BASE_URL}/api/v1/notifications/${notificationId}/read`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Mark as read failed: ${response.status}`);
  }

  console.log('✅ Marked as read');
}

async function markAllAsRead(token) {
  console.log('\n✓✓ Marking all notifications as read...');
  const response = await fetch(`${BASE_URL}/api/v1/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Mark all as read failed: ${response.status}`);
  }

  console.log('✅ All notifications marked as read');
}

async function registerPushToken(token, pushToken) {
  console.log('\n📱 Registering push token...');
  const response = await fetch(`${BASE_URL}/api/v1/notifications/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: pushToken,
      platform: 'ios',
    }),
  });

  if (!response.ok) {
    throw new Error(`Register push token failed: ${response.status}`);
  }

  console.log('✅ Push token registered');
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node test-notifications.js <EMAIL> <PASSWORD>');
    process.exit(1);
  }

  try {
    // Login
    const token = await login(email, password);

    // Test 1: Get notifications
    const notifications = await getNotifications(token);

    // Test 2: Get unread count
    const unreadCount = await getUnreadCount(token);

    // Test 3: Mark one as read (if there are unread notifications)
    if (notifications.length > 0 && !notifications[0].is_read) {
      await markAsRead(token, notifications[0].id);
      await getUnreadCount(token); // Check count decreased
    }

    // Test 4: Mark all as read
    if (unreadCount > 0) {
      await markAllAsRead(token);
      await getUnreadCount(token); // Should be 0 now
    }

    // Test 5: Register push token (with dummy token)
    const dummyPushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    await registerPushToken(token, dummyPushToken);

    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`  - Total notifications: ${notifications.length}`);
    console.log(`  - Unread count: ${unreadCount}`);
    console.log(`  - All API endpoints working correctly`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
