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
  
   getEspecialidadesActuales(): Fish[] {
    return this.saucerSource.getValue();
  }

  // ✅ CONTROL DE SINCRONIZACIÓN
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;

  constructor(private http: HttpClient) {
    this.cargarEspecialidades().subscribe();
    this.setupOnlineListener();
  }

  // ✅ ESCUCHAR CUANDO VUELVE INTERNET
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet recuperado - Preparando sincronización de especialidades...');
      setTimeout(() => {
        this.sincronizarEspecialidadesOffline();
      }, 3000);
    });
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
      imagen: especialidad.imagen,
      cantidad: especialidad.cantidad || 0,
      descripcion_real: especialidad.descripcion_real || especialidad.descripcion,
      tiene_tamanos: especialidad.tiene_tamanos || false,
      tipos: especialidad.tipos || [],
      tamanos: especialidad.tamanos || []
    };
  }

  // ✅ CARGAR ESPECIALIDADES (ONLINE/OFFLINE)
  cargarEspecialidades(): Observable<Fish[]> {
    this.loadingSource.next(true);
    
    if (navigator.onLine) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(especialidades => especialidades.map(esp => this.normalizarEspecialidad(esp))),
        tap(especialidades => {
          console.log('✅ Especialidades cargadas desde API:', especialidades.length);
          this.saucerSource.next(especialidades);
          this.loadingSource.next(false);
          this.guardarCacheEspecialidades(especialidades);
        }),
        catchError(err => {
          console.error('❌ Error API, cargando desde cache:', err);
          return this.cargarEspecialidadesOffline();
        })
      );
    } else {
      return this.cargarEspecialidadesOffline();
    }
  }

  private cargarEspecialidadesOffline(): Observable<Fish[]> {
    return new Observable(observer => {
      try {
        const cacheKey = 'especialidades_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const especialidadesCache = JSON.parse(cached);
          const especialidades = especialidadesCache.data.map((e: any) => this.normalizarEspecialidad(e));
          
          console.log('📱 Especialidades cargadas desde cache:', especialidades.length);
          this.saucerSource.next(especialidades);
          this.loadingSource.next(false);
          observer.next(especialidades);
        } else {
          console.log('📱 No hay especialidades en cache');
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

  private guardarCacheEspecialidades(especialidades: Fish[]): void {
    try {
      const cacheKey = 'especialidades_cache';
      const cacheData = {
        data: especialidades,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  // ✅ AGREGAR ESPECIALIDAD (ONLINE/OFFLINE)
  agregarEspecialidad(especialidad: Fish): Observable<Fish> {
    if (navigator.onLine) {
      const especialidadCompleta = {
        ...especialidad,
        descripcion_real: especialidad.descripcion_real || '',
        tiene_tamanos: especialidad.tiene_tamanos || false,
        tipos: especialidad.tipos || [],
        tamanos: especialidad.tamanos || []
      };

      return this.http.post<any>(this.apiUrl, especialidadCompleta).pipe(
        map(especialidadRespuesta => this.normalizarEspecialidad(especialidadRespuesta)),
        tap(nuevaEspecialidad => {
          console.log('✅ Especialidad agregada a API:', nuevaEspecialidad);
          const especialidadesActuales = this.saucerSource.getValue();
          this.saucerSource.next([nuevaEspecialidad, ...especialidadesActuales]);
          this.guardarCacheEspecialidades([nuevaEspecialidad, ...especialidadesActuales]);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.agregarEspecialidadOffline(especialidad);
        })
      );
    } else {
      return this.agregarEspecialidadOffline(especialidad);
    }
  }

  private agregarEspecialidadOffline(especialidad: Fish): Observable<Fish> {
    return new Observable(observer => {
      try {
        const tempId = 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const especialidadOffline: Fish = {
          ...especialidad,
          id: tempId,
          offline: true
        };

        this.agregarPendiente('CREATE', especialidadOffline, true);

        const especialidadesActuales = this.saucerSource.getValue();
        this.saucerSource.next([especialidadOffline, ...especialidadesActuales]);
        this.guardarCacheEspecialidades([especialidadOffline, ...especialidadesActuales]);

        console.log('📱 Especialidad guardada offline - ID temporal:', tempId);
        
        observer.next(especialidadOffline);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  eliminarEspecialidad(id: number): Observable<void> {
    if (navigator.onLine) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          console.log('✅ Especialidad eliminada de API, ID:', id);
          const especialidadesActuales = this.saucerSource.getValue();
          const nuevasEspecialidades = especialidadesActuales.filter(e => e.id !== id);
          this.saucerSource.next(nuevasEspecialidades);
          this.guardarCacheEspecialidades(nuevasEspecialidades);
        }),
        catchError(err => {
          console.error('❌ Error API, marcando para eliminar offline:', err);
          return this.eliminarEspecialidadOffline(id);
        })
      );
    } else {
      return this.eliminarEspecialidadOffline(id);
    }
  }

  private eliminarEspecialidadOffline(id: number): Observable<void> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('DELETE', { id }, true);

        const especialidadesActuales = this.saucerSource.getValue();
        const nuevasEspecialidades = especialidadesActuales.filter(e => e.id !== id);
        this.saucerSource.next(nuevasEspecialidades);
        this.guardarCacheEspecialidades(nuevasEspecialidades);

        console.log('📱 Especialidad marcada para eliminar offline, ID:', id);
        
        observer.next();
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  actualizarEspecialidad(especialidad: Fish): Observable<Fish> {
    if (navigator.onLine) {
      const especialidadCompleta = {
        ...especialidad,
        descripcion_real: especialidad.descripcion_real || '',
        tiene_tamanos: especialidad.tiene_tamanos || false,
        tipos: especialidad.tipos || [],
        tamanos: especialidad.tamanos || []
      };

      return this.http.put<any>(`${this.apiUrl}/${especialidad.id}`, especialidadCompleta).pipe(
        map(especialidadRespuesta => this.normalizarEspecialidad(especialidadRespuesta)),
        tap(actualizada => {
          console.log('✅ Especialidad actualizada en API:', actualizada);
          const especialidadesActuales = this.saucerSource.getValue();
          const nuevasEspecialidades = especialidadesActuales.map(e =>
            e.id === actualizada.id ? actualizada : e
          );
          this.saucerSource.next(nuevasEspecialidades);
          this.guardarCacheEspecialidades(nuevasEspecialidades);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarEspecialidadOffline(especialidad);
        })
      );
    } else {
      return this.actualizarEspecialidadOffline(especialidad);
    }
  }

  private actualizarEspecialidadOffline(especialidad: Fish): Observable<Fish> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('UPDATE', especialidad, true);

        const especialidadesActuales = this.saucerSource.getValue();
        const especialidadActualizada: Fish = {
          ...especialidad
        };
        
        const nuevasEspecialidades = especialidadesActuales.map(e =>
          e.id === especialidad.id ? especialidadActualizada : e
        );
        
        this.saucerSource.next(nuevasEspecialidades);
        this.guardarCacheEspecialidades(nuevasEspecialidades);

        console.log('📱 Especialidad actualizada offline:', especialidadActualizada);
        
        observer.next(especialidadActualizada);
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
      
      localStorage.setItem('especialidades_pendientes', JSON.stringify(pendientes));
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
      const pendientes = localStorage.getItem('especialidades_pendientes');
      return pendientes ? JSON.parse(pendientes) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ SINCRONIZACIÓN MEJORADA
  private sincronizarEspecialidadesOffline(): void {
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
      next: (especialidadesServidor) => {
        console.log('📊 Especialidades en servidor para verificación:', especialidadesServidor.length);
        this.procesarPendientesConVerificacionAvanzada(pendientes, especialidadesServidor);
      },
      error: (err) => {
        console.error('❌ Error cargando especialidades del servidor:', err);
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
    localStorage.setItem('especialidades_pendientes', JSON.stringify(actualizadas));
  }

  private procesarPendientesConVerificacionAvanzada(pendientes: any[], especialidadesServidor: any[]): void {
    let procesadas = 0;
    let exitosas = 0;
    let duplicados = 0;
    let errores = 0;

    pendientes.forEach(pendiente => {
      switch (pendiente.operation) {
        case 'CREATE':
          this.procesarCreateConVerificacionAvanzada(pendiente, especialidadesServidor, (resultado) => {
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

  private procesarCreateConVerificacionAvanzada(pendiente: any, especialidadesServidor: any[], callback: (resultado: string) => void): void {
    const especialidadPendiente = pendiente.data;
    
    const existeDuplicadoExacto = especialidadesServidor.some(especialidad => {
      const mismoNombre = especialidad.nombre.toLowerCase() === especialidadPendiente.nombre.toLowerCase();
      const mismoPrecio = especialidad.precio === especialidadPendiente.precio;
      const mismaDescripcion = especialidad.descripcion === especialidadPendiente.descripcion;
      const mismaImagen = especialidad.imagen === especialidadPendiente.imagen;
      
      return mismoNombre && mismoPrecio && mismaDescripcion && mismaImagen;
    });

    if (existeDuplicadoExacto) {
      console.log('⚠️ Especialidad EXACTA duplicada detectada y omitida:', especialidadPendiente.nombre);
      this.marcarPendienteComoProcesada(pendiente.id, 'duplicado');
      callback('duplicado');
      return;
    }

    const esEspecialidadOffline = especialidadPendiente.id && especialidadPendiente.id.toString().includes('offline_');
    if (esEspecialidadOffline) {
      const posibleDuplicado = especialidadesServidor.find(especialidad => 
        especialidad.nombre.toLowerCase() === especialidadPendiente.nombre.toLowerCase()
      );
      
      if (posibleDuplicado) {
        console.log('⚠️ Posible especialidad offline duplicada:', especialidadPendiente.nombre);
        this.actualizarEspecialidadExistente(posibleDuplicado.id, especialidadPendiente, pendiente.id, callback);
        return;
      }
    }

    const especialidadCompleta = {
      ...especialidadPendiente,
      descripcion_real: especialidadPendiente.descripcion_real || '',
      tiene_tamanos: especialidadPendiente.tiene_tamanos || false,
      tipos: especialidadPendiente.tipos || [],
      tamanos: especialidadPendiente.tamanos || []
    };

    this.http.post(this.apiUrl, especialidadCompleta).subscribe({
      next: (response) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ Especialidad sincronizada exitosamente:', especialidadPendiente.nombre);
        this.actualizarCacheConNuevaEspecialidad(response);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando CREATE:', especialidadPendiente.nombre, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private actualizarEspecialidadExistente(idExistente: any, especialidadNueva: any, pendienteId: string, callback: (resultado: string) => void): void {
    const especialidadCompleta = {
      ...especialidadNueva,
      descripcion_real: especialidadNueva.descripcion_real || '',
      tiene_tamanos: especialidadNueva.tiene_tamanos || false,
      tipos: especialidadNueva.tipos || [],
      tamanos: especialidadNueva.tamanos || []
    };

    this.http.put(`${this.apiUrl}/${idExistente}`, especialidadCompleta).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendienteId, 'exitoso');
        console.log('✅ Especialidad existente actualizada:', especialidadNueva.nombre);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error actualizando especialidad existente:', especialidadNueva.nombre, err);
        this.marcarPendienteComoFallida(pendienteId);
        callback('error');
      }
    });
  }

  private actualizarCacheConNuevaEspecialidad(nuevaEspecialidad: any): void {
    try {
      const cacheKey = 'especialidades_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        const especialidadesCache = cacheData.data || [];
        
        const especialidadesActualizadas = especialidadesCache.map((e: any) => 
          e.id && e.id.toString().includes('offline_') && e.nombre === nuevaEspecialidad.nombre 
            ? this.normalizarEspecialidad(nuevaEspecialidad) 
            : e
        );
        
        if (!especialidadesActualizadas.some((e: any) => e.id === nuevaEspecialidad.id)) {
          especialidadesActualizadas.push(this.normalizarEspecialidad(nuevaEspecialidad));
        }
        
        this.guardarCacheEspecialidades(especialidadesActualizadas);
      }
    } catch (error) {
      console.error('❌ Error actualizando cache:', error);
    }
  }

  private procesarUpdateAvanzado(pendiente: any, callback: (resultado: string) => void): void {
    const especialidadCompleta = {
      ...pendiente.data,
      descripcion_real: pendiente.data.descripcion_real || '',
      tiene_tamanos: pendiente.data.tiene_tamanos || false,
      tipos: pendiente.data.tipos || [],
      tamanos: pendiente.data.tamanos || []
    };

    this.http.put(`${this.apiUrl}/${pendiente.data.id}`, especialidadCompleta).subscribe({
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
    localStorage.setItem('especialidades_pendientes', JSON.stringify(actualizadas));
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
    localStorage.setItem('especialidades_pendientes', JSON.stringify(actualizadas));
  }

  private finalizarSincronizacion(procesadas: number, total: number, exitosas: number, duplicados: number, errores: number): void {
    if (procesadas === total) {
      this.isSyncing = false;
      
      console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${duplicados} duplicados omitidos, ${errores} errores`);
      
      setTimeout(() => this.limpiarPendientesProcesadas(), 30000);
      
      setTimeout(() => {
        this.cargarEspecialidades().subscribe();
        console.log('🔄 Lista de especialidades actualizada después de sincronización');
      }, 1000);

      this.syncAttempts = 0;
    }
  }

  private reintentarSincronizacion(): void {
    this.isSyncing = false;
    
    if (this.syncAttempts < this.maxSyncAttempts) {
      console.log(`🔄 Reintentando sincronización en 5 segundos... (${this.syncAttempts + 1}/${this.maxSyncAttempts})`);
      setTimeout(() => this.sincronizarEspecialidadesOffline(), 5000);
    } else {
      console.error('❌ Máximo de intentos de sincronización alcanzado');
      this.syncAttempts = 0;
    }
  }

  private limpiarPendientesProcesadas(): void {
    const pendientes = this.obtenerPendientes();
    const pendientesActivas = pendientes.filter(p => p.status !== 'processed');
    localStorage.setItem('especialidades_pendientes', JSON.stringify(pendientesActivas));
    console.log('🧹 Pendientes procesadas limpiadas');
  }

  // ✅ MÉTODO PARA LIMPIAR MANUALMENTE (DEBUG)
  limpiarPendientesManual(): void {
    localStorage.removeItem('especialidades_pendientes');
    console.log('🧹 Pendientes limpiadas manualmente');
  }
}