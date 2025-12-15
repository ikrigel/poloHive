import { Component } from '@angular/core';
import { AirtableSyncService } from './services/airtable-sync.service';

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

// start airtable sync when app boots
export function startSync(sync: AirtableSyncService){ return () => sync.start(); }
