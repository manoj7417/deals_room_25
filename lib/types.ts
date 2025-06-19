// Database Types based on your schema

export interface UserSession {
  email: string;
  name: string;
  userId: number;
  loginTime: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  primary_resource: string[];
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: number;
  name: string;
  business_type: string;
  location: string;
  contact_info: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
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
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  seller_id: number;
  images: string[];
  specifications: Record<string, any>;
  availability_status: string;
  created_at: string;
  updated_at: string;
}

export interface Tender {
  id: number;
  title: string;
  description: string;
  requirements: Record<string, any>;
  budget_range: string;
  deadline: string;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface LandListing {
  id: number;
  title: string;
  description: string;
  location: string;
  area_size: number;
  price_per_unit: number;
  total_price: number;
  land_type: string;
  ownership_type: string;
  amenities: string[];
  seller_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: number;
  name: string;
  description: string;
  model: string;
  year_of_manufacture: number;
  condition: string;
  price: number;
  rental_price?: number;
  seller_id: number;
  images: string[];
  specifications: Record<string, any>;
  availability_status: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  name: string;
  description: string;
  quality_grade: string;
  price_per_unit: number;
  available_quantity: number;
  unit_of_measurement: string;
  seller_id: number;
  images: string[];
  specifications: Record<string, any>;
  availability_status: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: Record<string, any>;
  compensation: string;
  location: string;
  job_type: string;
  experience_level: string;
  posted_by: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string; // 'dm_request' | 'dm_message' | 'general'
  is_read: boolean;
  related_id?: number;
  created_at: string;
  updated_at: string;
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