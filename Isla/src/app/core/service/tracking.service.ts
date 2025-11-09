import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, throwError } from 'rxjs';

// En tracking.service.ts - ACTUALIZAR la interfaz
export interface OrderTracking {
  id?: number;           // Este es el order_id del backend
  order_id?: number;     // ✅ AGREGAR esta propiedad por si acaso
  tracking_code: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  order_items: any[];
  total_amount?: number;
  status: string;
  order_date: string;
  status_updated_at: string;
  payment_verified: boolean;
  payment_method?: string;
  payment_reference?: string;
  delivery_address?: {
    address: string;
    neighborhood: string;
    postal_code: string;
    city: string;
    state: string;
    references?: string;
    cashAmount?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiUrl = 'http://localhost:3000/tracking';
  
  // ✅ CACHE Y ESTADOS
  private ordersSource = new BehaviorSubject<OrderTracking[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);
  
  orders$ = this.ordersSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  // ✅ CONTROL DE SINCRONIZACIÓN
  private isSyncing = false;
  private syncAttempts = 0;
  private maxSyncAttempts = 3;

  constructor(private http: HttpClient) {
    this.setupOnlineListener();
  }

  // ✅ ESCUCHAR CUANDO VUELVE INTERNET
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Internet recuperado - Sincronizando pedidos...');
      setTimeout(() => {
        this.sincronizarPedidosOffline();
      }, 3000);
    });
  }

  // ✅ CARGAR PEDIDOS (ONLINE/OFFLINE)
  getAllOrders(): Observable<OrderTracking[]> {
    this.loadingSource.next(true);
    
    if (navigator.onLine) {
      return this.http.get<OrderTracking[]>(this.apiUrl).pipe(
        tap(orders => {
          console.log('✅ Pedidos cargados desde API:', orders.length);
          this.ordersSource.next(orders);
          this.loadingSource.next(false);
          this.guardarCachePedidos(orders);
        }),
        catchError(err => {
          console.error('❌ Error API, cargando desde cache:', err);
          return this.cargarPedidosOffline();
        })
      );
    } else {
      return this.cargarPedidosOffline();
    }
  }

  private cargarPedidosOffline(): Observable<OrderTracking[]> {
    return new Observable(observer => {
      try {
        const cacheKey = 'pedidos_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const pedidosCache = JSON.parse(cached);
          console.log('📱 Pedidos cargados desde cache:', pedidosCache.data.length);
          this.ordersSource.next(pedidosCache.data);
          this.loadingSource.next(false);
          observer.next(pedidosCache.data);
        } else {
          console.log('📱 No hay pedidos en cache');
          this.ordersSource.next([]);
          this.loadingSource.next(false);
          observer.next([]);
        }
        observer.complete();
      } catch (error) {
        console.error('❌ Error cargando cache:', error);
        this.ordersSource.next([]);
        this.loadingSource.next(false);
        observer.next([]);
        observer.complete();
      }
    });
  }

  private guardarCachePedidos(pedidos: OrderTracking[]): void {
    try {
      const cacheKey = 'pedidos_cache';
      const cacheData = {
        data: pedidos,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('❌ Error guardando cache:', error);
    }
  }

  // ✅ BUSCAR PEDIDO POR CÓDIGO (ONLINE/OFFLINE)
  getOrderByCode(code: string): Observable<OrderTracking> {
    if (navigator.onLine) {
      return this.http.get<OrderTracking>(`${this.apiUrl}/${code}`).pipe(
        tap(order => {
          console.log('✅ Pedido encontrado en API:', order.tracking_code);
          // Actualizar cache local con este pedido
          this.actualizarCacheConPedido(order);
        }),
        catchError(err => {
          console.error('❌ Error API, buscando en cache:', err);
          return this.buscarPedidoOffline(code);
        })
      );
    } else {
      return this.buscarPedidoOffline(code);
    }
  }

  private buscarPedidoOffline(code: string): Observable<OrderTracking> {
    return new Observable(observer => {
      try {
        const cacheKey = 'pedidos_cache';
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const pedidosCache = JSON.parse(cached);
          const pedido = pedidosCache.data.find((p: OrderTracking) => 
            p.tracking_code.toLowerCase() === code.toLowerCase() ||
            p.customer_name.toLowerCase().includes(code.toLowerCase()) ||
            (p.customer_phone && p.customer_phone.includes(code))
          );
          
          if (pedido) {
            console.log('📱 Pedido encontrado en cache:', pedido.tracking_code);
            observer.next(pedido);
          } else {
            observer.error('Pedido no encontrado en cache');
          }
        } else {
          observer.error('No hay pedidos en cache');
        }
        observer.complete();
      } catch (error) {
        observer.error('Error buscando en cache');
      }
    });
  }

  private actualizarCacheConPedido(pedido: OrderTracking): void {
    try {
      const cacheKey = 'pedidos_cache';
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const pedidosCache = JSON.parse(cached);
        const pedidosActualizados = pedidosCache.data.map((p: OrderTracking) => 
          p.tracking_code === pedido.tracking_code ? pedido : p
        );
        
        // Si no existe, agregarlo
        if (!pedidosActualizados.some((p: OrderTracking) => p.tracking_code === pedido.tracking_code)) {
          pedidosActualizados.push(pedido);
        }
        
        this.guardarCachePedidos(pedidosActualizados);
      }
    } catch (error) {
      console.error('❌ Error actualizando cache con pedido:', error);
    }
  }

  // ✅ CREAR PEDIDO (ONLINE/OFFLINE) - PARA CHECKOUT
  createOrder(orderData: any): Observable<OrderTracking> {
    if (navigator.onLine) {
      return this.http.post<OrderTracking>(this.apiUrl, orderData).pipe(
        tap(newOrder => {
          console.log('✅ Pedido creado en API:', newOrder.tracking_code);
          // Actualizar cache local
          const currentOrders = this.ordersSource.getValue();
          this.ordersSource.next([newOrder, ...currentOrders]);
          this.guardarCachePedidos([newOrder, ...currentOrders]);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.crearPedidoOffline(orderData);
        })
      );
    } else {
      return this.crearPedidoOffline(orderData);
    }
  }

  private crearPedidoOffline(orderData: any): Observable<OrderTracking> {
    return new Observable(observer => {
      try {
        // Generar código temporal
        const tempTrackingCode = 'OFFLINE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        const pedidoOffline: OrderTracking = {
          ...orderData,
          tracking_code: tempTrackingCode,
          id: 'offline_' + Date.now(),
          status: 'pedido_recibido',
          payment_verified: false,
          order_date: new Date().toISOString(),
          status_updated_at: new Date().toISOString()
        };

        // Guardar en pendientes
        this.agregarPendiente('CREATE', pedidoOffline, true);

        // Actualizar cache local
        const currentOrders = this.ordersSource.getValue();
        this.ordersSource.next([pedidoOffline, ...currentOrders]);
        this.guardarCachePedidos([pedidoOffline, ...currentOrders]);

        console.log('📱 Pedido guardado offline - Código temporal:', tempTrackingCode);
        
        observer.next(pedidoOffline);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ ACTUALIZAR ESTADO (ONLINE/OFFLINE)
  updateOrderStatus(id: number, status: string, payment_verified: boolean): Observable<OrderTracking> {
    const updateData = { status, payment_verified };

    if (navigator.onLine) {
      return this.http.put<OrderTracking>(`${this.apiUrl}/${id}/status`, updateData).pipe(
        tap(updatedOrder => {
          console.log('✅ Estado actualizado en API:', updatedOrder.tracking_code);
          this.actualizarCacheConPedido(updatedOrder);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarEstadoOffline(id, updateData);
        })
      );
    } else {
      return this.actualizarEstadoOffline(id, updateData);
    }
  }

  private actualizarEstadoOffline(id: number, updateData: any): Observable<OrderTracking> {
    return new Observable(observer => {
      try {
        // Guardar en pendientes
        this.agregarPendiente('UPDATE_STATUS', { id, ...updateData }, true);

        // Actualizar cache local inmediatamente
        const currentOrders = this.ordersSource.getValue();
        const pedidoActualizado = currentOrders.find(p => p.id === id);
        
        if (pedidoActualizado) {
          const pedidoModificado = {
            ...pedidoActualizado,
            status: updateData.status,
            payment_verified: updateData.payment_verified,
            status_updated_at: new Date().toISOString()
          };

          const nuevasOrdenes = currentOrders.map(p => 
            p.id === id ? pedidoModificado : p
          );

          this.ordersSource.next(nuevasOrdenes);
          this.guardarCachePedidos(nuevasOrdenes);

          console.log('📱 Estado actualizado offline:', pedidoModificado.tracking_code);
          observer.next(pedidoModificado);
        } else {
          observer.error('Pedido no encontrado en cache');
        }
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // ✅ SISTEMA DE PENDIENTES (igual que DrinkService)
  private agregarPendiente(operation: string, data: any, isNew: boolean = false): void {
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
      
      localStorage.setItem('pedidos_pendientes', JSON.stringify(pendientes));
      console.log('📝 Operación pendiente agregada:', operation);
    } catch (error) {
      console.error('❌ Error guardando operación pendiente:', error);
    }
  }

  private sonDatosSimilares(dato1: any, dato2: any): boolean {
    if (dato1.tracking_code && dato2.tracking_code) {
      return dato1.tracking_code === dato2.tracking_code;
    }
    if (dato1.id && dato2.id) {
      return dato1.id === dato2.id;
    }
    return false;
  }

  private obtenerPendientes(): any[] {
    try {
      const pendientes = localStorage.getItem('pedidos_pendientes');
      return pendientes ? JSON.parse(pendientes) : [];
    } catch (error) {
      return [];
    }
  }

  // ✅ SINCRONIZACIÓN AUTOMÁTICA
  private sincronizarPedidosOffline(): void {
    if (this.isSyncing) return;

    const pendientes = this.obtenerPendientes().filter(p => p.status === 'pending');
    if (pendientes.length === 0) return;

    this.isSyncing = true;
    this.syncAttempts++;
    console.log(`🔄 Sincronizando ${pendientes.length} pedidos pendientes...`);

    this.marcarPendientesComoProcessing(pendientes);

    // Procesar pendientes
    this.procesarPendientesPedidos(pendientes);
  }

  private procesarPendientesPedidos(pendientes: any[]): void {
    let procesadas = 0;
    let exitosas = 0;
    let errores = 0;

    pendientes.forEach(pendiente => {
      switch (pendiente.operation) {
        case 'CREATE':
          this.procesarCreatePedido(pendiente, (resultado: string) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacionPedidos(procesadas, pendientes.length, exitosas, errores);
          });
          break;

        case 'UPDATE_STATUS':
          this.procesarUpdateStatusPedido(pendiente, (resultado: string) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacionPedidos(procesadas, pendientes.length, exitosas, errores);
          });
          break;

        case 'UPDATE_PAYMENT':
          this.procesarUpdatePaymentPedido(pendiente, (resultado: string) => {
            procesadas++;
            if (resultado === 'exitoso') exitosas++;
            if (resultado === 'error') errores++;
            this.finalizarSincronizacionPedidos(procesadas, pendientes.length, exitosas, errores);
          });
          break;
      }
    });
  }

  // ✅ MÉTODO FALTANTE: PROCESAR CREACIÓN DE PEDIDO
  private procesarCreatePedido(pendiente: any, callback: (resultado: string) => void): void {
    this.http.post<OrderTracking>(this.apiUrl, pendiente.data).subscribe({
      next: (pedidoReal: OrderTracking) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ Pedido sincronizado con API:', pedidoReal.tracking_code);
        
        // Actualizar cache local reemplazando el temporal con el real
        this.actualizarCacheConPedidoReal(pedidoReal, pendiente.data.tracking_code);
        
        callback('exitoso');
      },
      error: (err: HttpErrorResponse) => {
        console.error('❌ Error sincronizando pedido:', pendiente.data.tracking_code, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private procesarUpdateStatusPedido(pendiente: any, callback: (resultado: string) => void): void {
    this.http.put(`${this.apiUrl}/${pendiente.data.id}/status`, {
      status: pendiente.data.status,
      payment_verified: pendiente.data.payment_verified
    }).subscribe({
      next: (response: any) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ Estado sincronizado:', pendiente.data.id);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando estado:', pendiente.data.id, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private procesarUpdatePaymentPedido(pendiente: any, callback: (resultado: string) => void): void {
    this.http.put(`${this.apiUrl}/${pendiente.data.id}/payment`, {
      payment_verified: pendiente.data.payment_verified
    }).subscribe({
      next: (response: any) => {
        this.marcarPendienteComoProcesada(pendiente.id, 'exitoso');
        console.log('✅ Pago sincronizado:', pendiente.data.id);
        callback('exitoso');
      },
      error: (err) => {
        console.error('❌ Error sincronizando pago:', pendiente.data.id, err);
        this.marcarPendienteComoFallida(pendiente.id);
        callback('error');
      }
    });
  }

  private actualizarCacheConPedidoReal(pedidoReal: OrderTracking, codigoTemporal: string): void {
    try {
      const cacheKey = 'pedidos_cache';
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const pedidosCache = JSON.parse(cached);
        const pedidosActualizados = pedidosCache.data.map((p: OrderTracking) => 
          p.tracking_code === codigoTemporal ? pedidoReal : p
        );
        
        this.guardarCachePedidos(pedidosActualizados);
        
        // Actualizar el BehaviorSubject
        this.ordersSource.next(pedidosActualizados);
      }
    } catch (error) {
      console.error('❌ Error actualizando cache con pedido real:', error);
    }
  }

  private marcarPendienteComoProcesada(id: string, resultado: string): void {
    const pendientes = this.obtenerPendientes();
    const actualizadas = pendientes.map(p => 
      p.id === id ? { ...p, status: 'processed', resultado } : p
    );
    localStorage.setItem('pedidos_pendientes', JSON.stringify(actualizadas));
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
    localStorage.setItem('pedidos_pendientes', JSON.stringify(actualizadas));
  }

  private finalizarSincronizacionPedidos(procesadas: number, total: number, exitosas: number, errores: number): void {
    if (procesadas === total) {
      this.isSyncing = false;
      console.log(`✅ Sincronización completada: ${exitosas} exitosas, ${errores} errores`);
      
      // Recargar pedidos actualizados
      setTimeout(() => {
        this.getAllOrders().subscribe();
      }, 1000);

      this.syncAttempts = 0;
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
    localStorage.setItem('pedidos_pendientes', JSON.stringify(actualizadas));
  }

  // ✅ ACTUALIZAR SOLO EL ESTADO DE PAGO (ONLINE/OFFLINE)
  updatePaymentStatus(id: number, payment_verified: boolean): Observable<OrderTracking> {
    const updateData = { payment_verified };

    if (navigator.onLine) {
      return this.http.put<OrderTracking>(`${this.apiUrl}/${id}/payment`, updateData).pipe(
        tap(updatedOrder => {
          console.log('✅ Pago actualizado en API:', updatedOrder.tracking_code);
          this.actualizarCacheConPedido(updatedOrder);
        }),
        catchError(err => {
          console.error('❌ Error API, guardando offline:', err);
          return this.actualizarPagoOffline(id, updateData);
        })
      );
    } else {
      return this.actualizarPagoOffline(id, updateData);
    }
  }

  private actualizarPagoOffline(id: number, updateData: any): Observable<OrderTracking> {
    return new Observable(observer => {
      try {
        // Guardar en pendientes
        this.agregarPendiente('UPDATE_PAYMENT', { id, ...updateData }, true);

        // Actualizar cache local inmediatamente
        const currentOrders = this.ordersSource.getValue();
        const pedidoActualizado = currentOrders.find(p => p.id === id);
        
        if (pedidoActualizado) {
          const pedidoModificado = {
            ...pedidoActualizado,
            payment_verified: updateData.payment_verified,
            status_updated_at: new Date().toISOString()
          };

          const nuevasOrdenes = currentOrders.map(p => 
            p.id === id ? pedidoModificado : p
          );

          this.ordersSource.next(nuevasOrdenes);
          this.guardarCachePedidos(nuevasOrdenes);

          console.log('📱 Pago actualizado offline:', pedidoModificado.tracking_code);
          observer.next(pedidoModificado);
        } else {
          observer.error('Pedido no encontrado en cache');
        }
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }
  // En tracking.service.ts - AGREGAR este método
createCompleteOrder(orderPayload: any): Observable<any> {
  if (navigator.onLine) {
    return this.http.post<any>(`${this.apiUrl}/complete`, orderPayload).pipe(
      tap(response => {
        console.log('✅ Pedido completo creado en API:', response.tracking_code);
        // Actualizar cache local
        const currentOrders = this.ordersSource.getValue();
        this.ordersSource.next([response.order, ...currentOrders]);
        this.guardarCachePedidos([response.order, ...currentOrders]);
      }),
      catchError(err => {
        console.error('❌ Error API, guardando offline:', err);
        return this.crearPedidoCompletoOffline(orderPayload);
      })
    );
  } else {
    return this.crearPedidoCompletoOffline(orderPayload);
  }
}

private crearPedidoCompletoOffline(orderPayload: any): Observable<any> {
  return new Observable(observer => {
    try {
      const tempTrackingCode = 'OFFLINE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      
      const pedidoOffline = {
        ...orderPayload.order_data,
        tracking_code: tempTrackingCode,
        id: 'offline_' + Date.now(),
        customer_name: `${orderPayload.user_data.first_name} ${orderPayload.user_data.last_name}`,
        customer_phone: orderPayload.user_data.phone,
        customer_email: orderPayload.user_data.email,
        status: 'pedido_recibido',
        payment_verified: false,
        order_date: new Date().toISOString(),
        status_updated_at: new Date().toISOString()
      };

      // Guardar en pendientes
      this.agregarPendiente('CREATE_COMPLETE', { orderPayload, pedidoOffline }, true);

      // Actualizar cache local
      const currentOrders = this.ordersSource.getValue();
      this.ordersSource.next([pedidoOffline, ...currentOrders]);
      this.guardarCachePedidos([pedidoOffline, ...currentOrders]);

      console.log('📱 Pedido completo guardado offline:', tempTrackingCode);
      observer.next({ order: pedidoOffline, tracking_code: tempTrackingCode });
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  });
}

    // Agregar este método al servicio
getCompletedOrders(): Observable<OrderTracking[]> {
  this.loadingSource.next(true);
  
  if (navigator.onLine) {
    return this.http.get<OrderTracking[]>(`${this.apiUrl}/completed`).pipe(
      tap(orders => {
        console.log('✅ Pedidos finalizados cargados desde API:', orders.length);
        this.loadingSource.next(false);
      }),
      catchError(err => {
        console.error('❌ Error API, cargando finalizados desde cache:', err);
        return this.cargarFinalizadosOffline();
      })
    );
  } else {
    return this.cargarFinalizadosOffline();
  }
}

private cargarFinalizadosOffline(): Observable<OrderTracking[]> {
  return new Observable(observer => {
    try {
      const cacheKey = 'pedidos_cache';
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const pedidosCache = JSON.parse(cached);
        const finalizados = pedidosCache.data.filter((p: OrderTracking) => 
          p.status === 'finalizado'
        );
        console.log('📱 Pedidos finalizados desde cache:', finalizados.length);
        observer.next(finalizados);
      } else {
        console.log('📱 No hay pedidos finalizados en cache');
        observer.next([]);
      }
      observer.complete();
    } catch (error) {
      console.error('❌ Error cargando finalizados desde cache:', error);
      observer.next([]);
      observer.complete();
    }
  });
}
}