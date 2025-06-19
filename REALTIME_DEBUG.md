# Realtime Messaging Debug Guide

## 🚨 Common Issue: Messages Not Appearing in Real-time

If messages only appear after refreshing, follow these troubleshooting steps:

## ✅ Step 1: Check Supabase Realtime Configuration

**CRITICAL**: Realtime must be enabled on your Supabase tables:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Database** → **Tables**
3. Click on the **`deals`** table
4. Click **"Enable Realtime"** button (if not already enabled)
5. Click on the **`dms`** table  
6. Click **"Enable Realtime"** button (if not already enabled)

**Without this step, realtime subscriptions will fail silently!**

## ✅ Step 2: Test Database Connection

1. Open the app and go to **More** tab
2. Tap **"🧪 RT Test"** button
3. Check console logs for:
   - `✅ Database connection successful`
   - `✅ Successfully connected to realtime`
   - Connection status indicator (green dot)

## ✅ Step 3: Test Message Creation

1. In the RT Test screen, tap **"Send Test Message"**
2. Watch the console logs for:
   - `✅ Test message created successfully`
   - `🎉 REALTIME EVENT RECEIVED`
   - Message appearing instantly in the list

## ✅ Step 4: Check Console Logs

Look for these key log messages:

### ✅ Good Signs:
```
🚀 Setting up realtime subscriptions...
📡 Creating public channel: public-messages-1-1234567890
✅ Successfully subscribed to public messages
🎉 === PUBLIC MESSAGE RECEIVED ===
```

### ❌ Bad Signs:
```
❌ Error subscribing to public messages
⏰ Timeout subscribing to public messages
🔒 Public channel subscription closed
```

## ✅ Step 5: Verify Environment Variables

Check your `.env` file contains:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## ✅ Step 6: Check Supabase Project Status

1. Go to Supabase Dashboard
2. Check if your project is **Active** (not paused)
3. Verify **API** tab shows correct URL and keys
4. Check **Database** → **Extensions** → ensure **pg_stat_statements** is enabled

## ✅ Step 7: Test Network Connectivity

If on mobile device:
1. Ensure device and development machine are on same network
2. Try switching between WiFi and mobile data
3. Check if firewall is blocking connections

## ✅ Step 8: Row Level Security (RLS) Check

RLS policies might be blocking realtime events:

1. Go to **Database** → **Authentication** → **Policies**
2. For `deals` table, ensure you have policies that allow:
   - `SELECT` for authenticated users
   - `INSERT` for authenticated users
3. For `dms` table, ensure similar policies exist

Example policy for `deals` table:
```sql
-- Enable INSERT for authenticated users
CREATE POLICY "Users can insert deals" ON deals
FOR INSERT TO authenticated
WITH CHECK (true);

-- Enable SELECT for authenticated users  
CREATE POLICY "Users can view deals" ON deals
FOR SELECT TO authenticated
USING (true);
```

## ✅ Step 9: Clear App Cache and Restart

1. Stop the development server
2. Clear Metro cache: `npx expo start --clear`
3. Restart the app

## ✅ Step 10: Test in Different Environments

1. **Development**: Test with `npx expo start`
2. **Device**: Test with Expo Go app
3. **Production**: Test with built APK/IPA

## 🔧 Advanced Debugging

### Enable Detailed Logging

Add this to your `lib/supabase.ts`:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    log_level: 'debug', // Add this line
  },
});
```

### Check Active Channels

Add this debug function to your component:

```typescript
const debugChannels = () => {
  const channels = supabase.getChannels();
  console.log('Active channels:', channels.map(ch => ({
    topic: ch.topic,
    state: ch.state,
    joinRef: ch.joinRef
  })));
};
```

## 🚨 Most Likely Causes

Based on common issues, the problem is usually:

1. **90% - Realtime not enabled on Supabase tables** ⚠️
2. **5% - RLS policies blocking access**
3. **3% - Network connectivity issues**
4. **2% - Environment variable issues**

## ✅ Quick Fix Checklist

- [ ] Realtime enabled on `deals` table
- [ ] Realtime enabled on `dms` table  
- [ ] RLS policies allow SELECT/INSERT
- [ ] Environment variables correct
- [ ] Supabase project is active
- [ ] Console shows "Successfully subscribed"
- [ ] Test button creates messages instantly

## 📞 Still Not Working?

If after following all steps realtime still doesn't work:

1. Share console logs from the RT Test
2. Check Supabase Dashboard → **Logs** for errors
3. Verify your Supabase subscription plan supports realtime
4. Try creating a minimal test with just one subscription

## 💡 Alternative: Manual Polling

As a temporary workaround, you can implement polling:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadPublicMessages(); // Refresh every 3 seconds
  }, 3000);
  
  return () => clearInterval(interval);
}, []);
```

But this is not recommended for production as it uses more resources. 