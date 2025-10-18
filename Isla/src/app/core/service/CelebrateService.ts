import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CelebrateInterface } from '../interface/celebrate';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CelebrateService {
  private apiUrl = 'http://localhost:3000/celebrate'; // ✅ corregido

  constructor(private http: HttpClient) {}

  crearCelebracion(data: CelebrateInterface): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  obtenerCelebraciones(): Observable<CelebrateInterface[]> {
    return this.http.get<CelebrateInterface[]>(this.apiUrl);
  }

  
}
