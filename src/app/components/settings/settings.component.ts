import { Component } from '@angular/core';
import { LoggingService } from '../../services/logging.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  template: `
    <section>
      <h2>Settings</h2>
      <p>User: {{auth.currentUser?.email || auth.currentUser?.id}}</p>
      <label>Log Level:
        <select (change)="setLevel($event.target.value)">
          <option value="none">none</option>
          <option value="error">error</option>
          <option value="debug">debug</option>
          <option value="all">all</option>
        </select>
      </label>
      <div style="margin-top:12px">
        <button (click)="exportLogs()">Export Logs (JSON)</button>
        <button (click)="clearLogs()">Clear Logs</button>
      </div>
    </section>
  `
})
export class SettingsComponent {
  constructor(public logger: LoggingService, public auth: AuthService){}

  setLevel(level: any){ this.logger.setLevel(level); }
  exportLogs(){ const out = this.logger.export(); const blob = new Blob([out], { type: 'application/json' }); const url = URL.createObjectURL(blob); window.open(url); }
  clearLogs(){ this.logger.clear(); alert('Logs cleared'); }
}
