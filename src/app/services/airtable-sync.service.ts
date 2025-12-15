import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { loadEmailsSuccess, updateEmailSuccess } from '../store/email.actions';

@Injectable({ providedIn: 'root' })
export class AirtableSyncService {
  private polling = false;
  private intervalMs = 5000;

  constructor(private http: HttpClient, private store: Store){ }

  start(){ if (this.polling) return; this.polling = true; this.tick(); }
  stop(){ this.polling = false; }

  private async tick(){
    while(this.polling){
      try{
        const resp: any = await this.http.get('/api/airtable/records').toPromise();
        if (resp && resp.records) this.store.dispatch(loadEmailsSuccess({ records: resp.records }));
      }catch(e){ /* ignore */ }
      await new Promise(r => setTimeout(r, this.intervalMs));
    }
  }

  async update(id: string, fields: any){
    const resp: any = await this.http.patch(`/api/airtable/records/${id}`, { fields }).toPromise();
    if (resp && resp.records && resp.records.length) this.store.dispatch(updateEmailSuccess({ record: resp.records[0] }));
    return resp;
  }
}
