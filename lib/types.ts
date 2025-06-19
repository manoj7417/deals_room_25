// Database Types based on your schema

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  verified: boolean;
  is_admin: boolean;
  profile_image_url?: string;
  resources: string[];
  primary_resource: string[];
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: number;
  user_id: number;
  company_name: string;
  business_type: string;
  address: string;
  phone: string;
  website?: string;
  description?: string;
  profile_picture_url?: string;
  aadhar_url?: string;
  gst_certificate_url?: string;
  work_photos_urls?: string[];
  owner_photos_urls?: string[];
  skills: string[];
  languages: string[];
  average_rating: string;
  total_reviews: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Gig {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  image_url: string;
  price: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'pending';
  sender_id: number;
  created_at: string;
  updated_at: string;
}

export interface DM {
  id: number;
  message: string;
  sender_id: number;
  receiver_id: number;
  deal_id?: number;
  created_at: string;
  updated_at: string;
  is_read: boolean;
}

export interface Announcement {
  id: number;
  seller_id: number;
  category: 'PROJECT & CONSTRUCTION RESOURCES' | 'BUSINESS RESOURCES' | 'STUDENT RESOURCES';
  subcategory: string;
  title: string;
  description: string;
  icon: string;
  details: string;
  ad_type: 'scroll' | 'flip';
  status: 'active' | 'inactive' | 'pending';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  category: 'Land' | 'Machines' | 'Material' | 'Equipment' | 'Tools' | 'Manpower';
  brand_name?: string;
  model?: string;
  material?: string;
  color?: string;
  packaging_details?: string;
  delivery_info?: string;
  supply_ability?: string;
  moq?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Tender {
  id: number;
  user_id: number;
  upc_ref: string;
  engineering_category: 'civil' | 'mechanical' | 'electrical' | 'chemical' | 'environmental';
  specialization: string;
  tender_name: string;
  location: string;
  scope: string;
  estimated_value: string;
  collection_date: string;
  submission_date: string;
  contact_name: string;
  contact_number: string;
  contact_email: string;
  address: string;
  document_urls: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface LandListing {
  id: number;
  user_id: number;
  title: string;
  location: string;
  area: string; // decimal
  price: string; // decimal
  land_type: 'residential' | 'commercial' | 'agricultural' | 'industrial' | 'vacant';
  description: string;
  image_urls: string[];
  document_urls: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: number;
  user_id: number;
  title: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  condition: 'new' | 'like-new' | 'excellent' | 'good' | 'fair' | 'used' | 'refurbished' | 'needs-repair' | 'for-parts';
  price: string;
  location: string;
  description: string;
  image_urls: string[];
  document_urls: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  user_id: number;
  title: string;
  type: 'cement' | 'steel' | 'bricks' | 'sand' | 'wood' | 'pipes' | 'electrical' | 'other';
  quantity: string;
  unit: 'kg' | 'tons' | 'bags' | 'pieces' | 'meters' | 'sqft' | 'cuft' | 'liters';
  price: string;
  grade?: string;
  location: string;
  delivery: 'pickup' | 'delivery' | 'both';
  description: string;
  image_urls: string[];
  certificate_urls: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  user_id: number;
  title: string;
  company: string;
  description: string;
  requirements: string;
  salary?: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | 'temporary';
  experience: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  industry: string;
  document_urls: string[];
  status: 'active' | 'inactive' | 'pending' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  entity_id: number;
  is_read: boolean;
  created_at: string;
}

// Insert types (without id, created_at, updated_at)
export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type InsertSeller = Omit<Seller, 'id' | 'created_at' | 'updated_at'>;
export type InsertDeal = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
export type InsertDM = Omit<DM, 'id' | 'created_at' | 'updated_at'>;
export type InsertAnnouncement = Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;
export type InsertProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type InsertTender = Omit<Tender, 'id' | 'created_at' | 'updated_at'>;
export type InsertLandListing = Omit<LandListing, 'id' | 'created_at' | 'updated_at'>;
export type InsertMachine = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;
export type InsertMaterial = Omit<Material, 'id' | 'created_at' | 'updated_at'>;
export type InsertJob = Omit<Job, 'id' | 'created_at' | 'updated_at'>;

// Update types (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'created_at'>> & { id: number };
export type UpdateSeller = Partial<Omit<Seller, 'created_at'>> & { id: number };
export type UpdateDeal = Partial<Omit<Deal, 'created_at'>> & { id: number };
export type UpdateAnnouncement = Partial<Omit<Announcement, 'created_at'>> & { id: number };
export type UpdateProduct = Partial<Omit<Product, 'created_at'>> & { id: number }; 