import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login">
      <h2>Login / Register</h2>
      <div *ngIf="step === 0">
        <input placeholder="Email" [(ngModel)]="email" />
        <input placeholder="Password" [(ngModel)]="password" type="password" />
        <div>
          <button (click)="login()">Login</button>
          <button (click)="register()">Register</button>
          <button (click)="google()">Login with Google</button>
        </div>
        <hr />
        <button (click)="guest()">Continue as Guest</button>
      </div>

      <div *ngIf="step === 1">
        <p>A 2FA code was sent to {{email}}. Enter it below:</p>
        <input placeholder="6-digit code" [(ngModel)]="code" />
        <div>
          <button (click)="verifyCode()">Verify</button>
          <button (click)="resend()">Resend</button>
        </div>
        <p *ngIf="devCode">(dev code: {{devCode}})</p>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  code = '';
  step = 0;
  devCode: string | null = null;

  constructor(private auth: AuthService){}

  async register(){
    try{
      await this.auth.register(this.email, this.password);
      await this.start2FA();
    }catch(e){ alert('register failed'); }
  }

  async login(){
    try{
      await this.auth.login(this.email, this.password);
      await this.start2FA();
    }catch(e){ alert('login failed'); }
  }

  async google(){
    await this.auth.googleLogin();
  }

  async guest(){
    this.auth.guestLogin();
    alert('Continuing as guest');
  }

  private async start2FA(){
    try{
      const resp: any = await this.auth.send2FA(this.email);
      this.step = 1;
      if (resp && resp.code) this.devCode = resp.code; // dev convenience
    }catch(e){ alert('2FA send failed'); }
  }

  async verifyCode(){
    try{
      await this.auth.verify2FA(this.email, this.code);
      alert('2FA verified — logged in');
      this.step = 0; this.code = '';
    }catch(e){ alert('invalid code'); }
  }

  async resend(){ this.start2FA(); }
}
