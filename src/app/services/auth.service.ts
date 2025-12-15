import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface UserState { id: string; email?: string; role?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;
  public currentUser: UserState | null = null;

  constructor(private http: HttpClient){
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_ANON_KEY);
  }

  async register(email: string, password: string){
    return this.supabase.auth.signUp({ email, password });
  }

  async login(email: string, password: string){
    const resp = await this.supabase.auth.signInWithPassword({ email, password });
    if (resp && resp.data?.user) {
      this.currentUser = { id: resp.data.user.id, email: resp.data.user.email || undefined, role: 'user' };
    }
    return resp;
  }

  async googleLogin(){
    return this.supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  async guestLogin(){
    this.currentUser = { id: 'guest', role: 'guest' };
    return this.currentUser;
  }

  async signOut(){
    try { await this.supabase.auth.signOut(); } catch(e){}
    this.currentUser = null;
  }

  // 2FA: send code to email via server endpoint; in dev server returns code when SMTP not configured
  send2FA(email: string){
    return this.http.post('/api/2fa/send', { email }).toPromise();
  }

  verify2FA(email: string, code: string){
    return this.http.post('/api/2fa/verify', { email, code }).toPromise();
  }

  isAdmin(email?: string){
    const e = email || this.currentUser?.email;
    return Boolean(e && e.toLowerCase() === 'ikrigel@gmail.com');
  }
}
