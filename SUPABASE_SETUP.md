# Deals Room - Supabase Integration Setup Guide

This guide will help you connect your existing Supabase database to your React Native/Expo Deals Room application.

## 📋 Prerequisites

- An existing Supabase project with the Deals Room database schema
- Your Supabase project URL and anon key

## 🚀 Setup Steps

### 1. Configure Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find these values:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy your Project URL and anon public key

### 2. Dependencies Installed

The following packages have been installed for you:
- `@supabase/supabase-js` - Supabase client library
- `react-native-url-polyfill` - Required for React Native compatibility

### 3. Project Structure

The integration includes:

```
lib/
├── supabase.ts     # Supabase client configuration
├── database.ts     # Database operations for your schema
├── types.ts        # TypeScript types for your database
└── index.ts        # Exports for easy importing

components/
├── DealsRoomExample.tsx  # Demo component with your data
└── SupabaseExample.tsx   # Generic example component
```

## 🗄️ Your Database Schema

Your Deals Room application includes the following tables:

### Core Tables
- **users** - User management and authentication
- **sellers** - Seller profiles and business information
- **deals** - Deal management and tracking
- **dms** - Direct messaging between users

### Product & Service Tables
- **products** - Product catalog
- **announcements** - Marketing announcements
- **tenders** - Government/business tenders
- **land_listings** - Land and property listings
- **machines** - Construction machinery
- **materials** - Building materials
- **jobs** - Job postings
- **equipment** - Equipment listings
- **tools** - Tool rentals/sales

### Additional Tables
- **notifications** - User notifications
- **portfolios** - Seller portfolios
- **gigs** - Service offerings
- **audit_logs** - Activity tracking

## 📖 Usage Examples

### Authentication

```typescript
import { auth } from '@/lib';

// Sign up a new user
const { data, error } = await auth.signUp('user@example.com', 'password');

// Sign in
const { data, error } = await auth.signIn('user@example.com', 'password');

// Get current user
const { data: { user } } = await auth.getCurrentUser();
```

### Working with Deals

```typescript
import { deals, users } from '@/lib';
import type { InsertDeal } from '@/lib';

// Get all active deals
const { data: activeDeals, error } = await deals.getActive();

// Create a new deal
const newDeal: InsertDeal = {
  title: 'Construction Materials Deal',
  description: 'Bulk cement and steel supply',
  category: 'Construction',
  status: 'active',
  sender_id: 1,
};

const { data: createdDeal, error } = await deals.create(newDeal);

// Get deals by user
const { data: userDeals, error } = await deals.getBySenderId(userId);
```

### Working with Products

```typescript
import { products } from '@/lib';
import type { InsertProduct } from '@/lib';

// Get all active products
const { data: allProducts, error } = await products.getActive();

// Get products by category
const { data: machines, error } = await products.getByCategory('Machines');

// Create a new product
const newProduct: InsertProduct = {
  seller_id: 1,
  name: 'Excavator JCB 3DX',
  description: 'Heavy duty excavator for construction',
  price: '1500000',
  category: 'Machines',
  brand_name: 'JCB',
  model: '3DX',
  status: 'active',
};

const { data: createdProduct, error } = await products.create(newProduct);
```

### Working with Tenders

```typescript
import { tenders } from '@/lib';
import type { InsertTender } from '@/lib';

// Get all active tenders
const { data: activeTenders, error } = await tenders.getActive();

// Get tenders by engineering category
const { data: civilTenders, error } = await tenders.getByCategory('civil');

// Create a new tender
const newTender: InsertTender = {
  user_id: 1,
  upc_ref: 'UPC2024001',
  engineering_category: 'civil',
  specialization: 'Road Construction',
  tender_name: 'Highway Construction Project',
  location: 'Mumbai, Maharashtra',
  scope: 'Construction of 50km highway',
  estimated_value: '50000000',
  collection_date: '2024-02-01T10:00:00Z',
  submission_date: '2024-02-15T17:00:00Z',
  contact_name: 'Project Manager',
  contact_number: '+91-9876543210',
  contact_email: 'pm@construction.com',
  address: 'Project Office, Mumbai',
  document_urls: [],
  status: 'active',
};

const { data: createdTender, error } = await tenders.create(newTender);
```

### Working with Announcements

```typescript
import { announcements } from '@/lib';

// Get all active announcements
const { data: activeAnnouncements, error } = await announcements.getActive();

// Get announcements by category
const { data: businessAnnouncements, error } = await announcements.getByCategory('BUSINESS RESOURCES');
```

### Working with Direct Messages

```typescript
import { dms } from '@/lib';
import type { InsertDM } from '@/lib';

// Get conversation between two users
const { data: conversation, error } = await dms.getConversation(userId1, userId2);

// Send a message
const newMessage: InsertDM = {
  message: 'Hello, I am interested in your product.',
  sender_id: 1,
  receiver_id: 2,
  deal_id: 123, // optional
  is_read: false,
};

const { data: sentMessage, error } = await dms.send(newMessage);

// Mark message as read
const { data: updatedMessage, error } = await dms.markAsRead(messageId);
```

### Working with Notifications

```typescript
import { notifications } from '@/lib';

// Get user notifications
const { data: userNotifications, error } = await notifications.getUserNotifications(userId);

// Get unread count
const { count: unreadCount, error } = await notifications.getUnreadCount(userId);

// Mark notification as read
const { data: updatedNotification, error } = await notifications.markAsRead(notificationId);

// Mark all notifications as read
const { data: updatedNotifications, error } = await notifications.markAllAsRead(userId);
```

## 🔧 Customization

### Adding Real-time Subscriptions

```typescript
import { supabase } from '@/lib';

// Listen to new deals
const dealsSubscription = supabase
  .channel('deals_changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'deals' },
    (payload) => {
      console.log('New deal created!', payload.new);
    }
  )
  .subscribe();

// Listen to new messages
const messagesSubscription = supabase
  .channel('messages_changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'dms' },
    (payload) => {
      console.log('New message!', payload.new);
    }
  )
  .subscribe();
```

### Custom Queries

```typescript
import { supabase } from '@/lib';

// Search products by name
const searchProducts = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .eq('status', 'active');
  return { data, error };
};

// Get deals with user information
const getDealsWithUsers = async () => {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      users (
        id,
        name,
        email
      )
    `)
    .eq('status', 'active');
  return { data, error };
};
```

## 🧪 Testing the Integration

1. Update your `.env` file with real Supabase credentials
2. Run your app: `npm start`
3. Navigate to the "Explore" tab
4. Expand the "Deals Room Database Integration" section
5. Test the connection and data fetching

## 🔒 Security Best Practices

1. **Row Level Security (RLS)**: Enable RLS on all tables
2. **User-based Access**: Ensure users can only access their own data
3. **Environment Variables**: Never commit `.env` files to version control
4. **Data Validation**: Validate all data before database operations

## 📚 Your Specific Use Cases

Based on your schema, common operations might include:

- **Deal Management**: Create, track, and manage business deals
- **Product Catalog**: Manage construction equipment, materials, and tools
- **Tender Notifications**: Alert users about new government/business tenders
- **Direct Messaging**: Enable communication between buyers and sellers
- **User Profiles**: Manage user and seller profile information
- **Announcements**: Display marketing and promotional content

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing Supabase URL" Error**
   - Ensure `.env` file is in project root
   - Check variable names match exactly: `EXPO_PUBLIC_SUPABASE_URL`

2. **RLS Policy Errors**
   - Check if Row Level Security policies are properly configured
   - Ensure policies allow access for authenticated users

3. **Type Errors**
   - Verify table names match your Supabase schema
   - Check if column names are correct in your queries

## 📞 Support

- Check Supabase Dashboard logs for database errors
- Review React Native console for client-side errors
- Verify your database schema matches the TypeScript types

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

## 🔒 Security Best Practices

1. **Row Level Security (RLS)**: Enable RLS on your Supabase tables
2. **Environment Variables**: Never commit `.env` files to version control
3. **API Keys**: Use anon keys for client-side, service keys only for server-side
4. **Validation**: Always validate data before database operations

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

## 🆘 Troubleshooting

### Common Issues:

1. **"Missing Supabase URL" Error**
   - Ensure `.env` file is in project root
   - Check variable names match exactly: `EXPO_PUBLIC_SUPABASE_URL`

2. **Authentication Errors**
   - Verify anon key is correct
   - Check if user already exists for sign-up
   - Ensure RLS policies allow the operation

3. **Database Connection Issues**
   - Verify table names are correct
   - Check database permissions
   - Ensure network connectivity

### Getting Help:

- Check Supabase Dashboard logs
- Review React Native console for errors
- Verify network requests in dev tools 