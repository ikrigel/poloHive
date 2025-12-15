import { Component, OnInit } from '@angular/core';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-logs',
  template: `
    <section>
      <h2>Logs</h2>
      <div *ngIf="entries.length === 0">No logs</div>
      <ul>
        <li *ngFor="let l of entries">{{l.ts}} - {{l.level || 'info'}} - {{l.message || (l.error && l.error.message) || JSON.stringify(l)}}</li>
      </ul>
    </section>
  `
})
export class LogsComponent implements OnInit{
  entries: any[] = [];
  constructor(private logger: LoggingService){}
  ngOnInit(){ try { this.entries = JSON.parse(this.logger.export()); } catch(e){ this.entries = []; } }
}
