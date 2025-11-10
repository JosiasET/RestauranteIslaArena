// Stock.service.ts - VERSIÓN CORREGIDA Y LIMPIA
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, forkJoin, map, throwError } from 'rxjs';

export interface ProductoStock {
  id: number;
  id_producto?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  cantidad_productos: number;
  tiene_tamanos: boolean;
  tipo: 'bebida' | 'especialidad';
  puedeActualizarStock: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private bebidasApiUrl = 'http://localhost:3000/bebidas';
  private especialidadesApiUrl = 'http://localhost:3000/especialidades';
  
  private productosSource = new BehaviorSubject<ProductoStock[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(false);
  
  productos$ = this.productosSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {}

  obtenerProductosConStock(): Observable<ProductoStock[]> {
    this.loadingSource.next(true);
    
    return forkJoin({
      bebidas: this.http.get<any[]>(`${this.bebidasApiUrl}/stock`),
      especialidades: this.http.get<any[]>(`${this.especialidadesApiUrl}/stock`)
    }).pipe(
      map(({ bebidas, especialidades }) => {
        console.log('📦 Bebidas recibidas:', bebidas);
        console.log('🐟 Especialidades recibidas:', especialidades);

        // Normalizar bebidas
        const bebidasNormalizadas = bebidas.map(bebida => ({
          ...bebida,
          id: bebida.id_producto || bebida.id,
          nombre: bebida.name || bebida.nombre,
          descripcion: bebida.description || bebida.descripcion,
          categoria: 'Bebida',
          cantidad_productos: Number(bebida.product_quantity) || Number(bebida.cantidad_productos) || 0, // ✅ FORZAR NÚMERO
          tiene_tamanos: bebida.has_sizes || bebida.tiene_tamanos || false,
          tipo: 'bebida' as const,
          puedeActualizarStock: true
        }));

        // ✅ CORREGIDO: Normalizar especialidades - FORZAR NÚMEROS
        const especialidadesNormalizadas = especialidades.map(especialidad => {
          // Buscar y convertir a número
          let stock = especialidad.product_quantity !== undefined ? Number(especialidad.product_quantity) :
                    especialidad.cantidad_productos !== undefined ? Number(especialidad.cantidad_productos) :
                    especialidad.unidad !== undefined ? Number(especialidad.unidad) : 0;

          // Si es NaN, establecer en 0
          stock = isNaN(stock) ? 0 : stock;

          return {
            ...especialidad,
            id: especialidad.id_producto || especialidad.id,
            nombre: especialidad.name || especialidad.nombre,
            descripcion: especialidad.description || especialidad.descripcion,
            categoria: 'Especialidad',
            cantidad_productos: stock, // ✅ SIEMPRE SERÁ NÚMERO
            tiene_tamanos: especialidad.has_sizes || especialidad.tiene_tamanos || false,
            tipo: 'especialidad' as const,
            puedeActualizarStock: true
          };
        });

        const todosProductos = [...bebidasNormalizadas, ...especialidadesNormalizadas];
        console.log('📊 Total productos combinados:', todosProductos.length);
        
        // ✅ DEBUG MEJORADO: Verificar tipos de datos
        console.log('🔍 Stocks cargados - Bebidas:', bebidasNormalizadas.map(b => ({ 
          nombre: b.nombre, 
          stock: b.cantidad_productos, 
          tipo: typeof b.cantidad_productos 
        })));
        console.log('🔍 Stocks cargados - Especialidades:', especialidadesNormalizadas.map(e => ({ 
          nombre: e.nombre, 
          stock: e.cantidad_productos, 
          tipo: typeof e.cantidad_productos 
        })));
        
        return todosProductos;
      }),
      tap(productos => {
        console.log('✅ Productos con stock cargados:', {
          total: productos.length,
          bebidas: productos.filter(p => p.tipo === 'bebida').length,
          especialidades: productos.filter(p => p.tipo === 'especialidad').length
        });
        this.productosSource.next(productos);
        this.loadingSource.next(false);
      }),
      catchError(this.handleError)
    );
  }

  // ✅ MÉTODO ACTUALIZAR STOCK - PARA AMBOS TIPOS
  actualizarStock(producto: ProductoStock, nuevaCantidad: number): Observable<any> {
    let apiUrl: string;
    
    // Determinar endpoint según tipo de producto
    if (producto.tipo === 'bebida') {
      apiUrl = `${this.bebidasApiUrl}/stock/${producto.id}`;
    } else {
      apiUrl = `${this.especialidadesApiUrl}/stock/${producto.id}`;
    }

    const body = { 
      product_quantity: nuevaCantidad,
      cantidad_productos: nuevaCantidad
    };

    console.log('🔄 Actualizando stock:', { 
      producto: producto.nombre, 
      tipo: producto.tipo,
      nuevaCantidad, 
      apiUrl 
    });

    return this.http.put(apiUrl, body).pipe(
      tap((productoActualizado: any) => {
        console.log('✅ Stock actualizado exitosamente:', productoActualizado);
        this.actualizarListaLocal(producto, nuevaCantidad);
      }),
      catchError(this.handleError)
    );
  }

  private actualizarListaLocal(producto: ProductoStock, nuevaCantidad: number): void {
    const productosActuales = this.productosSource.getValue();
    const productosActualizados = productosActuales.map(p => {
      if (p.id === producto.id && p.tipo === producto.tipo) {
        console.log(`🔄 Actualizando local: ${p.nombre} de ${p.cantidad_productos} a ${nuevaCantidad}`);
        return { ...p, cantidad_productos: nuevaCantidad };
      }
      return p;
    });
    
    console.log('📊 Lista local actualizada');
    this.productosSource.next(productosActualizados);
  }

  // Buscar productos
  buscarProductos(termino: string): void {
    const productos = this.productosSource.getValue();
    if (!termino.trim()) {
      this.obtenerProductosConStock().subscribe();
      return;
    }

    const productosFiltrados = productos.filter(producto =>
      producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(termino.toLowerCase()) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(termino.toLowerCase()))
    );
    
    this.productosSource.next(productosFiltrados);
  }

  // Filtrar por categoría
  filtrarPorCategoria(categoria: string): void {
    const productos = this.productosSource.getValue();
    if (!categoria) {
      this.obtenerProductosConStock().subscribe();
      return;
    }

    const productosFiltrados = productos.filter(producto =>
      producto.categoria.toLowerCase() === categoria.toLowerCase()
    );
    
    this.productosSource.next(productosFiltrados);
  }

  // Obtener estadísticas
  obtenerEstadisticas(): { 
    total: number, 
    bebidas: number, 
    especialidades: number, 
    conStock: number 
  } {
    const productos = this.productosSource.getValue();
    return {
      total: productos.length,
      bebidas: productos.filter(p => p.tipo === 'bebida').length,
      especialidades: productos.filter(p => p.tipo === 'especialidad').length,
      conStock: productos.length // TODOS tienen stock ahora
    };
  }

  // Recargar productos
  recargarProductos(): void {
    this.obtenerProductosConStock().subscribe();
  }

  // ✅ MÉTODO DE DIAGNÓSTICO
  diagnosticarEstructuraEspecialidades(): void {
    console.log('🔍 Diagnosticando estructura de especialidades...');
    
    this.http.get<any[]>(`${this.especialidadesApiUrl}/stock`).subscribe({
      next: (especialidades) => {
        if (especialidades && especialidades.length > 0) {
          console.log('📋 Estructura completa del primer producto especialidad:', especialidades[0]);
          console.log('🔍 Todas las claves disponibles:', Object.keys(especialidades[0]));
          
          // Mostrar específicamente los campos de stock
          const primerProducto = especialidades[0];
          console.log('🔍 Campos de stock disponibles:');
          console.log('   - product_quantity:', primerProducto.product_quantity);
          console.log('   - cantidad_productos:', primerProducto.cantidad_productos);
          console.log('   - unidad:', primerProducto.unidad);
          console.log('   - product_quantity type:', typeof primerProducto.product_quantity);
        } else {
          console.log('📭 No hay especialidades para diagnosticar');
        }
      },
      error: (err) => {
        console.error('❌ Error en diagnóstico:', err);
      }
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en StockService:', error);
    let errorMessage = 'Error en el servicio de stock';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
      if (error.error && error.error.error) {
        errorMessage += ` - ${error.error.error}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}