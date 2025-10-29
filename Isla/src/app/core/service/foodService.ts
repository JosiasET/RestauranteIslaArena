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

  // ✅ CONTROL DE SINCRONIZACIÓN
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;

  constructor(private http: HttpClient) {
    this.cargarPlatillos().subscribe();
    this.setupOnlineListener();
  }

  // ✅ ESCUCHAR CUANDO VUELVE INTERNET
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet recuperado - Preparando sincronización de platillos...');
      setTimeout(() => {
        this.sincronizarPlatillosOffline();
      }, 3000);
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en FoodService:', error);
    return throwError(() => new Error('Error en el servicio de platillos'));
  }

  private normalizarPlatillo(platillo: any): foodInterface {
    return {
      id: platillo.id_platillo || platillo.id,
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      descripcion_real: platillo.descripcion_real || '',
      precio: platillo.precio,
      imagen: platillo.imagen,
      tiene_tamanos: platillo.tiene_tamanos || false,
      tipos: platillo.tipos || [],
      tamanos: platillo.tamanos || []
    };
  }

  // ✅ CARGAR PLATILLOS (ONLINE/OFFLINE)
  cargarPlatillos(): Observable<foodInterface[]> {
    this.loadingSource.next(true);
    
    if (navigator.onLine) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(platillos => platillos.map(platillo => this.normalizarPlatillo(platillo))),
        tap(platillos => {
          console.log('✅ Platillos cargados desde API:', platillos.length);
          this.saucerSource.next(platillos);
          this.loadingSource.next(false);
          this.guardarCachePlatillos(platillos);
        }),
        catchError(err => {
          console.error('❌ Error API, cargando desde cache:', err);
          return this.cargarPlatillosOffline();
        })
      );
    } else {
      return this.cargarPlatillosOffline();
    }
  }

  private cargarPlatillosOffline(): Observable<foodInterface[]> {
    return new Observable(observer => {
      try {
        const cacheKey = 'platillos_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const platillosCache = JSON.parse(cached);
          const platillos = platillosCache.data.map((p: any) => this.normalizarPlatillo(p));
          
          console.log('📱 Platillos cargados desde cache:', platillos.length);
          this.saucerSource.next(platillos);
          this.loadingSource.next(false);
          observer.next(platillos);
        } else {
          console.log('📱 No hay platillos en cache');
          this.saucerSource.next([]);
          this.loadingSource.next(false);
          observer.next([]);
        }
        observer.complete();
      } catch (error) {
        console.error('❌ Error cargando cache:', error);
        this.saucerSource.next([]);
        this.loadingSource.next(false);
        observer.next([]);
        observer.complete();
      }
    });
  }

  private guardarCachePlatillos(platillos: foodInterface[]): void {
    try {
      const cacheKey = 'platillos_cache';
      const cacheData = {
        data: platillos,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  // ✅ AGREGAR PLATILLO (ONLINE/OFFLINE)
  agregarPlatillo(platillo: foodInterface): Observable<foodInterface> {
    if (navigator.onLine) {
      const platilloCompleto = {
        ...platillo,
        descripcion_real: platillo.descripcion_real || '',
        tiene_tamanos: platillo.tiene_tamanos || false,
        tipos: platillo.tipos || [],
        tamanos: platillo.tamanos || []
      };

      return this.http.post<any>(this.apiUrl, platilloCompleto).pipe(
        map(platilloRespuesta => this.normalizarPlatillo(platilloRespuesta)),
        tap(nuevoPlatillo => {
          console.log('✅ Platillo agregado a API:', nuevoPlatillo);
          const platillosActuales = this.saucerSource.getValue();
          this.saucerSource.next([nuevoPlatillo, ...platillosActuales]);
          this.guardarCachePlatillos([nuevoPlatillo, ...platillosActuales]);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.agregarPlatilloOffline(platillo);
        })
      );
    } else {
      return this.agregarPlatilloOffline(platillo);
    }
  }

  private agregarPlatilloOffline(platillo: foodInterface): Observable<foodInterface> {
    return new Observable(observer => {
      try {
        const tempId = 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const platilloOffline: foodInterface = {
          ...platillo,
          id: tempId,
          offline: true
        };

        this.agregarPendiente('CREATE', platilloOffline, true);

        const platillosActuales = this.saucerSource.getValue();
        this.saucerSource.next([platilloOffline, ...platillosActuales]);
        this.guardarCachePlatillos([platilloOffline, ...platillosActuales]);

        console.log('📱 Platillo guardado offline - ID temporal:', tempId);
        
        observer.next(platilloOffline);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  eliminarPlatillo(id: number): Observable<void> {
    if (navigator.onLine) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          console.log('✅ Platillo eliminado de API, ID:', id);
          const platillosActuales = this.saucerSource.getValue();
          const nuevosPlatillos = platillosActuales.filter(p => p.id !== id);
          this.saucerSource.next(nuevosPlatillos);
          this.guardarCachePlatillos(nuevosPlatillos);
        }),
        catchError(err => {
          console.error('❌ Error API, marcando para eliminar offline:', err);
          return this.eliminarPlatilloOffline(id);
        })
      );
    } else {
      return this.eliminarPlatilloOffline(id);
    }
  }

  private eliminarPlatilloOffline(id: number): Observable<void> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('DELETE', { id }, true);

        const platillosActuales = this.saucerSource.getValue();
        const nuevosPlatillos = platillosActuales.filter(p => p.id !== id);
        this.saucerSource.next(nuevosPlatillos);
        this.guardarCachePlatillos(nuevosPlatillos);

        console.log('📱 Platillo marcado para eliminar offline, ID:', id);
        
        observer.next();
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  actualizarPlatillo(platillo: foodInterface): Observable<foodInterface> {
    if (navigator.onLine) {
      const platilloCompleto = {
        ...platillo,
        descripcion_real: platillo.descripcion_real || '',
        tiene_tamanos: platillo.tiene_tamanos || false,
        tipos: platillo.tipos || [],
        tamanos: platillo.tamanos || []
      };

      return this.http.put<any>(`${this.apiUrl}/${platillo.id}`, platilloCompleto).pipe(
        map(platilloRespuesta => this.normalizarPlatillo(platilloRespuesta)),
        tap(actualizada => {
          console.log('✅ Platillo actualizado en API:', actualizada);
          const platillosActuales = this.saucerSource.getValue();
          const nuevosPlatillos = platillosActuales.map(p =>
            p.id === actualizada.id ? actualizada : p
          );
          this.saucerSource.next(nuevosPlatillos);
          this.guardarCachePlatillos(nuevosPlatillos);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarPlatilloOffline(platillo);
        })
      );
    } else {
      return this.actualizarPlatilloOffline(platillo);
    }
  }

  private actualizarPlatilloOffline(platillo: foodInterface): Observable<foodInterface> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('UPDATE', platillo, true);

        const platillosActuales = this.saucerSource.getValue();
        const platilloActualizado: foodInterface = {
          ...platillo
        };
        
        const nuevosPlatillos = platillosActuales.map(p =>
          p.id === platillo.id ? platilloActualizado : p
        );
        
        this.saucerSource.next(nuevosPlatillos);
        this.guardarCachePlatillos(nuevosPlatillos);

        console.log('📱 Platillo actualizado offline:', platilloActualizado);
        
        observer.next(platilloActualizado);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ AGREGAR OPERACIÓN PENDIENTE
  private agregarPendiente(operation: 'CREATE' | 'UPDATE' | 'DELETE', data: any, isNew: boolean = false): void {
    try {
      const pendientes = this.obtenerPendientes();
      
      if (isNew) {
        const existeDuplicadoActivo = pendientes.some(p => 
          p.operation === operation && 
          p.status !== 'processed' &&
          this.sonDatosSimilares(p.data, data)
        );
        
        if (existeDuplicadoActivo) {
          console.log('⚠️ Operación duplicada activa ignorada:', operation);
          return;
        }
      }

      pendientes.push({
        operation,
        data,
        timestamp: new Date().getTime(),
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        attempts: 0
      });
      
      localStorage.setItem('platillos_pendientes', JSON.stringify(pendientes));
      console.log('📝 Operación pendiente agregada:', operation);
    } catch (error) {
      console.error('❌ Error guardando operación pendiente:', error);
    }
  }

  private sonDatosSimilares(dato1: any, dato2: any): boolean {
    if (dato1.nombre && dato2.nombre) {
      return dato1.nombre === dato2.nombre && dato1.precio === dato2.precio;
    }
    if (dato1.id && dato2.id) {
      return dato1.id === dato2.id;
    }
    return false;
  }

  private obtenerPendientes(): any[] {
    try {
      const pendientes = localStorage.getItem('platillos_pendientes');
      return pendientes ? JSON.parse(pendientes) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ SINCRONIZACIÓN MEJORADA
  private sincronizarPlatillosOffline(): void {
    if (this.isSyncing) {
      console.log('⚠️ Sincronización ya en progreso...');
      return;
    }

    const pendientes = this.obtenerPendientes().filter(p => p.status === 'pending');
    if (pendientes.length === 0) {
      console.log('✅ No hay operaciones pendientes para sincronizar');
      return;
    }

    this.isSyncing = true;
    this.syncAttempts++;
    console.log(`🔄 Sincronizando ${pendientes.length} operaciones (intento ${this.syncAttempts})...`);

    this.marcarPendientesComoProcessing(pendientes);

    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (platillosServidor) => {
        console.log('📊 Platillos en servidor para verificación:', platillosServidor.length);
        this.procesarPendientesConVerificacionAvanzada(pendientes, platillosServidor);
      },
      error: (err) => {
        console.error('❌ Error cargando platillos del servidor:', err);
        this.reintentarSincronizacion();
      }
    });
  }

  private marcarPendientesComoProcessing(pendientes: any[]): void {
    const todasPendientes = this.obtenerPendientes();
    const actualizadas = todasPendientes.map(p => {
      if (pendientes.some(pend => pend.id === p.id)) {
        return { ...p, status: 'processing' };
      }
      return p;
    });
    localStorage.setItem('platillos_pendientes', JSON.stringify(actualizadas));
  }

  private procesarPendientesConVerificacionAvanzada(pendientes: any[], platillosServidor: any[]): void {
    let procesadas = 0;
    let exitosas = 0;
    let duplicados = 0;
    let errores = 0;

    pendientes.forEach(pendiente => {
      switch (pendiente.operation) {
        case 'CREATE':
          this.procesarCreateConVerificacionAvanzada(pendiente, platillosServidor, (resultado) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'duplicado') duplicados++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacion(procesadas, pendientes.length, exitosas, duplicados, errores);
          });
          break;

        case 'UPDATE':
          this.procesarUpdateAvanzado(pendiente, (resultado) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacion(procesadas, pendientes.length, exitosas, duplicados, errores);
          });
          break;

        case 'DELETE':
          this.procesarDeleteAvanzado(pendiente, (resultado) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacion(procesadas, pendientes.length, exitosas, duplicados, errores);
          });
          break;
      }
    });
  }

  private procesarCreateConVerificacionAvanzada(pendiente: any, platillosServidor: any[], callback: (resultado: string) => void): void {
    const platilloPendiente = pendiente.data;
    
    const existeDuplicadoExacto = platillosServidor.some(platillo => {
      const mismoNombre = platillo.nombre.toLowerCase() === platilloPendiente.nombre.toLowerCase();
      const mismoPrecio = platillo.precio === platilloPendiente.precio;
      const mismaDescripcion = platillo.descripcion === platilloPendiente.descripcion;
      const mismaImagen = platillo.imagen === platilloPendiente.imagen;
      
      return mismoNombre && mismoPrecio && mismaDescripcion && mismaImagen;
    });

    if (existeDuplicadoExacto) {
      console.log('⚠️ Platillo EXACTO duplicado detectado y omitido:', platilloPendiente.nombre);
      this.marcarPendienteComoProcesada(pendiente.id, 'duplicado');
      callback('duplicado');
      return;
    }

    const esPlatilloOffline = platilloPendiente.id && platilloPendiente.id.toString().includes('offline_');
    if (esPlatilloOffline) {
      const posibleDuplicado = platillosServidor.find(platillo => 
        platillo.nombre.toLowerCase() === platilloPendiente.nombre.toLowerCase()
      );
      
      if (posibleDuplicado) {
        console.log('⚠️ Posible platillo offline duplicado:', platilloPendiente.nombre);
        this.actualizarPlatilloExistente(posibleDuplicado.id, platilloPendiente, pendiente.id, callback);
        return;
      }
    }

    const platilloCompleto = {
      ...platilloPendiente,
      descripcion_real: platilloPendiente.descripcion_real || '',
      tiene_tamanos: platilloPendiente.tiene_tamanos || false,
      tipos: platilloPendiente.tipos || [],
      tamanos: platilloPendiente.tamanos || []
    };

    this.http.post(this.apiUrl, platilloCompleto).subscribe({
      next: (response) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ Platillo sincronizado exitosamente:', platilloPendiente.nombre);
        this.actualizarCacheConNuevoPlatillo(response);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando CREATE:', platilloPendiente.nombre, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private actualizarPlatilloExistente(idExistente: any, platilloNuevo: any, pendienteId: string, callback: (resultado: string) => void): void {
    const platilloCompleto = {
      ...platilloNuevo,
      descripcion_real: platilloNuevo.descripcion_real || '',
      tiene_tamanos: platilloNuevo.tiene_tamanos || false,
      tipos: platilloNuevo.tipos || [],
      tamanos: platilloNuevo.tamanos || []
    };

    this.http.put(`${this.apiUrl}/${idExistente}`, platilloCompleto).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendienteId, 'exitoso');
        console.log('✅ Platillo existente actualizado:', platilloNuevo.nombre);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error actualizando platillo existente:', platilloNuevo.nombre, err);
        this.marcarPendienteComoFallida(pendienteId);
        callback('error');
      }
    });
  }

  private actualizarCacheConNuevoPlatillo(nuevoPlatillo: any): void {
    try {
      const cacheKey = 'platillos_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const platillosCache = cacheData.data || [];
        
        const platillosActualizados = platillosCache.map((p: any) => 
          p.id && p.id.toString().includes('offline_') && p.nombre === nuevoPlatillo.nombre 
            ? this.normalizarPlatillo(nuevoPlatillo) 
            : p
        );
        
        if (!platillosActualizados.some((p: any) => p.id === nuevoPlatillo.id)) {
          platillosActualizados.push(this.normalizarPlatillo(nuevoPlatillo));
        }
        
        this.guardarCachePlatillos(platillosActualizados);
      }
    } catch (error) {
      console.error('❌ Error actualizando cache:', error);
    }
  }

  private procesarUpdateAvanzado(pendiente: any, callback: (resultado: string) => void): void {
    const platilloCompleto = {
      ...pendiente.data,
      descripcion_real: pendiente.data.descripcion_real || '',
      tiene_tamanos: pendiente.data.tiene_tamanos || false,
      tipos: pendiente.data.tipos || [],
      tamanos: pendiente.data.tamanos || []
    };

    this.http.put(`${this.apiUrl}/${pendiente.data.id}`, platilloCompleto).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ UPDATE sincronizado:', pendiente.data.nombre);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando UPDATE:', pendiente.data.nombre, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private procesarDeleteAvanzado(pendiente: any, callback: (resultado: string) => void): void {
    this.http.delete(`${this.apiUrl}/${pendiente.data.id}`).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ DELETE sincronizado:', pendiente.data.id);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando DELETE:', pendiente.data.id, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private marcarPendienteComoProcesada(id: string, resultado: string): void {
    const pendientes = this.obtenerPendientes();
    const actualizadas = pendientes.map(p => 
      p.id === id ? { ...p, status: 'processed', resultado } : p
    );
    localStorage.setItem('platillos_pendientes', JSON.stringify(actualizadas));
  }

  private marcarPendienteComoFallida(id: string): void {
    const pendientes = this.obtenerPendientes();
    const actualizadas = pendientes.map(p => {
      if (p.id === id) {
        const attempts = (p.attempts || 0) + 1;
        return { 
          ...p, 
          status: attempts >= 3 ? 'failed' : 'pending', 
          attempts 
        };
      }
      return p;
    });
    localStorage.setItem('platillos_pendientes', JSON.stringify(actualizadas));
  }

  private finalizarSincronizacion(procesadas: number, total: number, exitosas: number, duplicados: number, errores: number): void {
    if (procesadas === total) {
      this.isSyncing = false;
      
      console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${duplicados} duplicados omitidos, ${errores} errores`);
      
      setTimeout(() => this.limpiarPendientesProcesadas(), 30000);
      
      setTimeout(() => {
        this.cargarPlatillos().subscribe();
        console.log('🔄 Lista de platillos actualizada después de sincronización');
      }, 1000);

      this.syncAttempts = 0;
    }
  }

  private reintentarSincronizacion(): void {
    this.isSyncing = false;
    
    if (this.syncAttempts < this.maxSyncAttempts) {
      console.log(`🔄 Reintentando sincronización en 5 segundos... (${this.syncAttempts + 1}/${this.maxSyncAttempts})`);
      setTimeout(() => this.sincronizarPlatillosOffline(), 5000);
    } else {
      console.error('❌ Máximo de intentos de sincronización alcanzado');
      this.syncAttempts = 0;
    }
  }

  private limpiarPendientesProcesadas(): void {
    const pendientes = this.obtenerPendientes();
    const pendientesActivas = pendientes.filter(p => p.status !== 'processed');
    localStorage.setItem('platillos_pendientes', JSON.stringify(pendientesActivas));
    console.log('🧹 Pendientes procesadas limpiadas');
  }

  // ✅ MÉTODO PARA LIMPIAR MANUALMENTE (DEBUG)
  limpiarPendientesManual(): void {
    localStorage.removeItem('platillos_pendientes');
    console.log('🧹 Pendientes limpiadas manualmente');
  }

  getPlatillosActuales(): foodInterface[] {
    return this.saucerSource.getValue();
  }

  forzarRecarga(): void {
    console.log('🔄 Forzando recarga manual...');
    this.cargarPlatillos().subscribe();
  }
}