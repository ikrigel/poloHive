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
}
