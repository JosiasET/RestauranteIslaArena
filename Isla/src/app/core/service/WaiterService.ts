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

  // ✅ CONTROL DE SINCRONIZACIÓN
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;

  constructor(private http: HttpClient) {
    this.cargarMeseros().subscribe();
    this.setupOnlineListener();
  }

  // ✅ ESCUCHAR CUANDO VUELVE INTERNET
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet recuperado - Preparando sincronización de meseros...');
      setTimeout(() => {
        this.sincronizarMeserosOffline();
      }, 3000);
    });
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
      activo: mesero.activo !== undefined ? mesero.activo : true,
      // ✅ AGREGAR PROPIEDADES OFFLINE
      offline: mesero.offline || false,
      pendingSync: mesero.pendingSync || false,
      tempId: mesero.tempId,
      syncStatus: mesero.syncStatus || 'synced'
    };
  }

  // ✅ CARGAR MESEROS (ONLINE/OFFLINE)
  cargarMeseros(): Observable<MeseroInterface[]> {
    this.loadingSource.next(true);
    
    if (navigator.onLine) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(meseros => meseros.map(mesero => this.normalizarMesero(mesero))),
        tap(meseros => {
          console.log('✅ Meseros cargados desde API:', meseros.length);
          this.meserosSource.next(meseros);
          this.loadingSource.next(false);
          this.guardarCacheMeseros(meseros);
        }),
        catchError(err => {
          console.error('❌ Error API, cargando desde cache:', err);
          return this.cargarMeserosOffline();
        })
      );
    } else {
      return this.cargarMeserosOffline();
    }
  }

  private cargarMeserosOffline(): Observable<MeseroInterface[]> {
    return new Observable(observer => {
      try {
        const cacheKey = 'meseros_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const meserosCache = JSON.parse(cached);
          const meseros = meserosCache.data.map((m: any) => this.normalizarMesero(m));
          
          console.log('📱 Meseros cargados desde cache:', meseros.length);
          this.meserosSource.next(meseros);
          this.loadingSource.next(false);
          observer.next(meseros);
        } else {
          console.log('📱 No hay meseros en cache');
          this.meserosSource.next([]);
          this.loadingSource.next(false);
          observer.next([]);
        }
        observer.complete();
      } catch (error) {
        console.error('❌ Error cargando cache:', error);
        this.meserosSource.next([]);
        this.loadingSource.next(false);
        observer.next([]);
        observer.complete();
      }
    });
  }

  private guardarCacheMeseros(meseros: MeseroInterface[]): void {
    try {
      const cacheKey = 'meseros_cache';
      const cacheData = {
        data: meseros,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  // ✅ CREAR MESERO (ONLINE/OFFLINE)
  crearMesero(mesero: MeseroInterface): Observable<MeseroInterface> {
    if (navigator.onLine) {
      return this.http.post<any>(this.apiUrl, mesero).pipe(
        map(meseroRespuesta => this.normalizarMesero(meseroRespuesta)),
        tap(nuevoMesero => {
          console.log('✅ Mesero agregado a API:', nuevoMesero);
          const meserosActuales = this.meserosSource.getValue();
          this.meserosSource.next([nuevoMesero, ...meserosActuales]);
          this.guardarCacheMeseros([nuevoMesero, ...meserosActuales]);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.crearMeseroOffline(mesero);
        })
      );
    } else {
      return this.crearMeseroOffline(mesero);
    }
  }

  private crearMeseroOffline(mesero: MeseroInterface): Observable<MeseroInterface> {
    return new Observable(observer => {
      try {
        const tempId = 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const meseroOffline: MeseroInterface = {
          ...mesero,
          id: tempId,
          offline: true,
          syncStatus: 'pending'
        };

        this.agregarPendiente('CREATE', meseroOffline, true);

        const meserosActuales = this.meserosSource.getValue();
        this.meserosSource.next([meseroOffline, ...meserosActuales]);
        this.guardarCacheMeseros([meseroOffline, ...meserosActuales]);

        console.log('📱 Mesero guardado offline - ID temporal:', tempId);
        
        observer.next(meseroOffline);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ ACTUALIZAR MESERO (ONLINE/OFFLINE)
  actualizarMesero(mesero: MeseroInterface): Observable<MeseroInterface> {
    if (navigator.onLine) {
      return this.http.put<any>(`${this.apiUrl}/${mesero.id}`, mesero).pipe(
        map(meseroRespuesta => this.normalizarMesero(meseroRespuesta)),
        tap(actualizado => {
          console.log('✅ Mesero actualizado en API:', actualizado);
          const meserosActuales = this.meserosSource.getValue();
          const nuevosMeseros = meserosActuales.map(m =>
            m.id === actualizado.id ? actualizado : m
          );
          this.meserosSource.next(nuevosMeseros);
          this.guardarCacheMeseros(nuevosMeseros);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarMeseroOffline(mesero);
        })
      );
    } else {
      return this.actualizarMeseroOffline(mesero);
    }
  }

  private actualizarMeseroOffline(mesero: MeseroInterface): Observable<MeseroInterface> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('UPDATE', mesero, true);

        const meserosActuales = this.meserosSource.getValue();
        const meseroActualizado: MeseroInterface = {
          ...mesero,
          syncStatus: 'pending'
        };
        
        const nuevosMeseros = meserosActuales.map(m =>
          m.id === mesero.id ? meseroActualizado : m
        );
        
        this.meserosSource.next(nuevosMeseros);
        this.guardarCacheMeseros(nuevosMeseros);

        console.log('📱 Mesero actualizado offline:', meseroActualizado);
        
        observer.next(meseroActualizado);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ ELIMINAR MESERO (ONLINE/OFFLINE)
  eliminarMesero(id: number): Observable<void> {
    if (navigator.onLine) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          console.log('✅ Mesero eliminado de API, ID:', id);
          const meserosActuales = this.meserosSource.getValue();
          const nuevosMeseros = meserosActuales.filter(m => m.id !== id);
          this.meserosSource.next(nuevosMeseros);
          this.guardarCacheMeseros(nuevosMeseros);
        }),
        catchError(err => {
          console.error('❌ Error API, marcando para eliminar offline:', err);
          return this.eliminarMeseroOffline(id);
        })
      );
    } else {
      return this.eliminarMeseroOffline(id);
    }
  }

  private eliminarMeseroOffline(id: number): Observable<void> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('DELETE', { id }, true);

        const meserosActuales = this.meserosSource.getValue();
        const nuevosMeseros = meserosActuales.filter(m => m.id !== id);
        this.meserosSource.next(nuevosMeseros);
        this.guardarCacheMeseros(nuevosMeseros);

        console.log('📱 Mesero marcado para eliminar offline, ID:', id);
        
        observer.next();
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ TOGGLE ESTADO (ONLINE/OFFLINE)
  toggleEstado(mesero: MeseroInterface): Observable<MeseroInterface> {
    const actualizado = { ...mesero, activo: !mesero.activo };
    return this.actualizarMesero(actualizado);
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
      
      localStorage.setItem('meseros_pendientes', JSON.stringify(pendientes));
      console.log('📝 Operación pendiente agregada:', operation);
    } catch (error) {
      console.error('❌ Error guardando operación pendiente:', error);
    }
  }

  private sonDatosSimilares(dato1: any, dato2: any): boolean {
    if (dato1.id && dato2.id) {
      return dato1.id === dato2.id;
    }
    if (dato1.usuario && dato2.usuario) {
      return dato1.usuario === dato2.usuario;
    }
    return false;
  }

  private obtenerPendientes(): any[] {
    try {
      const pendientes = localStorage.getItem('meseros_pendientes');
      return pendientes ? JSON.parse(pendientes) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ SINCRONIZACIÓN MEJORADA
  private sincronizarMeserosOffline(): void {
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

    // Cargar meseros actuales del servidor para verificación
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (meserosServidor) => {
        console.log('📊 Meseros en servidor para verificación:', meserosServidor.length);
        this.procesarPendientesConVerificacion(pendientes, meserosServidor);
      },
      error: (err) => {
        console.error('❌ Error cargando meseros del servidor:', err);
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
    localStorage.setItem('meseros_pendientes', JSON.stringify(actualizadas));
  }

  private procesarPendientesConVerificacion(pendientes: any[], meserosServidor: any[]): void {
    let procesadas = 0;
    let exitosas = 0;
    let duplicados = 0;
    let errores = 0;

    pendientes.forEach(pendiente => {
      switch (pendiente.operation) {
        case 'CREATE':
          this.procesarCreateConVerificacion(pendiente, meserosServidor, (resultado) => {
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

  // En WaiterService.ts - actualizar el método procesarCreateConVerificacion

private procesarCreateConVerificacion(pendiente: any, meserosServidor: any[], callback: (resultado: string) => void): void {
  const meseroPendiente = pendiente.data;
  
  // ✅ VERIFICAR DUPLICADO POR USUARIO
  const existeDuplicado = meserosServidor.some(mesero => 
    mesero.usuario.toLowerCase() === meseroPendiente.usuario.toLowerCase()
  );

  if (existeDuplicado) {
    console.log('⚠️ Mesero duplicado detectado y omitido:', meseroPendiente.usuario);
    this.marcarPendienteComoProcesada(pendiente.id, 'duplicado');
    
    // ✅ ACTUALIZAR CACHE LOCAL - Reemplazar el offline con el del servidor
    const meseroServidor = meserosServidor.find(m => m.usuario.toLowerCase() === meseroPendiente.usuario.toLowerCase());
    if (meseroServidor) {
      const meserosActuales = this.meserosSource.getValue();
      const meserosActualizados = meserosActuales.map(m => 
        m.id === meseroPendiente.id ? this.normalizarMesero(meseroServidor) : m
      );
      this.meserosSource.next(meserosActualizados);
      this.guardarCacheMeseros(meserosActualizados);
    }
    
    callback('duplicado');
    return;
  }

  this.http.post(this.apiUrl, meseroPendiente).subscribe({
    next: (response: any) => {
      this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
      console.log('✅ Mesero sincronizado exitosamente:', meseroPendiente.usuario);
      
      // ✅ ACTUALIZAR CACHE LOCAL CON LA RESPUESTA DEL SERVIDOR
      this.actualizarCacheConNuevoMesero(response);
      
      callback('exitoso');
    },
    error: (err) => {
      console.error('❌ Error sincronizando CREATE:', meseroPendiente.usuario, err);
      
      // ✅ MANEJO MEJORADO DE ERRORES
      if (err.status === 400 && err.error?.error?.includes('usuario ya existe')) {
        console.log('⚠️ Usuario duplicado en servidor:', meseroPendiente.usuario);
        this.marcarPendienteComoProcesada(pendiente.id, 'duplicado');
        callback('duplicado');
      } else {
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    }
  });
}

  private procesarUpdateAvanzado(pendiente: any, callback: (resultado: string) => void): void {
    this.http.put(`${this.apiUrl}/${pendiente.data.id}`, pendiente.data).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ UPDATE sincronizado:', pendiente.data.usuario);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando UPDATE:', pendiente.data.usuario, err);
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

  private actualizarCacheConNuevoMesero(nuevoMesero: any): void {
    try {
      const cacheKey = 'meseros_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const meserosCache = cacheData.data || [];
        
        // Reemplazar mesero offline con el del servidor
        const meserosActualizados = meserosCache.map((m: any) => 
          m.id && m.id.toString().includes('offline_') && m.usuario === nuevoMesero.usuario 
            ? this.normalizarMesero(nuevoMesero) 
            : m
        );
        
        // Si no estaba en cache, agregarlo
        if (!meserosActualizados.some((m: any) => m.id === nuevoMesero.id)) {
          meserosActualizados.push(this.normalizarMesero(nuevoMesero));
        }
        
        this.guardarCacheMeseros(meserosActualizados);
      }
    } catch (error) {
      console.error('❌ Error actualizando cache:', error);
    }
  }

  private marcarPendienteComoProcesada(id: string, resultado: string): void {
    const pendientes = this.obtenerPendientes();
    const actualizadas = pendientes.map(p => 
      p.id === id ? { ...p, status: 'processed', resultado } : p
    );
    localStorage.setItem('meseros_pendientes', JSON.stringify(actualizadas));
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
    localStorage.setItem('meseros_pendientes', JSON.stringify(actualizadas));
  }

  private finalizarSincronizacion(procesadas: number, total: number, exitosas: number, duplicados: number, errores: number): void {
    if (procesadas === total) {
      this.isSyncing = false;
      
      console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${duplicados} duplicados omitidos, ${errores} errores`);
      
      setTimeout(() => this.limpiarPendientesProcesadas(), 30000);
      
      setTimeout(() => {
        this.cargarMeseros().subscribe();
        console.log('🔄 Lista de meseros actualizada después de sincronización');
      }, 1000);

      this.syncAttempts = 0;
    }
  }

  private reintentarSincronizacion(): void {
    this.isSyncing = false;
    
    if (this.syncAttempts < this.maxSyncAttempts) {
      console.log(`🔄 Reintentando sincronización en 5 segundos... (${this.syncAttempts + 1}/${this.maxSyncAttempts})`);
      setTimeout(() => this.sincronizarMeserosOffline(), 5000);
    } else {
      console.error('❌ Máximo de intentos de sincronización alcanzado');
      this.syncAttempts = 0;
    }
  }

  private limpiarPendientesProcesadas(): void {
    const pendientes = this.obtenerPendientes();
    const pendientesActivas = pendientes.filter(p => p.status !== 'processed');
    localStorage.setItem('meseros_pendientes', JSON.stringify(pendientesActivas));
    console.log('🧹 Pendientes procesadas limpiadas');
  }

  // ✅ MÉTODO PARA LIMPIAR MANUALMENTE (DEBUG)
  limpiarPendientesManual(): void {
    localStorage.removeItem('meseros_pendientes');
    console.log('🧹 Pendientes limpiadas manualmente');
  }


  // ✅ LOGIN DE MESERO (ONLINE Y OFFLINE)
loginMesero(usuario: string, contrasena: string): Observable<MeseroInterface | null> {
  if (navigator.onLine) {
    // 🔹 Buscar usuario directamente en la API
    return this.http.get<MeseroInterface[]>(this.apiUrl).pipe(
      map(meseros => {
        const encontrado = meseros.find(
          m => m.usuario === usuario && m.contrasena === contrasena && m.activo
        );
        return encontrado ? this.normalizarMesero(encontrado) : null;
      }),
      catchError(err => {
        console.error('❌ Error verificando login online, probando cache local', err);
        // Si falla el backend, intentar login offline
        return this.loginMeseroOffline(usuario, contrasena);
      })
    );
  } else {
    // 🔹 Modo sin conexión
    return this.loginMeseroOffline(usuario, contrasena);
  }
}

// ✅ LOGIN USANDO CACHE LOCAL
private loginMeseroOffline(usuario: string, contrasena: string): Observable<MeseroInterface | null> {
  try {
    const cacheKey = 'meseros_cache';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const meserosCache = JSON.parse(cached).data || [];
      const mesero = meserosCache.find(
        (m: MeseroInterface) => 
          m.usuario === usuario && m.contrasena === contrasena && m.activo
      );
      if (mesero) {
        console.log('📱 Login offline exitoso:', mesero.usuario);
        return of(this.normalizarMesero(mesero));
      }
    }
    console.warn('📱 Login offline fallido: usuario no encontrado');
    return of(null);
  } catch (error) {
    console.error('❌ Error en login offline:', error);
    return of(null);
  }
}

}