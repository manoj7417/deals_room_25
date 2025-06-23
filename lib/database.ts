import { sessionStorage, UserSession } from './sessionStorage'
import { supabase } from './supabase'
import type {
    Announcement,
    Deal, DM,
    InsertAnnouncement,
    InsertDeal, InsertDM,
    InsertJob,
    InsertLandListing, InsertMachine, InsertMaterial,
    InsertProduct,
    InsertSeller,
    InsertTender,
    InsertUser,
    Job,
    LandListing, Machine, Material,
    Notification,
    Product,
    Seller,
    Tender,
    UpdateDeal,
    UpdateSeller,
    UpdateUser,
    User
} from './types'

// Auth functions
export const auth = {
  // Sign up with email and password - simplified without email confirmation
  signUp: async (email: string, password: string) => {
    // First, try to sign up normally
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      }
    })
    
    // If signup successful but user needs confirmation, we'll handle it differently
    if (data.user && !error) {
      // For now, we'll proceed with user creation even if email is not confirmed
      return { data, error }
    }
    
    return { data, error }
  },

  // Direct signup that bypasses Supabase auth completely
  signUpDirect: async (email: string, password: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Use a more robust check with error handling
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record found
      
      if (checkError) {
        console.error('Error checking existing user:', checkError);
        return { data: null, error: { message: 'Failed to verify email availability' } };
      }
      
      if (existingUser) {
        console.log('User already exists with email:', normalizedEmail);
        return { data: null, error: { message: 'User already exists' } };
      }
      
      // Create a mock user ID and return success
      const mockUserId = Date.now().toString();
      
      return { 
        data: {
          user: {
            id: mockUserId,
            email: normalizedEmail,
            email_confirmed_at: new Date().toISOString()
          },
          session: null
        }, 
        error: null
      };
    } catch (err) {
      console.error('SignUpDirect error:', err);
      return { data: null, error: { message: 'Registration failed. Please try again.' } };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Simple sign in that creates a session for unconfirmed users
  signInBypass: async (email: string, password: string) => {
    try {
      console.log('signInBypass called with email:', email);
      
      // Check if user exists in our database first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single()
      
      console.log('Database query result:', { userData, userError });
      
      if (!userData || userError) {
        console.log('User not found or error:', userError);
        return { data: null, error: { message: 'Invalid email or password' } }
      }
      
      console.log('User found, checking password...');
      
      // Simple password check (in production, you'd want proper password hashing)
      if (userData.password !== password) {
        console.log('Password mismatch - Expected:', userData.password, 'Got:', password);
        return { data: null, error: { message: 'Invalid email or password' } }
      }
      
      console.log('Password match, creating session...');
      
      // Create and save session
      const userSession: UserSession = {
        email: userData.email,
        name: userData.name,
        userId: userData.id.toString(),
        loginTime: new Date().toISOString()
      };
      
      const sessionSaved = await sessionStorage.saveSession(userSession);
      if (!sessionSaved) {
        console.log('Failed to save session');
        return { data: null, error: { message: 'Failed to save session' } }
      }
      
      // Create a mock successful auth response
      const authResponse = { 
        data: { 
          user: { 
            id: userData.id.toString(), 
            email: userData.email,
            email_confirmed_at: new Date().toISOString(),
            user_metadata: {
              name: userData.name
            }
          }, 
          session: {
            access_token: 'mock_token_' + userData.id,
            user: {
              id: userData.id.toString(), 
              email: userData.email,
              email_confirmed_at: new Date().toISOString()
            }
          }
        }, 
        error: null 
      };
      
      console.log('Auth response created with persistent session');
      return authResponse;
    } catch (err) {
      console.error('signInBypass error:', err);
      return { data: null, error: err as any }
    }
  },

  // Sign out
  signOut: async () => {
    // Clear persistent session
    await sessionStorage.clearSession();
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  // Get current session
  getCurrentSession: async () => {
    // First check if we have a persistent session
    const persistentSession = await sessionStorage.getSession();
    if (persistentSession) {
      // Return a mock session format that matches Supabase
      return {
        data: {
          session: {
            access_token: 'mock_token_' + persistentSession.userId,
            user: {
              id: persistentSession.userId,
              email: persistentSession.email,
              email_confirmed_at: new Date().toISOString()
            }
          }
        },
        error: null
      };
    }
    
    // Fallback to Supabase session
    return supabase.auth.getSession();
  },

  // Check if user is authenticated (including persistent session)
  isAuthenticated: async () => {
    const persistentSession = await sessionStorage.getSession();
    if (persistentSession) {
      return true;
    }
    
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// Users operations
export const users = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .returns<User[]>()
    return { data, error }
  },

  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
      .returns<User>()
    return { data, error }
  },

  getByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
      .returns<User>()
    return { data, error }
  },

  create: async (user: InsertUser) => {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
      .returns<User>()
    return { data, error }
  },

  update: async (id: number, updates: Partial<UpdateUser>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      .returns<User>()
    return { data, error }
  },
}

// Sellers operations
export const sellers = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .returns<Seller[]>()
    return { data, error }
  },

  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single()
      .returns<Seller>()
    return { data, error }
  },

  getByUserId: async (userId: number) => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('user_id', userId)
      .single()
      .returns<Seller>()
    return { data, error }
  },

  create: async (seller: InsertSeller) => {
    const { data, error } = await supabase
      .from('sellers')
      .insert(seller)
      .select()
      .single()
      .returns<Seller>()
    return { data, error }
  },

  update: async (id: number, updates: Partial<UpdateSeller>) => {
    const { data, error } = await supabase
      .from('sellers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      .returns<Seller>()
    return { data, error }
  },
}

// Deals operations
export const deals = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .returns<Deal[]>()
    return { data, error }
  },

  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single()
      .returns<Deal>()
    return { data, error }
  },

  getBySenderId: async (senderId: number) => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('sender_id', senderId)
      .returns<Deal[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'active')
      .returns<Deal[]>()
    return { data, error }
  },

  create: async (deal: InsertDeal) => {
    const { data, error } = await supabase
      .from('deals')
      .insert(deal)
      .select()
      .single()
      .returns<Deal>()
    return { data, error }
  },

  update: async (id: number, updates: Partial<UpdateDeal>) => {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      .returns<Deal>()
    return { data, error }
  },
}

// DMs operations
export const dms = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('dms')
      .select('*')
      .order('created_at', { ascending: true })
      .returns<DM[]>()
    return { data, error }
  },

  getConversation: async (userId1: number, userId2: number) => {
    const { data, error } = await supabase
      .from('dms')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })
      .returns<DM[]>()
    return { data, error }
  },

  getUserMessages: async (userId: number) => {
    const { data, error } = await supabase
      .from('dms')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .returns<DM[]>()
    return { data, error }
  },

  create: async (message: InsertDM) => {
    const { data, error } = await supabase
      .from('dms')
      .insert(message)
      .select()
      .single()
      .returns<DM>()
    return { data, error }
  },

  send: async (message: InsertDM) => {
    const { data, error } = await supabase
      .from('dms')
      .insert(message)
      .select()
      .single()
      .returns<DM>()
    return { data, error }
  },

  update: async (id: number, updates: Partial<DM>) => {
    const { data, error } = await supabase
      .from('dms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
      .returns<DM>()
    return { data, error }
  },

  markAsRead: async (messageId: number) => {
    const { data, error } = await supabase
      .from('dms')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single()
      .returns<DM>()
    return { data, error }
  },
}

// Announcements operations
export const announcements = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .returns<Announcement[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
      .returns<Announcement[]>()
    return { data, error }
  },

  getByCategory: async (category: string) => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .returns<Announcement[]>()
    return { data, error }
  },

  create: async (announcement: InsertAnnouncement) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select()
      .single()
      .returns<Announcement>()
    return { data, error }
  },
}

// Products operations
export const products = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .returns<Product[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .returns<Product[]>()
    return { data, error }
  },

  getByCategory: async (category: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .returns<Product[]>()
    return { data, error }
  },

  getBySellerId: async (sellerId: number) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .returns<Product[]>()
    return { data, error }
  },

  create: async (product: InsertProduct) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
      .returns<Product>()
    return { data, error }
  },
}

// Tenders operations
export const tenders = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .returns<Tender[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', 'active')
      .gte('submission_date', new Date().toISOString())
      .returns<Tender[]>()
    return { data, error }
  },

  getByCategory: async (category: string) => {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('engineering_category', category)
      .eq('status', 'active')
      .returns<Tender[]>()
    return { data, error }
  },

  create: async (tender: InsertTender) => {
    const { data, error } = await supabase
      .from('tenders')
      .insert(tender)
      .select()
      .single()
      .returns<Tender>()
    return { data, error }
  },
}

// Land Listings operations
export const landListings = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('land_listings')
      .select('*')
      .returns<LandListing[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('land_listings')
      .select('*')
      .eq('status', 'active')
      .returns<LandListing[]>()
    return { data, error }
  },

  getByType: async (landType: string) => {
    const { data, error } = await supabase
      .from('land_listings')
      .select('*')
      .eq('land_type', landType)
      .eq('status', 'active')
      .returns<LandListing[]>()
    return { data, error }
  },

  create: async (listing: InsertLandListing) => {
    const { data, error } = await supabase
      .from('land_listings')
      .insert(listing)
      .select()
      .single()
      .returns<LandListing>()
    return { data, error }
  },
}

// Machines operations
export const machines = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .returns<Machine[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('status', 'active')
      .returns<Machine[]>()
    return { data, error }
  },

  getByBrand: async (brand: string) => {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('brand', brand)
      .eq('status', 'active')
      .returns<Machine[]>()
    return { data, error }
  },

  create: async (machine: InsertMachine) => {
    const { data, error } = await supabase
      .from('machines')
      .insert(machine)
      .select()
      .single()
      .returns<Machine>()
    return { data, error }
  },
}

// Materials operations
export const materials = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .returns<Material[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('status', 'active')
      .returns<Material[]>()
    return { data, error }
  },

  getByType: async (type: string) => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .returns<Material[]>()
    return { data, error }
  },

  create: async (material: InsertMaterial) => {
    const { data, error } = await supabase
      .from('materials')
      .insert(material)
      .select()
      .single()
      .returns<Material>()
    return { data, error }
  },
}

// Jobs operations
export const jobs = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .returns<Job[]>()
    return { data, error }
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .returns<Job[]>()
    return { data, error }
  },

  getByType: async (jobType: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_type', jobType)
      .eq('status', 'active')
      .returns<Job[]>()
    return { data, error }
  },

  create: async (job: InsertJob) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single()
      .returns<Job>()
    return { data, error }
  },
}

// Notifications operations
export const notifications = {
  getUserNotifications: async (userId: number) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<Notification[]>()
    return { data, error }
  },

  getUnreadCount: async (userId: number) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    return { count, error }
  },

  create: async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
      .returns<Notification>()
    return { data, error }
  },

  markAsRead: async (notificationId: number) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()
      .returns<Notification>()
    return { data, error }
  },

  markAllAsRead: async (userId: number) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()
      .returns<Notification[]>()
    return { data, error }
  },
}

// General database functions
export const database = {
  // Generic functions for any table
  getAllRecords: async (tableName: string) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
    return { data, error }
  },

  insertRecord: async (tableName: string, record: any) => {
    const { data, error } = await supabase
      .from(tableName)
      .insert(record)
      .select()
    return { data, error }
  },

  updateRecord: async (tableName: string, id: string, updates: any) => {
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  deleteRecord: async (tableName: string, id: string) => {
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
    return { data, error }
  },
}

// Export the supabase client for direct use if needed
export { supabase }

