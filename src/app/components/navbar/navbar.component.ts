import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="brand">poloHive</div>
      <div class="menu">
        <a routerLink="/">Home</a>
        <a routerLink="/login">Login</a>
        <div class="avatar" style="position:relative">
          <button (click)="toggle()">{{auth.currentUser?.email || auth.currentUser?.id || 'User'}}</button>
          <div *ngIf="open" class="dropdown">
            <a routerLink="/settings">Settings</a>
            <a routerLink="/logs">Logs</a>
            <a *ngIf="auth.isAdmin()" (click)="becomeAdmin()">Admin panel</a>
            <a (click)="logout()">Sign out</a>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`.navbar{display:flex;justify-content:space-between;padding:8px 16px;background:#222;color:#fff}.menu a, .dropdown a{margin-right:12px;color:#fff}.dropdown{position:absolute;right:0;background:#333;padding:8px;border-radius:4px}`]
})
export class NavbarComponent {
  open = false;
  constructor(public auth: AuthService){}
  toggle(){ this.open = !this.open; }
  logout(){ this.auth.signOut(); alert('Signed out'); }
  becomeAdmin(){ alert('Admin panel placeholder'); }
}
