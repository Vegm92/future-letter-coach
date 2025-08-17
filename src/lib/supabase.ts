/**
 * SIMPLIFIED SUPABASE CLIENT
 * 
 * Direct, no-nonsense Supabase configuration.
 * No complex abstractions, just what we need.
 */

import { createClient } from '@supabase/supabase-js';
import type { Letter, Milestone, Profile } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Define database schema types for Supabase
export interface Database {
  public: {
    Tables: {
      letters: {
        Row: Letter;
        Insert: Omit<Letter, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Letter, 'id' | 'created_at' | 'updated_at'>>;
      };
      milestones: {
        Row: Milestone;
        Insert: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Milestone, 'id' | 'created_at' | 'updated_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Create typed client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
