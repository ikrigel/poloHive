import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="brand">poloHive</div>
      <div class="menu">
        <a routerLink="/">Home</a>
        <a routerLink="/login">Login</a>
        <div class="avatar">User</div>
      </div>
    </nav>
  `,
  styles: [`.navbar{display:flex;justify-content:space-between;padding:8px 16px;background:#222;color:#fff}.menu a{margin-right:12px;color:#fff}`]
})
export class NavbarComponent { }
