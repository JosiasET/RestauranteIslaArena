import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CelebrateInterface } from '../interface/celebrate';
import { Observable, catchError, throwError, map, BehaviorSubject, tap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CelebrateService {
  private apiUrl = 'http://localhost:3000/celebrate';
  private CAPACIDAD_MAXIMA = 30;
  
  private celebracionesSource = new BehaviorSubject<CelebrateInterface[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);
  
  celebraciones$ = this.celebracionesSource.asObservable();
  loading$ = this.loadingSource.asObservable();
  
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;

  constructor(private http: HttpClient) {
    this.cargarCelebraciones().subscribe();
    this.setupOnlineListener();
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet recuperado - Preparando sincronización de celebraciones...');
      setTimeout(() => {
        this.sincronizarCelebracionesOffline();
      }, 3000);
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en CelebrateService:', error);
    
    if (error.error instanceof ErrorEvent) {
      return throwError(() => new Error(`Error: ${error.error.message}`));
    } else {
      if (error.status === 400) {
        return throwError(() => new Error(error.error.error || 'Error de validación'));
      }
      return throwError(() => new Error(`Error ${error.status}: ${error.message}`));
    }
  }

  // ✅ VERIFICAR DISPONIBILIDAD MEJORADA - INCLUYE OFFLINE
  verificarDisponibilidad(fecha: string, hora: string, personasSolicitadas: number): Observable<{ 
    disponible: boolean; 
    mensaje: string; 
    capacidadRestante: number;
    totalReservado: number;
  }> {
    // ✅ SIEMPRE calcular incluyendo reservas offline locales
    const celebracionesLocales = this.celebracionesSource.getValue();
    const celebracionesEnFechaHora = celebracionesLocales.filter(c => 
      c.fecha_preferida === fecha && c.hora_preferida === hora
    );
    
    const totalReservadoLocal = celebracionesEnFechaHora.reduce((sum, c) => sum + (c.cant_people || 1), 0);
    const capacidadRestanteLocal = this.CAPACIDAD_MAXIMA - totalReservadoLocal;
    const disponibleLocal = capacidadRestanteLocal >= personasSolicitadas;

    if (navigator.onLine) {
      return this.http.post<any>(`${this.apiUrl}/verificar-disponibilidad`, {
        fecha_preferida: fecha,
        hora_preferida: hora,
        cant_people: personasSolicitadas
      }).pipe(
        map((resultado: any) => {
          // ✅ COMBINAR resultado del backend con reservas locales offline
          const totalReservadoCombinado = Math.max(resultado.total_reservado || 0, totalReservadoLocal);
          const capacidadRestanteCombinada = this.CAPACIDAD_MAXIMA - totalReservadoCombinado;
          const disponibleCombinado = capacidadRestanteCombinada >= personasSolicitadas;

          let mensaje = resultado.mensaje;
          if (!disponibleCombinado && disponibleLocal) {
            mensaje = '⚠️ Capacidad comprometida por reservas pendientes de sincronizar';
          }

          return {
            disponible: disponibleCombinado,
            mensaje: mensaje,
            capacidadRestante: capacidadRestanteCombinada,
            totalReservado: totalReservadoCombinado
          };
        }),
        catchError(err => {
          console.error('❌ Error API, usando verificación offline:', err);
          return this.verificarDisponibilidadOffline(fecha, hora, personasSolicitadas);
        })
      );
    } else {
      return this.verificarDisponibilidadOffline(fecha, hora, personasSolicitadas);
    }
  }

  private verificarDisponibilidadOffline(fecha: string, hora: string, personasSolicitadas: number): Observable<{ 
    disponible: boolean; 
    mensaje: string; 
    capacidadRestante: number;
    totalReservado: number;
  }> {
    return new Observable(observer => {
      try {
        const celebraciones = this.celebracionesSource.getValue();
        const celebracionesEnFechaHora = celebraciones.filter(c => 
          c.fecha_preferida === fecha && c.hora_preferida === hora
        );
        
        const totalReservado = celebracionesEnFechaHora.reduce((sum, c) => sum + (c.cant_people || 1), 0);
        const capacidadRestante = this.CAPACIDAD_MAXIMA - totalReservado;
        const disponible = capacidadRestante >= personasSolicitadas;
        
        const mensaje = disponible 
          ? `✅ Disponible - ${capacidadRestante} personas restantes`
          : `❌ Capacidad llena - Solo quedan ${capacidadRestante} lugares`;

        observer.next({
          disponible,
          mensaje,
          capacidadRestante,
          totalReservado
        });
        observer.complete();
      } catch (error) {
        console.error('❌ Error en verificación offline:', error);
        observer.next({
          disponible: true,
          mensaje: '📱 Verificación offline - Capacidad disponible',
          capacidadRestante: this.CAPACIDAD_MAXIMA,
          totalReservado: 0
        });
        observer.complete();
      }
    });
  }

  // ✅ CARGAR CELEBRACIONES (ONLINE/OFFLINE)
  cargarCelebraciones(): Observable<CelebrateInterface[]> {
    this.loadingSource.next(true);
    
    if (navigator.onLine) {
      return this.http.get<CelebrateInterface[]>(this.apiUrl).pipe(
        tap(celebraciones => {
          console.log('✅ Celebraciones cargadas desde API:', celebraciones.length);
          
          // ✅ CARGAR RESERVAS OFFLINE PENDIENTES Y COMBINAR
          const celebracionesOffline = this.obtenerCelebracionesOffline();
          const todasCelebraciones = [...celebraciones, ...celebracionesOffline];
          
          const celebracionesConSync: CelebrateInterface[] = todasCelebraciones.map(c => ({
            ...c,
            syncStatus: c.offline ? 'pending' as const : 'synced' as const
          }));
          
          this.celebracionesSource.next(celebracionesConSync);
          this.loadingSource.next(false);
          this.guardarCacheCelebraciones(celebracionesConSync);
        }),
        catchError(err => {
          console.error('❌ Error API, cargando desde cache:', err);
          return this.cargarCelebracionesOffline();
        })
      );
    } else {
      return this.cargarCelebracionesOffline();
    }
  }

  private cargarCelebracionesOffline(): Observable<CelebrateInterface[]> {
    return new Observable(observer => {
      try {
        const cacheKey = 'celebraciones_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const celebracionesCache = JSON.parse(cached);
          const celebraciones: CelebrateInterface[] = celebracionesCache.data.map((c: any) => this.normalizarCelebracion(c));
          
          console.log('📱 Celebraciones cargadas desde cache:', celebraciones.length);
          this.celebracionesSource.next(celebraciones);
          this.loadingSource.next(false);
          observer.next(celebraciones);
        } else {
          console.log('📱 No hay celebraciones en cache');
          this.celebracionesSource.next([]);
          this.loadingSource.next(false);
          observer.next([]);
        }
        observer.complete();
      } catch (error) {
        console.error('❌ Error cargando cache:', error);
        this.celebracionesSource.next([]);
        this.loadingSource.next(false);
        observer.next([]);
        observer.complete();
      }
    });
  }

  private obtenerCelebracionesOffline(): CelebrateInterface[] {
    try {
      const cacheKey = 'celebraciones_cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const celebracionesCache = JSON.parse(cached);
        return celebracionesCache.data
          .filter((c: any) => c.offline)
          .map((c: any) => this.normalizarCelebracion(c));
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  private normalizarCelebracion(celebracion: any): CelebrateInterface {
    return {
      id_celebracion: celebracion.id_celebracion || celebracion.id,
      nombre_completo: celebracion.nombre_completo,
      fecha_nacimiento: celebracion.fecha_nacimiento,
      telefono: celebracion.telefono,
      fecha_preferida: celebracion.fecha_preferida,
      hora_preferida: celebracion.hora_preferida,
      acepta_verificacion: celebracion.acepta_verificacion || false,
      reservation: celebracion.reservation,
      cant_people: celebracion.cant_people || 1,
      ine_verificacion: celebracion.ine_verificacion || false,
      estado_verificacion: celebracion.estado_verificacion || false,
      fecha_creacion: celebracion.fecha_creacion || celebracion.created_at,
      created_at: celebracion.created_at,
      offline: celebracion.offline || false,
      pendingSync: celebracion.pendingSync || false,
      tempId: celebracion.tempId,
      syncStatus: celebracion.syncStatus || 'synced'
    };
  }

  private guardarCacheCelebraciones(celebraciones: CelebrateInterface[]): void {
    try {
      const cacheKey = 'celebraciones_cache';
      const cacheData = {
        data: celebraciones,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  // ✅ CREAR CELEBRACIÓN CON VALIDACIÓN MEJORADA
  crearCelebracionConValidacion(data: CelebrateInterface): Observable<{ 
    success: boolean; 
    message: string; 
    data?: any;
    capacidad_restante?: number;
  }> {
    // ✅ PRIMERO verificar disponibilidad local incluyendo offline
    const celebracionesLocales = this.celebracionesSource.getValue();
    const celebracionesEnFechaHora = celebracionesLocales.filter(c => 
      c.fecha_preferida === data.fecha_preferida && c.hora_preferida === data.hora_preferida
    );
    
    const totalReservadoLocal = celebracionesEnFechaHora.reduce((sum, c) => sum + (c.cant_people || 1), 0);
    const capacidadRestanteCalculada = this.CAPACIDAD_MAXIMA - totalReservadoLocal;
    const disponibleLocal = capacidadRestanteCalculada >= (data.cant_people || 1);

    if (!disponibleLocal) {
      return new Observable(observer => {
        observer.next({
          success: false,
          message: '❌ Capacidad llena considerando reservas pendientes'
        });
        observer.complete();
      });
    }

    if (navigator.onLine) {
      console.log('📤 Enviando datos al backend:', data);
      
      return this.http.post<any>(this.apiUrl, data).pipe(
        map((response: any) => {
          console.log('✅ Respuesta del backend:', response);
          
          const nuevaCelebracion: CelebrateInterface = {
            ...this.normalizarCelebracion(response.data),
            syncStatus: 'synced' as const
          };
          
          const celebracionesActuales = this.celebracionesSource.getValue();
          this.celebracionesSource.next([nuevaCelebracion, ...celebracionesActuales]);
          this.guardarCacheCelebraciones([nuevaCelebracion, ...celebracionesActuales]);
          
          return {
            success: true,
            message: response.message,
            data: response.data,
            capacidad_restante: response.data?.capacidad_restante
          };
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Error del backend, guardando offline:', error);
          
          // Si es error de capacidad, no guardar offline
          if (error.status === 400 && error.error?.error?.includes('Capacidad llena')) {
            return throwError(() => new Error('Capacidad llena para este horario'));
          }
          
          return this.crearCelebracionOffline(data, capacidadRestanteCalculada);
        })
      );
    } else {
      return this.crearCelebracionOffline(data, capacidadRestanteCalculada);
    }
  }

  private crearCelebracionOffline(data: CelebrateInterface, capacidadRestanteLocal: number): Observable<{ 
    success: boolean; 
    message: string; 
    data?: any;
    capacidad_restante?: number;
  }> {
    return new Observable(observer => {
      try {
        const tempId = 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const reservationCode = 'CEL' + Array.from({ length: 6 }, () => 
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
        ).join('');
        
        const celebracionOffline: CelebrateInterface = {
          ...data,
          id_celebracion: tempId,
          reservation: reservationCode,
          offline: true,
          syncStatus: 'pending' as const
        };

        const celebracionesActuales = this.celebracionesSource.getValue();
        this.celebracionesSource.next([celebracionOffline, ...celebracionesActuales]);
        this.guardarCacheCelebraciones([celebracionOffline, ...celebracionesActuales]);

        this.agregarPendiente('CREATE', celebracionOffline, true);

        console.log('📱 Celebración guardada offline - Código:', reservationCode);
        
        observer.next({
          success: true,
          message: `✅ Reserva guardada localmente - Código: ${reservationCode}\nSe sincronizará automáticamente cuando recuperes internet`,
          data: celebracionOffline,
          capacidad_restante: capacidadRestanteLocal
        });
        observer.complete();
      } catch (error) {
        console.error('❌ Error guardando offline:', error);
        observer.error(new Error('Error al guardar la reserva localmente'));
      }
    });
  }

  // ✅ MÉTODO ORIGINAL (mantener para compatibilidad)
  crearCelebracion(data: CelebrateInterface): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  obtenerCelebraciones(): Observable<CelebrateInterface[]> {
    return this.celebraciones$;
  }

  // ✅ ACTUALIZAR VERIFICACIÓN
  actualizarVerificacion(id: number, data: { ine_verificacion: boolean, estado_verificacion: boolean }): Observable<any> {
    if (navigator.onLine) {
      return this.http.put(`${this.apiUrl}/${id}/verificacion`, data).pipe(
        tap(() => {
          const celebraciones = this.celebracionesSource.getValue();
          const actualizadas = celebraciones.map(c => 
            c.id_celebracion === id ? { ...c, ...data } : c
          );
          this.celebracionesSource.next(actualizadas);
          this.guardarCacheCelebraciones(actualizadas);
        }),
        catchError((err: any) => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarVerificacionOffline(id, data);
        })
      );
    } else {
      return this.actualizarVerificacionOffline(id, data);
    }
  }

  private actualizarVerificacionOffline(id: number, data: { ine_verificacion: boolean, estado_verificacion: boolean }): Observable<any> {
    return new Observable(observer => {
      try {
        const celebraciones = this.celebracionesSource.getValue();
        const celebracion = celebraciones.find(c => c.id_celebracion === id);
        
        if (celebracion) {
          const celebracionActualizada: CelebrateInterface = { 
            ...celebracion, 
            ...data,
            syncStatus: 'pending' as const
          };
          
          const actualizadas = celebraciones.map(c => 
            c.id_celebracion === id ? celebracionActualizada : c
          );
          
          this.celebracionesSource.next(actualizadas);
          this.guardarCacheCelebraciones(actualizadas);
          
          this.agregarPendiente('UPDATE', celebracionActualizada, true);
          
          console.log('📱 Verificación actualizada offline - ID:', id);
        }
        
        observer.next({ success: true });
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ ELIMINAR CELEBRACIÓN
  eliminarCelebracion(id: number): Observable<any> {
    if (navigator.onLine) {
      return this.http.delete(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          const celebraciones = this.celebracionesSource.getValue();
          const filtradas = celebraciones.filter(c => c.id_celebracion !== id);
          this.celebracionesSource.next(filtradas);
          this.guardarCacheCelebraciones(filtradas);
        }),
        catchError((err: any) => {
          console.error('❌ Error API, marcando para eliminar offline:', err);
          return this.eliminarCelebracionOffline(id);
        })
      );
    } else {
      return this.eliminarCelebracionOffline(id);
    }
  }

  private eliminarCelebracionOffline(id: number): Observable<any> {
    return new Observable(observer => {
      try {
        this.agregarPendiente('DELETE', { id_celebracion: id }, true);

        const celebraciones = this.celebracionesSource.getValue();
        const filtradas = celebraciones.filter(c => c.id_celebracion !== id);
        this.celebracionesSource.next(filtradas);
        this.guardarCacheCelebraciones(filtradas);

        console.log('📱 Celebración marcada para eliminar offline - ID:', id);
        
        observer.next({ success: true });
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ SINCRONIZACIÓN MEJORADA
  private sincronizarCelebracionesOffline(): void {
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
    this.procesarPendientes(pendientes);
  }

  private procesarPendientes(pendientes: any[]): void {
    let procesadas = 0;
    let exitosas = 0;
    let errores = 0;

    pendientes.forEach(pendiente => {
      switch (pendiente.operation) {
        case 'CREATE':
          this.procesarCreate(pendiente, (resultado: string) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacion(procesadas, pendientes.length, exitosas, errores);
          });
          break;

        case 'UPDATE':
          this.procesarUpdate(pendiente, (resultado: string) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacion(procesadas, pendientes.length, exitosas, errores);
          });
          break;

        case 'DELETE':
          this.procesarDelete(pendiente, (resultado: string) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacion(procesadas, pendientes.length, exitosas, errores);
          });
          break;
      }
    });
  }

  private procesarCreate(pendiente: any, callback: (resultado: string) => void): void {
    const celebracionPendiente = pendiente.data;
    
    // ✅ PREPARAR DATOS - quitar propiedades offline
    const datosParaBackend = { ...celebracionPendiente };
    delete datosParaBackend.offline;
    delete datosParaBackend.syncStatus;
    delete datosParaBackend.tempId;
    delete datosParaBackend.id_celebracion;

    console.log('🔄 Sincronizando CREATE:', datosParaBackend.reservation);
    
    this.http.post(this.apiUrl, datosParaBackend).subscribe({
      next: (response: any) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        
        const celebraciones = this.celebracionesSource.getValue();
        const actualizadas = celebraciones.map(c => 
          c.id_celebracion === celebracionPendiente.id_celebracion 
            ? { 
                ...this.normalizarCelebracion(response.data), 
                offline: false, 
                syncStatus: 'synced' as const
              }
            : c
        );
        this.celebracionesSource.next(actualizadas);
        this.guardarCacheCelebraciones(actualizadas);
        
        console.log('✅ Celebración sincronizada exitosamente:', response.data.reservation);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando CREATE:', celebracionPendiente.reservation, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private procesarUpdate(pendiente: any, callback: (resultado: string) => void): void {
    this.http.put(`${this.apiUrl}/${pendiente.data.id_celebracion}/verificacion`, {
      ine_verificacion: pendiente.data.ine_verificacion,
      estado_verificacion: pendiente.data.estado_verificacion
    }).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        
        // Actualizar estado local
        const celebraciones = this.celebracionesSource.getValue();
        const actualizadas = celebraciones.map(c => 
          c.id_celebracion === pendiente.data.id_celebracion 
            ? { ...c, syncStatus: 'synced' as const }
            : c
        );
        this.celebracionesSource.next(actualizadas);
        this.guardarCacheCelebraciones(actualizadas);
        
        console.log('✅ UPDATE sincronizado:', pendiente.data.reservation);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando UPDATE:', pendiente.data.reservation, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private procesarDelete(pendiente: any, callback: (resultado: string) => void): void {
    this.http.delete(`${this.apiUrl}/${pendiente.data.id_celebracion}`).subscribe({
      next: () => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ DELETE sincronizado:', pendiente.data.id_celebracion);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando DELETE:', pendiente.data.id_celebracion, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  // ✅ MÉTODOS AUXILIARES
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
      
      localStorage.setItem('celebraciones_pendientes', JSON.stringify(pendientes));
      console.log('📝 Operación pendiente agregada:', operation);
    } catch (error) {
      console.error('❌ Error guardando operación pendiente:', error);
    }
  }

  private obtenerPendientes(): any[] {
    try {
      const pendientes = localStorage.getItem('celebraciones_pendientes');
      return pendientes ? JSON.parse(pendientes) : [];
    } catch (error) {
      return [];
    }
  }

  private marcarPendientesComoProcessing(pendientes: any[]): void {
    const todasPendientes = this.obtenerPendientes();
    const actualizadas = todasPendientes.map(p => {
      if (pendientes.some(pend => pend.id === p.id)) {
        return { ...p, status: 'processing' };
      }
      return p;
    });
    localStorage.setItem('celebraciones_pendientes', JSON.stringify(actualizadas));
  }

  private marcarPendienteComoProcesada(id: string, resultado: string): void {
    const pendientes = this.obtenerPendientes();
    const actualizadas = pendientes.map(p => 
      p.id === id ? { ...p, status: 'processed', resultado } : p
    );
    localStorage.setItem('celebraciones_pendientes', JSON.stringify(actualizadas));
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
    localStorage.setItem('celebraciones_pendientes', JSON.stringify(actualizadas));
  }

  private finalizarSincronizacion(procesadas: number, total: number, exitosas: number, errores: number): void {
    if (procesadas === total) {
      this.isSyncing = false;
      
      console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${errores} errores`);
      
      setTimeout(() => this.limpiarPendientesProcesadas(), 30000);
      
      setTimeout(() => {
        this.cargarCelebraciones().subscribe();
        console.log('🔄 Lista de celebraciones actualizada después de sincronización');
      }, 1000);

      this.syncAttempts = 0;
    }
  }

  private limpiarPendientesProcesadas(): void {
    const pendientes = this.obtenerPendientes();
    const pendientesActivas = pendientes.filter(p => p.status !== 'processed');
    localStorage.setItem('celebraciones_pendientes', JSON.stringify(pendientesActivas));
    console.log('🧹 Pendientes procesadas limpiadas');
  }

  private sonDatosSimilares(dato1: any, dato2: any): boolean {
    if (dato1.id_celebracion && dato2.id_celebracion) {
      return dato1.id_celebracion === dato2.id_celebracion;
    }
    if (dato1.reservation && dato2.reservation) {
      return dato1.reservation === dato2.reservation;
    }
    return false;
  }

  // ✅ MÉTODO PARA SINCRONIZACIÓN MANUAL
  sincronizarManual(): Observable<{exitosas: number, errores: number}> {
    return new Observable(observer => {
      if (!navigator.onLine) {
        observer.error(new Error('No hay conexión a internet'));
        return;
      }

      const pendientes = this.obtenerPendientes().filter(p => p.status === 'pending');
      if (pendientes.length === 0) {
        observer.next({exitosas: 0, errores: 0});
        observer.complete();
        return;
      }

      let procesadas = 0;
      let exitosas = 0;
      let errores = 0;

      pendientes.forEach(pendiente => {
        switch (pendiente.operation) {
          case 'CREATE':
            this.procesarCreate(pendiente, (resultado: string) => {
              procesadas++;
              if (resultado === 'exitoso') exitosas++;
              if (resultado === 'error') errores++;
              
              if (procesadas === pendientes.length) {
                observer.next({exitosas, errores});
                observer.complete();
              }
            });
            break;
          case 'UPDATE':
            this.procesarUpdate(pendiente, (resultado: string) => {
              procesadas++;
              if (resultado === 'exitoso') exitosas++;
              if (resultado === 'error') errores++;
              
              if (procesadas === pendientes.length) {
                observer.next({exitosas, errores});
                observer.complete();
              }
            });
            break;
          case 'DELETE':
            this.procesarDelete(pendiente, (resultado: string) => {
              procesadas++;
              if (resultado === 'exitoso') exitosas++;
              if (resultado === 'error') errores++;
              
              if (procesadas === pendientes.length) {
                observer.next({exitosas, errores});
                observer.complete();
              }
            });
            break;
        }
      });
    });
  }

  // ✅ MÉTODO DE DIAGNÓSTICO
  diagnosticarSincronizacion(): {
    online: boolean;
    pendientes: number;
    sincronizando: boolean;
    celebracionesLocales: number;
    celebracionesOffline: number;
  } {
    const pendientes = this.obtenerPendientes().filter(p => p.status === 'pending');
    const celebraciones = this.celebracionesSource.getValue();
    const celebracionesOffline = celebraciones.filter(c => c.offline);
    
    return {
      online: navigator.onLine,
      pendientes: pendientes.length,
      sincronizando: this.isSyncing,
      celebracionesLocales: celebraciones.length,
      celebracionesOffline: celebracionesOffline.length
    };
  }

  // ✅ MÉTODO PARA LIMPIAR MANUALMENTE (DEBUG)
  limpiarPendientesManual(): void {
    localStorage.removeItem('celebraciones_pendientes');
    console.log('🧹 Pendientes limpiadas manualmente');
  }
}