import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { MeseroInterface } from '../interface/waiter';

@Injectable({
  providedIn: 'root'
})
export class MeseroService {
  private apiUrl = 'http://localhost:3000/mesero';
  private meserosSource = new BehaviorSubject<MeseroInterface[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);

  meseros$ = this.meserosSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarMeseros().subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en MeseroService:', error);
    return throwError(() => new Error('Error en el servicio de meseros'));
  }

  // Función para normalizar los datos del backend
  private normalizarMesero(mesero: any): MeseroInterface {
    return {
      id: mesero.id_mesero || mesero.id,
      nombre: mesero.nombre,
      apellido: mesero.apellido,
      usuario: mesero.usuario,
      contrasena: mesero.contrasena,
      rol: mesero.rol,
      turno: mesero.turno,
      activo: mesero.activo !== undefined ? mesero.activo : true
    };
  }

  cargarMeseros(): Observable<MeseroInterface[]> {
    this.loadingSource.next(true);
    
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(meseros => meseros.map(mesero => this.normalizarMesero(mesero))),
      tap(meseros => {
        console.log('✅ Meseros cargados:', meseros);
        this.meserosSource.next(meseros);
        this.loadingSource.next(false);
      }),
      catchError(err => {
        console.error('❌ Error al cargar meseros:', err);
        this.loadingSource.next(false);
        return of([]);
      })
    );
  }

  crearMesero(mesero: MeseroInterface): Observable<MeseroInterface> {
    return this.http.post<any>(this.apiUrl, mesero).pipe(
      map(meseroRespuesta => this.normalizarMesero(meseroRespuesta)),
      tap(nuevoMesero => {
        console.log('✅ Mesero creado:', nuevoMesero);
        const meserosActuales = this.meserosSource.getValue();
        this.meserosSource.next([nuevoMesero, ...meserosActuales]);
      }),
      catchError(this.handleError)
    );
  }

  actualizarMesero(mesero: MeseroInterface): Observable<MeseroInterface> {
    return this.http.put<any>(`${this.apiUrl}/${mesero.id}`, mesero).pipe(
      map(meseroRespuesta => this.normalizarMesero(meseroRespuesta)),
      tap(actualizado => {
        console.log('✅ Mesero actualizado:', actualizado);
        const meserosActuales = this.meserosSource.getValue();
        const nuevosMeseros = meserosActuales.map(m =>
          m.id === actualizado.id ? actualizado : m
        );
        this.meserosSource.next(nuevosMeseros);
      }),
      catchError(this.handleError)
    );
  }

  eliminarMesero(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Mesero eliminado, ID:', id);
        const meserosActuales = this.meserosSource.getValue();
        const nuevosMeseros = meserosActuales.filter(m => m.id !== id);
        this.meserosSource.next(nuevosMeseros);
      }),
      catchError(this.handleError)
    );
  }

  toggleEstado(mesero: MeseroInterface): Observable<MeseroInterface> {
    const actualizado = { ...mesero, activo: !mesero.activo };
    return this.actualizarMesero(actualizado);
  }
}