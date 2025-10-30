// StockService.ts - VERSIÓN COMPLETA BASADA EN TU ESTRUCTURA
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError, forkJoin, map } from 'rxjs';

export interface ProductoStock {
  id: number;
  id_producto?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  cantidad_productos: number; // ✅ PARA BEBIDAS
  unidad?: number; // ✅ PARA ESPECIALIDADES
  tiene_tamanos: boolean;
  tipo: 'bebida' | 'especialidad';
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

  // Obtener todos los productos con stock (bebidas + especialidades)
  obtenerProductosConStock(): Observable<ProductoStock[]> {
    this.loadingSource.next(true);
    
    return forkJoin({
      bebidas: this.http.get<any[]>(`${this.bebidasApiUrl}/stock`),
      especialidades: this.http.get<any[]>(`${this.especialidadesApiUrl}/stock`)
    }).pipe(
      map(({ bebidas, especialidades }) => {
        console.log('📦 Bebidas recibidas:', bebidas);
        console.log('🐟 Especialidades recibidas:', especialidades);

        // Normalizar bebidas - BASADO EN TU ESTRUCTURA
        const bebidasNormalizadas = bebidas.map(bebida => ({
          ...bebida,
          id: bebida.id_producto || bebida.id, // ✅ id_producto de la tabla Productos
          categoria: 'Bebida',
          cantidad_productos: bebida.cantidad_productos || 0,
          tipo: 'bebida' as const
        }));

        // Normalizar especialidades - BASADO EN TU ESTRUCTURA
        const especialidadesNormalizadas = especialidades.map(especialidad => ({
          ...especialidad,
          id: especialidad.id_producto || especialidad.id, // ✅ id_producto de la tabla Productos
          categoria: 'Especialidad',
          cantidad_productos: especialidad.unidad || 0, // ✅ unidad para especialidades
          tipo: 'especialidad' as const
        }));

        const todosProductos = [...bebidasNormalizadas, ...especialidadesNormalizadas];
        console.log('📊 Total productos combinados:', todosProductos.length);
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

  // Actualizar stock de un producto
  actualizarStock(producto: ProductoStock, nuevaCantidad: number): Observable<any> {
    let apiUrl: string;
    let body: any;

    if (producto.tipo === 'bebida') {
      apiUrl = `${this.bebidasApiUrl}/stock/${producto.id}`;
      body = { cantidad_productos: nuevaCantidad };
    } else {
      apiUrl = `${this.especialidadesApiUrl}/stock/${producto.id}`;
      body = { cantidad: nuevaCantidad };
    }

    console.log('🔄 Actualizando stock:', { producto: producto.nombre, nuevaCantidad, apiUrl });

    return this.http.put(apiUrl, body).pipe(
      tap((productoActualizado: any) => {
        console.log('✅ Stock actualizado:', productoActualizado);
        
        // Actualizar la lista local
        const productosActuales = this.productosSource.getValue();
        const productosActualizados = productosActuales.map(p =>
          p.id === producto.id && p.tipo === producto.tipo 
            ? { ...p, cantidad_productos: nuevaCantidad } 
            : p
        );
        this.productosSource.next(productosActualizados);
      }),
      catchError(this.handleError)
    );
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

  // Obtener estadísticas rápidas
  obtenerEstadisticas(): { total: number, bebidas: number, especialidades: number, stockBajo: number } {
    const productos = this.productosSource.getValue();
    return {
      total: productos.length,
      bebidas: productos.filter(p => p.tipo === 'bebida').length,
      especialidades: productos.filter(p => p.tipo === 'especialidad').length,
      stockBajo: productos.filter(p => p.cantidad_productos <= 10).length
    };
  }

  // Recargar productos
  recargarProductos(): void {
    this.obtenerProductosConStock().subscribe();
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