import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <main class="container">
      <h1>poloHive</h1>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`.container{padding:16px}`]
})
export class AppComponent { }
