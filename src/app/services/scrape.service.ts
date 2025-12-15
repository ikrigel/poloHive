import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ScrapeService {
  // The frontend calls a backend scraping endpoint which performs the heavy lifting (recommended to reuse dexhiveScrap as microservice)
  constructor(private http: HttpClient){}

  scrapeUrl(targetUrl: string){
    return this.http.post('/api/scrape', { url: targetUrl });
  }
}
