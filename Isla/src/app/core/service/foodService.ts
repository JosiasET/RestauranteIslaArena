import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { foodInterface } from '../interface/foodInterface';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = 'http://localhost:3000/platillos';
  private saucerSource = new BehaviorSubject<foodInterface[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);

  saucer$ = this.saucerSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarPlatillos().subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en FoodService:', error);
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Función para normalizar los datos del backend
  private normalizarPlatillo(platillo: any): foodInterface {
    return {
      id: platillo.id_platillo || platillo.id, // Usa id_platillo si existe, sino id
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio,
      imagen: platillo.imagen
    };
  }

  private normalizarPlatillos(platillos: any[]): foodInterface[] {
    return platillos.map(platillo => this.normalizarPlatillo(platillo));
  }

  cargarPlatillos(): Observable<foodInterface[]> {
    this.loadingSource.next(true);
    
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(platillos => this.normalizarPlatillos(platillos)),
      tap(platillos => {
        console.log('✅ Platillos cargados y normalizados:', platillos);
        this.saucerSource.next(platillos);
        this.loadingSource.next(false);
      }),
      catchError(err => {
        console.error('❌ Error al cargar platillos:', err);
        this.loadingSource.next(false);
        return of([]);
      })
    );
  }

  agregarPlatillo(platillo: foodInterface): Observable<foodInterface> {
    return this.http.post<any>(this.apiUrl, platillo).pipe(
      map(platilloRespuesta => this.normalizarPlatillo(platilloRespuesta)),
      tap(nuevoPlatillo => {
        console.log('✅ Platillo agregado - Normalizado:', nuevoPlatillo);
        const platillosActuales = this.saucerSource.getValue();
        this.saucerSource.next([nuevoPlatillo, ...platillosActuales]);
      }),
      catchError(this.handleError)
    );
  }

  eliminarPlatillo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Platillo eliminado del servidor, ID:', id);
        const platillosActuales = this.saucerSource.getValue();
        const nuevosPlatillos = platillosActuales.filter(p => p.id !== id);
        this.saucerSource.next(nuevosPlatillos);
      }),
      catchError(this.handleError)
    );
  }

  actualizarPlatillo(platillo: foodInterface): Observable<foodInterface> {
    return this.http.put<any>(`${this.apiUrl}/${platillo.id}`, platillo).pipe(
      map(platilloRespuesta => this.normalizarPlatillo(platilloRespuesta)),
      tap(actualizado => {
        console.log('✅ Platillo actualizado - Normalizado:', actualizado);
        const platillosActuales = this.saucerSource.getValue();
        const nuevosPlatillos = platillosActuales.map(p =>
          p.id === actualizado.id ? actualizado : p
        );
        this.saucerSource.next(nuevosPlatillos);
      }),
      catchError(this.handleError)
    );
  }

  getPlatillosActuales(): foodInterface[] {
    return this.saucerSource.getValue();
  }

  // Método para forzar recarga si es necesario
  forzarRecarga(): void {
    console.log('🔄 Forzando recarga manual...');
    this.cargarPlatillos().subscribe();
  }
}