import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AirtableService {
  private baseUrl = `https://api.airtable.com/v0/${environment.AIRTABLE_BASE_ID}/${encodeURIComponent(environment.AIRTABLE_TABLE_NAME)}`;
  private headers = new HttpHeaders({ 'Authorization': `Bearer ${environment.AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' });

  constructor(private http: HttpClient){}

  storeEmails(records: any[]){
    const body = { records: records.map(r => ({ fields: r })) };
    return this.http.post(this.baseUrl, body, { headers: this.headers });
  }

  updateRecord(id: string, fields: any){
    return this.http.patch(`${this.baseUrl}/${id}`, { fields }, { headers: this.headers });
  }
}
