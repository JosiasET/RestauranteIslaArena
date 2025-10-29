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

  // ✅ CONTROL DE SINCRONIZACIÓN
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;

  constructor(private http: HttpClient) {
    this.cargarBebidas().subscribe();
    this.setupOnlineListener();
  }

  // ✅ ESCUCHAR CUANDO VUELVE INTERNET
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet recuperado - Preparando sincronización...');
      // Esperar 3 segundos antes de sincronizar para asegurar conexión estable
      setTimeout(() => {
        this.sincronizarBebidasOffline();
      }, 3000);
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en DrinkService:', error);
    return throwError(() => new Error('Error en el servicio de bebidas'));
  }

  private normalizarBebida(bebida: any): Drinkinterface {
    return {
      id: bebida.id_bebida || bebida.id,
      nombre: bebida.nombre,
      descripcion: bebida.descripcion,
      precio: bebida.precio,
      imagen: bebida.imagen,
      cantidad_productos: bebida.cantidad_productos || 0
    };
  }

  // ✅ CARGAR BEBIDAS (ONLINE/OFFLINE)
  cargarBebidas(): Observable<Drinkinterface[]> {
    this.loadingSource.next(true);
    
    if (navigator.onLine) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(bebidas => bebidas.map(bebida => this.normalizarBebida(bebida))),
        tap(bebidas => {
          console.log('✅ Bebidas cargadas desde API:', bebidas.length);
          this.saucerSource.next(bebidas);
          this.loadingSource.next(false);
          this.guardarCacheBebidas(bebidas);
        }),
        catchError(err => {
          console.error('❌ Error API, cargando desde cache:', err);
          return this.cargarBebidasOffline();
        })
      );
    } else {
      return this.cargarBebidasOffline();
    }
  }

  private cargarBebidasOffline(): Observable<Drinkinterface[]> {
    return new Observable(observer => {
      try {
        const cacheKey = 'bebidas_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const bebidasCache = JSON.parse(cached);
          const bebidas = bebidasCache.data.map((b: any) => this.normalizarBebida(b));
          
          console.log('📱 Bebidas cargadas desde cache:', bebidas.length);
          this.saucerSource.next(bebidas);
          this.loadingSource.next(false);
          observer.next(bebidas);
        } else {
          console.log('📱 No hay bebidas en cache');
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

  private guardarCacheBebidas(bebidas: Drinkinterface[]): void {
    try {
      const cacheKey = 'bebidas_cache';
      const cacheData = {
        data: bebidas,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  // ✅ AGREGAR BEBIDA (ONLINE/OFFLINE) - MEJORADO
  agregarBebida(bebida: Drinkinterface): Observable<Drinkinterface> {
    if (navigator.onLine) {
      return this.http.post<any>(this.apiUrl, bebida).pipe(
        map(bebidaRespuesta => this.normalizarBebida(bebidaRespuesta)),
        tap(nuevaBebida => {
          console.log('✅ Bebida agregada a API:', nuevaBebida);
          const bebidasActuales = this.saucerSource.getValue();
          this.saucerSource.next([nuevaBebida, ...bebidasActuales]);
          this.guardarCacheBebidas([nuevaBebida, ...bebidasActuales]);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.agregarBebidaOffline(bebida);
        })
      );
    } else {
      return this.agregarBebidaOffline(bebida);
    }
  }

  private agregarBebidaOffline(bebida: Drinkinterface): Observable<Drinkinterface> {
    return new Observable(observer => {
      try {
        const tempId = 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const bebidaOffline: Drinkinterface = {
          ...bebida,
          id: tempId
        };

        // ✅ MARCAR COMO SINCRONIZADA TEMPORALMENTE PARA EVITAR DUPLICADOS
        this.agregarPendiente('CREATE', bebidaOffline, true);

        const bebidasActuales = this.saucerSource.getValue();
        this.saucerSource.next([bebidaOffline, ...bebidasActuales]);
        this.guardarCacheBebidas([bebidaOffline, ...bebidasActuales]);

        console.log('📱 Bebida guardada offline - ID temporal:', tempId);
        
        observer.next(bebidaOffline);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  eliminarBebida(id: number): Observable<void> {
    if (navigator.onLine) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          console.log('✅ Bebida eliminada de API, ID:', id);
          const bebidasActuales = this.saucerSource.getValue();
          const nuevasBebidas = bebidasActuales.filter(b => b.id !== id);
          this.saucerSource.next(nuevasBebidas);
          this.guardarCacheBebidas(nuevasBebidas);
        }),
        catchError(err => {
          console.error('❌ Error API, marcando para eliminar offline:', err);
          return this.eliminarBebidaOffline(id);
        })
      );
    } else {
      return this.eliminarBebidaOffline(id);
    }
  }

  private eliminarBebidaOffline(id: number): Observable<void> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('DELETE', { id }, true);

        const bebidasActuales = this.saucerSource.getValue();
        const nuevasBebidas = bebidasActuales.filter(b => b.id !== id);
        this.saucerSource.next(nuevasBebidas);
        this.guardarCacheBebidas(nuevasBebidas);

        console.log('📱 Bebida marcada para eliminar offline, ID:', id);
        
        observer.next();
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  actualizarBebida(bebida: Drinkinterface): Observable<Drinkinterface> {
    if (navigator.onLine) {
      return this.http.put<any>(`${this.apiUrl}/${bebida.id}`, bebida).pipe(
        map(bebidaRespuesta => this.normalizarBebida(bebidaRespuesta)),
        tap(actualizada => {
          console.log('✅ Bebida actualizada en API:', actualizada);
          const bebidasActuales = this.saucerSource.getValue();
          const nuevasBebidas = bebidasActuales.map(b =>
            b.id === actualizada.id ? actualizada : b
          );
          this.saucerSource.next(nuevasBebidas);
          this.guardarCacheBebidas(nuevasBebidas);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarBebidaOffline(bebida);
        })
      );
    } else {
      return this.actualizarBebidaOffline(bebida);
    }
  }

  private actualizarBebidaOffline(bebida: Drinkinterface): Observable<Drinkinterface> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('UPDATE', bebida, true);

        const bebidasActuales = this.saucerSource.getValue();
        const bebidaActualizada: Drinkinterface = {
          ...bebida
        };
        
        const nuevasBebidas = bebidasActuales.map(b =>
          b.id === bebida.id ? bebidaActualizada : b
        );
        
        this.saucerSource.next(nuevasBebidas);
        this.guardarCacheBebidas(nuevasBebidas);

        console.log('📱 Bebida actualizada offline:', bebidaActualizada);
        
        observer.next(bebidaActualizada);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ AGREGAR OPERACIÓN PENDIENTE MEJORADO
  private agregarPendiente(operation: 'CREATE' | 'UPDATE' | 'DELETE', data: any, isNew: boolean = false): void {
    try {
      const pendientes = this.obtenerPendientes();
      
      if (isNew) {
        // ✅ PARA OPERACIONES NUEVAS: Verificar duplicados activos
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
        status: 'pending', // pending, processing, processed, failed
        attempts: 0
      });
      
      localStorage.setItem('bebidas_pendientes', JSON.stringify(pendientes));
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
      const pendientes = localStorage.getItem('bebidas_pendientes');
      return pendientes ? JSON.parse(pendientes) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ SINCRONIZACIÓN MEJORADA - EVITA DUPLICADOS
  private sincronizarBebidasOffline(): void {
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

    // Marcar todas como processing
    this.marcarPendientesComoProcessing(pendientes);

    // Cargar bebidas actuales del servidor
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (bebidasServidor) => {
        console.log('📊 Bebidas en servidor para verificación:', bebidasServidor.length);
        this.procesarPendientesConVerificacionAvanzada(pendientes, bebidasServidor);
      },
      error: (err) => {
        console.error('❌ Error cargando bebidas del servidor:', err);
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
    localStorage.setItem('bebidas_pendientes', JSON.stringify(actualizadas));
  }

  private procesarPendientesConVerificacionAvanzada(pendientes: any[], bebidasServidor: any[]): void {
    let procesadas = 0;
    let exitosas = 0;
    let duplicados = 0;
    let errores = 0;

    pendientes.forEach(pendiente => {
      switch (pendiente.operation) {
        case 'CREATE':
          this.procesarCreateConVerificacionAvanzada(pendiente, bebidasServidor, (resultado) => {
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

  // ✅ VERIFICACIÓN CORREGIDA - SOLO MARCAR DUPLICADOS REALES
  private procesarCreateConVerificacionAvanzada(pendiente: any, bebidasServidor: any[], callback: (resultado: string) => void): void {
    const bebidaPendiente = pendiente.data;
    
    // ✅ VERIFICACIÓN MEJORADA: Solo marcar como duplicado si es EXACTAMENTE igual (incluyendo descripción)
    const existeDuplicadoExacto = bebidasServidor.some(bebida => {
      const mismoNombre = bebida.nombre.toLowerCase() === bebidaPendiente.nombre.toLowerCase();
      const mismoPrecio = bebida.precio === bebidaPendiente.precio;
      const mismaDescripcion = bebida.descripcion === bebidaPendiente.descripcion;
      const mismaImagen = bebida.imagen === bebidaPendiente.imagen;
      
      // Solo considerar duplicado si TODOS los campos principales son iguales
      return mismoNombre && mismoPrecio && mismaDescripcion && mismaImagen;
    });

    if (existeDuplicadoExacto) {
      console.log('⚠️ Bebida EXACTA duplicada detectada y omitida:', bebidaPendiente.nombre);
      this.marcarPendienteComoProcesada(pendiente.id, 'duplicado');
      callback('duplicado');
      return;
    }

    // ✅ VERIFICAR SI ES UNA BEBIDA OFFLINE QUE YA FUE SINCRONIZADA
    const esBebidaOffline = bebidaPendiente.id && bebidaPendiente.id.toString().includes('offline_');
    if (esBebidaOffline) {
      // Verificar si ya existe una bebida con el mismo nombre que podría ser la misma
      const posibleDuplicado = bebidasServidor.find(bebida => 
        bebida.nombre.toLowerCase() === bebidaPendiente.nombre.toLowerCase()
      );
      
      if (posibleDuplicado) {
        console.log('⚠️ Posible bebida offline duplicada:', bebidaPendiente.nombre);
        // En lugar de marcarla como duplicado, actualizar la existente
        this.actualizarBebidaExistente(posibleDuplicado.id, bebidaPendiente, pendiente.id, callback);
        return;
      }
    }

    // Si no existe duplicado exacto, crear la bebida
    this.http.post(this.apiUrl, bebidaPendiente).subscribe({
      next: (response) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ Bebida sincronizada exitosamente:', bebidaPendiente.nombre);
        
        // Actualizar cache local con la respuesta del servidor
        this.actualizarCacheConNuevaBebida(response);
        
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando CREATE:', bebidaPendiente.nombre, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  // ✅ ACTUALIZAR BEBIDA EXISTENTE EN LUGAR DE CREAR DUPLICADO
  private actualizarBebidaExistente(idExistente: any, bebidaNueva: any, pendienteId: string, callback: (resultado: string) => void): void {
    this.http.put(`${this.apiUrl}/${idExistente}`, bebidaNueva).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendienteId, 'exitoso');
        console.log('✅ Bebida existente actualizada:', bebidaNueva.nombre);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error actualizando bebida existente:', bebidaNueva.nombre, err);
        this.marcarPendienteComoFallida(pendienteId);
        callback('error');
      }
    });
  }

  // ✅ ACTUALIZAR CACHE CON NUEVA BEBIDA
  private actualizarCacheConNuevaBebida(nuevaBebida: any): void {
    try {
      const cacheKey = 'bebidas_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const bebidasCache = cacheData.data || [];
        
        // Reemplazar bebida offline con la del servidor
        const bebidasActualizadas = bebidasCache.map((b: any) => 
          b.id && b.id.toString().includes('offline_') && b.nombre === nuevaBebida.nombre 
            ? this.normalizarBebida(nuevaBebida) 
            : b
        );
        
        // Si no estaba en cache, agregarla
        if (!bebidasActualizadas.some((b: any) => b.id === nuevaBebida.id)) {
          bebidasActualizadas.push(this.normalizarBebida(nuevaBebida));
        }
        
        this.guardarCacheBebidas(bebidasActualizadas);
      }
    } catch (error) {
      console.error('❌ Error actualizando cache:', error);
    }
  }

  private procesarUpdateAvanzado(pendiente: any, callback: (resultado: string) => void): void {
    this.http.put(`${this.apiUrl}/${pendiente.data.id}`, pendiente.data).subscribe({
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
    localStorage.setItem('bebidas_pendientes', JSON.stringify(actualizadas));
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
    localStorage.setItem('bebidas_pendientes', JSON.stringify(actualizadas));
  }

  private finalizarSincronizacion(procesadas: number, total: number, exitosas: number, duplicados: number, errores: number): void {
    if (procesadas === total) {
      this.isSyncing = false;
      
      console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${duplicados} duplicados omitidos, ${errores} errores`);
      
      // Limpiar pendientes procesadas
      setTimeout(() => this.limpiarPendientesProcesadas(), 30000);
      
      // Recargar bebidas
      setTimeout(() => {
        this.cargarBebidas().subscribe();
        console.log('🔄 Lista de bebidas actualizada después de sincronización');
      }, 1000);

      // Reiniciar contador de intentos
      this.syncAttempts = 0;
    }
  }

  private reintentarSincronizacion(): void {
    this.isSyncing = false;
    
    if (this.syncAttempts < this.maxSyncAttempts) {
      console.log(`🔄 Reintentando sincronización en 5 segundos... (${this.syncAttempts + 1}/${this.maxSyncAttempts})`);
      setTimeout(() => this.sincronizarBebidasOffline(), 5000);
    } else {
      console.error('❌ Máximo de intentos de sincronización alcanzado');
      this.syncAttempts = 0;
    }
  }

  private limpiarPendientesProcesadas(): void {
    const pendientes = this.obtenerPendientes();
    const pendientesActivas = pendientes.filter(p => p.status !== 'processed');
    localStorage.setItem('bebidas_pendientes', JSON.stringify(pendientesActivas));
    console.log('🧹 Pendientes procesadas limpiadas');
  }

  // ✅ MÉTODO PARA LIMPIAR MANUALMENTE (DEBUG)
  limpiarPendientesManual(): void {
    localStorage.removeItem('bebidas_pendientes');
    console.log('🧹 Pendientes limpiadas manualmente');
  }
}