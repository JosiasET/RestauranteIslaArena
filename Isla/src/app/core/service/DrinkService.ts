import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, throwError } from 'rxjs';
import { Drinkinterface } from '../interface/drink';

@Injectable({
  providedIn: 'root'
})
export class DrinkService {
  private apiUrl = 'http://localhost:3000/bebidas';
  private saucerSource = new BehaviorSubject<Drinkinterface[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);

  saucer$ = this.saucerSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarBebidas().subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en DrinkService:', error);
    return throwError(() => new Error('Error en el servicio de bebidas'));
  }

  // Función para normalizar los datos del backend
  private normalizarBebida(bebida: any): Drinkinterface {
    return {
      id: bebida.id_bebida || bebida.id,
      nombre: bebida.nombre,
      descripcion: bebida.descripcion,
      precio: bebida.precio,
      imagen: bebida.imagen
    };
  }

  cargarBebidas(): Observable<Drinkinterface[]> {
    this.loadingSource.next(true);
    
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(bebidas => bebidas.map(bebida => this.normalizarBebida(bebida))),
      tap(bebidas => {
        console.log('✅ Bebidas cargadas:', bebidas);
        this.saucerSource.next(bebidas);
        this.loadingSource.next(false);
      }),
      catchError(err => {
        console.error('❌ Error al cargar bebidas:', err);
        this.loadingSource.next(false);
        return of([]);
      })
    );
  }

  agregarBebida(bebida: Drinkinterface): Observable<Drinkinterface> {
    return this.http.post<any>(this.apiUrl, bebida).pipe(
      map(bebidaRespuesta => this.normalizarBebida(bebidaRespuesta)),
      tap(nuevaBebida => {
        console.log('✅ Bebida agregada:', nuevaBebida);
        const bebidasActuales = this.saucerSource.getValue();
        this.saucerSource.next([nuevaBebida, ...bebidasActuales]);
      }),
      catchError(this.handleError)
    );
  }

  eliminarBebida(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Bebida eliminada, ID:', id);
        const bebidasActuales = this.saucerSource.getValue();
        const nuevasBebidas = bebidasActuales.filter(b => b.id !== id);
        this.saucerSource.next(nuevasBebidas);
      }),
      catchError(this.handleError)
    );
  }

  actualizarBebida(bebida: Drinkinterface): Observable<Drinkinterface> {
    return this.http.put<any>(`${this.apiUrl}/${bebida.id}`, bebida).pipe(
      map(bebidaRespuesta => this.normalizarBebida(bebidaRespuesta)),
      tap(actualizada => {
        console.log('✅ Bebida actualizada:', actualizada);
        const bebidasActuales = this.saucerSource.getValue();
        const nuevasBebidas = bebidasActuales.map(b =>
          b.id === actualizada.id ? actualizada : b
        );
        this.saucerSource.next(nuevasBebidas);
      }),
      catchError(this.handleError)
    );
  }
}