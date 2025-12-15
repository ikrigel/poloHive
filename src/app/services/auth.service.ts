import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;

  constructor(){
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY);
  }

  async register(email: string, password: string){
    return this.supabase.auth.signUp({ email, password });
  }

  async login(email: string, password: string){
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async googleLogin(){
    return this.supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  async guestLogin(){
    // create ephemeral guest session logic or return limited client-side guest state
    return { user: { id: 'guest', role: 'guest' } };
  }

  // 2FA entry points (TOTP / phone) are stubs. Implement server-side verification or use Supabase functions.
}
