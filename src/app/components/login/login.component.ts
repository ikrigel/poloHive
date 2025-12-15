import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  template: `
    <div class="login">
      <h2>Login / Register</h2>
      <p>Use Supabase or Google OAuth. Guest login available.</p>
      <button (click)="guest()">Continue as Guest</button>
    </div>
  `
})
export class LoginComponent {
  guest(){
    // TODO: call AuthService.guestLogin()
    alert('Guest login (placeholder)');
  }
}
