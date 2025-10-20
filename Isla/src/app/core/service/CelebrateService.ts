// En CelebrateService.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CelebrateInterface } from '../interface/celebrate';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CelebrateService {
  private apiUrl = 'http://localhost:3000/celebrate';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en CelebrateService:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  crearCelebracion(data: CelebrateInterface): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCelebraciones(): Observable<CelebrateInterface[]> {
    return this.http.get<CelebrateInterface[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  actualizarVerificacion(id: number, data: { ine_verificacion: boolean, estado_verificacion: boolean }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/verificacion`, data).pipe(
      catchError(this.handleError)
    );
  }

  eliminarCelebracion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}