import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { Fish } from '../interface/Fish';

@Injectable({
  providedIn: 'root'
})
export class FishesService {
  private apiUrl = 'http://localhost:3000/especialidades';
  private saucerSource = new BehaviorSubject<Fish[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);

  saucer$ = this.saucerSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarEspecialidades().subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en FishesService:', error);
    return throwError(() => new Error('Error en el servicio de especialidades'));
  }

  // Función para normalizar los datos del backend
  private normalizarEspecialidad(especialidad: any): Fish {
    return {
      id: especialidad.id_especialidad || especialidad.id,
      nombre: especialidad.nombre,
      descripcion: especialidad.descripcion,
      precio: especialidad.precio,
      imagen: especialidad.imagen
    };
  }

  cargarEspecialidades(): Observable<Fish[]> {
    this.loadingSource.next(true);
    
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(especialidades => especialidades.map(esp => this.normalizarEspecialidad(esp))),
      tap(especialidades => {
        console.log('✅ Especialidades cargadas:', especialidades);
        this.saucerSource.next(especialidades);
        this.loadingSource.next(false);
      }),
      catchError(err => {
        console.error('❌ Error al cargar especialidades:', err);
        this.loadingSource.next(false);
        return of([]);
      })
    );
  }

  agregarEspecialidad(especialidad: Fish): Observable<Fish> {
    return this.http.post<any>(this.apiUrl, especialidad).pipe(
      map(especialidadRespuesta => this.normalizarEspecialidad(especialidadRespuesta)),
      tap(nuevaEspecialidad => {
        console.log('✅ Especialidad agregada:', nuevaEspecialidad);
        const especialidadesActuales = this.saucerSource.getValue();
        this.saucerSource.next([nuevaEspecialidad, ...especialidadesActuales]);
      }),
      catchError(this.handleError)
    );
  }

  eliminarEspecialidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Especialidad eliminada, ID:', id);
        const especialidadesActuales = this.saucerSource.getValue();
        const nuevasEspecialidades = especialidadesActuales.filter(e => e.id !== id);
        this.saucerSource.next(nuevasEspecialidades);
      }),
      catchError(this.handleError)
    );
  }

  actualizarEspecialidad(especialidad: Fish): Observable<Fish> {
    return this.http.put<any>(`${this.apiUrl}/${especialidad.id}`, especialidad).pipe(
      map(especialidadRespuesta => this.normalizarEspecialidad(especialidadRespuesta)),
      tap(actualizada => {
        console.log('✅ Especialidad actualizada:', actualizada);
        const especialidadesActuales = this.saucerSource.getValue();
        const nuevasEspecialidades = especialidadesActuales.map(e =>
          e.id === actualizada.id ? actualizada : e
        );
        this.saucerSource.next(nuevasEspecialidades);
      }),
      catchError(this.handleError)
    );
  }
}