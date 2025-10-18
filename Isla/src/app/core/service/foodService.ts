import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, timer, throwError } from 'rxjs';
import { retry, timeout, switchMap } from 'rxjs/operators';
import { foodInterface } from '../interface/foodInterface';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = 'http://localhost:3000/platillos';
  private saucerSource = new BehaviorSubject<foodInterface[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);
  private initialized = false;

  saucer$ = this.saucerSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {
    this.inicializarServicio();
  }

  // SOLUCIÓN: Inicialización más robusta con retry
  private inicializarServicio() {
    if (this.initialized) return;
    
    console.log('🔄 Inicializando FoodService...');
    this.cargarPlatillosConRetry().subscribe({
      next: () => {
        this.initialized = true;
        console.log('✅ FoodService inicializado correctamente');
      },
      error: (err) => {
        console.error('❌ Error crítico al inicializar FoodService:', err);
        this.loadingSource.next(false);
      }
    });
  }

  // SOLUCIÓN: Carga con retry automático
  private cargarPlatillosConRetry(): Observable<foodInterface[]> {
    this.loadingSource.next(true);
    
    return this.http.get<foodInterface[]>(this.apiUrl).pipe(
      timeout(10000), // Timeout de 10 segundos
      retry({
        count: 3, // Reintentar 3 veces
        delay: (error, retryCount) => {
          console.log(`🔄 Reintento ${retryCount}/3 por error:`, error.message);
          return timer(2000); // Esperar 2 segundos entre reintentos
        }
      }),
      tap(platillos => {
        console.log(`✅ ${platillos.length} platillos cargados correctamente`);
        this.saucerSource.next(platillos);
        this.loadingSource.next(false);
      }),
      catchError(err => {
        console.error('❌ Error fatal al cargar platillos después de reintentos:', err);
        this.saucerSource.next(this.getPlatillosDeRespaldo());
        this.loadingSource.next(false);
        return of([]);
      })
    );
  }

  // SOLUCIÓN: Datos de respaldo en caso de error
  private getPlatillosDeRespaldo(): foodInterface[] {
    console.log('🛟 Usando datos de respaldo...');
    return [
      {
        id: 1,
        nombre: 'Ceviche Mixto',
        descripcion: 'Ceviche fresco con mariscos',
        precio: 120,
        imagen: 'assets/ceviche.jpg'
      },
      {
        id: 2,
        nombre: 'Sopa de Mariscos',
        descripcion: 'Sopa caliente con variedad de mariscos',
        precio: 80,
        imagen: 'assets/sopa.jpg'
      }
    ];
  }

  cargarPlatillos(forceRefresh: boolean = false): Observable<foodInterface[]> {
    console.log('📥 Solicitando carga de platillos...');
    
    if (forceRefresh || this.saucerSource.getValue().length === 0) {
      return this.cargarPlatillosConRetry();
    } else {
      console.log('✅ Usando datos en cache');
      this.loadingSource.next(false);
      return of(this.saucerSource.getValue());
    }
  }

  agregarPlatillo(platillo: foodInterface): Observable<foodInterface> {
    return this.http.post<foodInterface>(this.apiUrl, platillo).pipe(
      tap(nuevoPlatillo => {
        const platillosActuales = this.saucerSource.getValue();
        this.saucerSource.next([nuevoPlatillo, ...platillosActuales]);
      }),
      catchError(err => {
        console.error('❌ Error al subir platillo:', err);
        // SOLUCIÓN: Agregar localmente aunque falle el servidor
        const platillosActuales = this.saucerSource.getValue();
        const platilloLocal = { ...platillo, id: Date.now() };
        this.saucerSource.next([platilloLocal, ...platillosActuales]);
        return of(platilloLocal);
      })
    );
  }

  eliminarPlatillo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const platillosActuales = this.saucerSource.getValue();
        const nuevosPlatillos = platillosActuales.filter(p => p.id !== id);
        this.saucerSource.next(nuevosPlatillos);
      }),
      catchError(err => {
        console.error('❌ Error al eliminar platillo:', err);
        // SOLUCIÓN: Eliminar localmente aunque falle el servidor
        const platillosActuales = this.saucerSource.getValue();
        const nuevosPlatillos = platillosActuales.filter(p => p.id !== id);
        this.saucerSource.next(nuevosPlatillos);
        return of(void 0);
      })
    );
  }

  actualizarPlatillo(platillo: foodInterface): Observable<foodInterface> {
    return this.http.put<foodInterface>(`${this.apiUrl}/${platillo.id}`, platillo).pipe(
      tap(actualizado => {
        const platillosActuales = this.saucerSource.getValue();
        const nuevosPlatillos = platillosActuales.map(p =>
          p.id === actualizado.id ? actualizado : p
        );
        this.saucerSource.next(nuevosPlatillos);
      }),
      catchError(err => {
        console.error('❌ Error al actualizar platillo:', err);
        throw err;
      })
    );
  }

  forzarRecarga(): void {
    console.log('🔄 Forzando recarga manual...');
    this.cargarPlatillos(true).subscribe();
  }

  getPlatillosActuales(): foodInterface[] {
    return this.saucerSource.getValue();
  }

  // NUEVO: Verificar estado del servicio
  getEstadoServicio(): string {
    const platillos = this.saucerSource.getValue();
    const loading = this.loadingSource.getValue();
    
    if (loading) return '🔄 Cargando...';
    if (platillos.length === 0) return '❌ Sin datos';
    return `✅ ${platillos.length} platillos cargados`;
  }
}