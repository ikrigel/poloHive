import { Injectable } from '@angular/core';

export type LogLevel = 'none' | 'error' | 'debug' | 'all';

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private logs: any[] = [];
  private level: LogLevel = 'error';

  setLevel(l: LogLevel){ this.level = l; }
  log(entry: any){ this.logs.push({ ts: new Date().toISOString(), ...entry }); }
  export(){ return JSON.stringify(this.logs); }
  clear(){ this.logs = []; }
}
