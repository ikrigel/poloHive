import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class EmailService {
  constructor(private http: HttpClient){}

  sendEmail(payload: any){
    // payload: { to, subject, body, attachments }
    return this.http.post('/api/send-email', payload);
  }

  trackStatus(emailId: string){
    return this.http.get(`/api/email-status/${emailId}`);
  }
}
