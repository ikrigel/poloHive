import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient){}

  analyzeReply(replyText: string){
    // Send to your AI provider backend which uses environment.AI_API_KEY
    return this.http.post('/api/ai/analyze', { text: replyText });
  }
}
