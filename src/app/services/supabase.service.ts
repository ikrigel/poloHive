import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  client: SupabaseClient;

  constructor(){
    this.client = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY);
  }

  // Example: store registered user metadata
  async storeUserProfile(userId: string, profile: any){
    return this.client.from('profiles').upsert({ id: userId, ...profile });
  }

  async getProfile(userId: string){
    const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return data;
  }

  // Ensure a profile exists for a user; create with defaults
  async ensureProfile(userId: string, email?: string){
    const existing = await this.getProfile(userId);
    if (existing) return existing;
    const profile = { id: userId, email: email || null, role: (email && email.toLowerCase() === 'ikrigel@gmail.com') ? 'admin' : 'user' };
    await this.storeUserProfile(userId, profile);
    return profile;
  }
}
