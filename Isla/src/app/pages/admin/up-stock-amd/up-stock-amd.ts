// En up-stock-amd.ts - VERSIÓN CORREGIDA
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService, ProductoStock } from '../../../core/service/Stock.service';

@Component({
  selector: 'app-up-stock-amd',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './up-stock-amd.html',
  styleUrls: ['./up-stock-amd.css']
})
export class UpStockAmdPage implements OnInit, OnDestroy {
  productos: ProductoStock[] = [];
  productosFiltrados: ProductoStock[] = [];
  isLoading: boolean = false;
  isUpdating: boolean = false;
  
  // Filtros
  terminoBusqueda: string = '';
  categoriaFiltro: string = '';
  stockBajoFiltro: boolean = false;
  tipoUnidadFiltro: string = '';
  
  // Estadísticas
  stats = {
    totalProductos: 0,
    totalUnidades: 0,
    totalKilos: 0,
    productosStockBajo: 0,
    productosSinStock: 0 // ✅ NUEVO
  };
  
  today: Date = new Date();

  private subscription: Subscription = new Subscription();

  constructor(
    private stockService: StockService,
    private cdRef: ChangeDetectorRef
  ) {}

  // En up-stock-amd.ts - en ngOnInit
ngOnInit() {
  console.log('🔄 Inicializando módulo de stock...');
  
  // 🔍 EJECUTAR DIAGNÓSTICO DESPUÉS DE CARGAR
  setTimeout(() => {
    this.stockService.diagnosticarEstructuraEspecialidades();
  }, 2000);
  
  // 🔍 EJECUTAR DIAGNÓSTICO TEMPORAL
  this.stockService.diagnosticarEstructuraEspecialidades();
  
  this.subscription.add(
    this.stockService.loading$.subscribe(loading => {
      this.isLoading = loading;
      this.cdRef.detectChanges();
    })
  );

  this.subscription.add(
  this.stockService.productos$.subscribe((productos: ProductoStock[]) => {
    this.productos = productos;
    this.productosFiltrados = [...productos];
    this.calcularEstadisticas();
    this.aplicarFiltros();
    console.log('📦 Productos recibidos:', productos.length);
    
    // ✅ DEBUG: Verificar EXACTAMENTE qué valores vienen
    productos.forEach(p => {
      console.log(`🔍 ${p.nombre} (${p.tipo}):`, {
        cantidad_productos: p.cantidad_productos,
        tipo: typeof p.cantidad_productos,
        esNull: p.cantidad_productos === null,
        esUndefined: p.cantidad_productos === undefined,
        esNaN: isNaN(p.cantidad_productos)
      });
    });
    
    this.cdRef.detectChanges();
  })
);

  this.cargarProductos();
}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  cargarProductos() {
    this.stockService.obtenerProductosConStock().subscribe({
      error: (err) => {
        console.error('❌ Error cargando productos:', err);
        alert('Error al cargar los productos: ' + err.message);
      }
    });
  }

  // ✅ NUEVO: Verificar si el producto puede actualizar stock
  puedeActualizarStock(producto: ProductoStock): boolean {
    return producto.puedeActualizarStock;
  }

  // Actualizar stock de un producto
    actualizarStock(producto: ProductoStock, nuevaCantidad: number) {
    // ✅ CORREGIDO: Validar y redondear la cantidad antes de enviar
    let cantidadFinal: number;
    
    if (this.getTipoUnidad(producto) === 'kg') {
      // Para kilos, redondear a 1 decimal
      cantidadFinal = Number(nuevaCantidad.toFixed(1));
    } else {
      // Para unidades, redondear a entero
      cantidadFinal = Math.round(nuevaCantidad);
    }

    if (cantidadFinal < 0) {
      alert('La cantidad no puede ser negativa');
      return;
    }

    if (cantidadFinal === producto.cantidad_productos) {
      console.log('ℹ️ Misma cantidad, no se actualiza');
      return;
    }

    this.isUpdating = true;
    
    this.stockService.actualizarStock(producto, cantidadFinal).subscribe({
      next: (productoActualizado) => {
        console.log('✅ Stock actualizado:', producto.nombre, cantidadFinal);
        this.isUpdating = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error actualizando stock:', err);
        alert('Error al actualizar el stock: ' + err.message);
        this.isUpdating = false;
        this.cdRef.detectChanges();
      }
    });
  }

  // Determinar tipo de unidad del producto
  getTipoUnidad(producto: ProductoStock): string {
    if (producto.categoria.toLowerCase().includes('especialidad') || 
        producto.categoria.toLowerCase().includes('marisco') ||
        producto.nombre.toLowerCase().includes('kg') ||
        producto.nombre.toLowerCase().includes('kilo')) {
      return 'kg';
    }
    return 'unidades';
  }

  // Obtener el incremento adecuado según el tipo de producto
  getIncrementoAdecuado(producto: ProductoStock): number {
    const tipoUnidad = this.getTipoUnidad(producto);
    return tipoUnidad === 'kg' ? 0.5 : 1;
  }

  // Formatear cantidad para mostrar
  // En up-stock-amd.ts - CORREGIR formatearCantidad
  formatearCantidad(producto: ProductoStock): string {
    let cantidad = producto.cantidad_productos;
    const tipoUnidad = this.getTipoUnidad(producto);
    
    // ✅ CORREGIDO: Manejar casos donde cantidad sea null/undefined
    if (cantidad === null || cantidad === undefined || isNaN(cantidad)) {
      cantidad = 0;
    }
    
    if (tipoUnidad === 'kg') {
      // ✅ CORREGIDO: Asegurar que cantidad sea número antes de usar toFixed
      return `${Number(cantidad).toFixed(1)} kg`;
    }
    return `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}`;
  }
  // Incrementar stock
  // En up-stock-amd.ts - CORREGIR MÉTODOS DE INCREMENTO
  // En up-stock-amd.ts - MEJORAR métodos para especialidades
  incrementarStock(producto: ProductoStock, incrementoPersonalizado?: number) {
    // ✅ CORREGIDO: Asegurar que cantidad_productos sea número
    let cantidadActual = producto.cantidad_productos;
    if (typeof cantidadActual === 'string') {
      cantidadActual = Number(cantidadActual) || 0;
    }
    
    const incremento = incrementoPersonalizado || this.getIncrementoAdecuado(producto);
    
    let nuevaCantidad: number;
    
    if (this.getTipoUnidad(producto) === 'kg') {
      nuevaCantidad = Number((cantidadActual + incremento).toFixed(1));
    } else {
      nuevaCantidad = Math.round(cantidadActual + incremento);
    }
    
    console.log('➕ Incrementando especialidad:', { 
      producto: producto.nombre, 
      tipo: producto.tipo,
      cantidadActual,
      incremento,
      nuevaCantidad 
    });
    
    this.actualizarStock(producto, nuevaCantidad);
  }

  decrementarStock(producto: ProductoStock, decrementoPersonalizado?: number) {
    // ✅ CORREGIDO: Asegurar que cantidad_productos sea número
    let cantidadActual = producto.cantidad_productos;
    if (typeof cantidadActual === 'string') {
      cantidadActual = Number(cantidadActual) || 0;
    }
    
    const decremento = decrementoPersonalizado || this.getIncrementoAdecuado(producto);
    
    let nuevaCantidad: number;
    
    if (this.getTipoUnidad(producto) === 'kg') {
      nuevaCantidad = Math.max(0, Number((cantidadActual - decremento).toFixed(1)));
    } else {
      nuevaCantidad = Math.max(0, Math.round(cantidadActual - decremento));
    }
    
    console.log('➖ Decrementando especialidad:', { 
      producto: producto.nombre, 
      tipo: producto.tipo,
      cantidadActual,
      decremento,
      nuevaCantidad 
    });
    
    this.actualizarStock(producto, nuevaCantidad);
  }
  // Buscar productos
  buscarProductos() {
    this.stockService.buscarProductos(this.terminoBusqueda);
  }

  // Aplicar filtros
  aplicarFiltros() {
    let productosFiltrados = [...this.productos];

    if (this.categoriaFiltro) {
      productosFiltrados = productosFiltrados.filter(p => 
        p.categoria.toLowerCase() === this.categoriaFiltro.toLowerCase()
      );
    }

    if (this.tipoUnidadFiltro) {
      productosFiltrados = productosFiltrados.filter(p => 
        this.getTipoUnidad(p) === this.tipoUnidadFiltro
      );
    }

    if (this.stockBajoFiltro) {
      productosFiltrados = productosFiltrados.filter(p => {
        if (!p.puedeActualizarStock) return false; // Excluir productos sin stock
        const tipoUnidad = this.getTipoUnidad(p);
        const limiteStockBajo = tipoUnidad === 'kg' ? 5 : 10;
        return p.cantidad_productos <= limiteStockBajo;
      });
    }

    this.productosFiltrados = productosFiltrados;
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.categoriaFiltro = '';
    this.tipoUnidadFiltro = '';
    this.stockBajoFiltro = false;
    this.productosFiltrados = [...this.productos];
    this.stockService.obtenerProductosConStock().subscribe();
  }

  // Calcular estadísticas
  calcularEstadisticas() {
    this.stats.totalProductos = this.productos.length;
    
    this.stats.totalUnidades = 0;
    this.stats.totalKilos = 0;
    
    this.productos.forEach(producto => {
      if (producto.puedeActualizarStock) {
        const tipoUnidad = this.getTipoUnidad(producto);
        if (tipoUnidad === 'kg') {
          this.stats.totalKilos += producto.cantidad_productos;
        } else {
          this.stats.totalUnidades += producto.cantidad_productos;
        }
      }
    });

    this.stats.productosStockBajo = this.productos.filter(p => {
      if (!p.puedeActualizarStock) return false;
      const tipoUnidad = this.getTipoUnidad(p);
      const limiteStockBajo = tipoUnidad === 'kg' ? 5 : 10;
      return p.cantidad_productos <= limiteStockBajo;
    }).length;

    this.stats.productosSinStock = this.productos.filter(p => !p.puedeActualizarStock).length;
  }

  // Obtener clase CSS para el stock
  getStockClass(producto: ProductoStock): string {
    if (!producto.puedeActualizarStock) {
      return 'stock-no-disponible';
    }

    const cantidad = producto.cantidad_productos;
    const tipoUnidad = this.getTipoUnidad(producto);
    
    if (cantidad === 0) return 'stock-cero';
    
    if (tipoUnidad === 'kg') {
      if (cantidad <= 2) return 'stock-bajo';
      if (cantidad <= 5) return 'stock-medio';
      return 'stock-alto';
    } else {
      if (cantidad <= 5) return 'stock-bajo';
      if (cantidad <= 10) return 'stock-medio';
      return 'stock-alto';
    }
  }

  // Obtener icono según categoría
  getCategoriaIcon(categoria: string): string {
    switch (categoria.toLowerCase()) {
      case 'bebida': return '🥤';
      case 'especialidad': return '🐟';
      case 'marisco': return '🦐';
      default: return '📦';
    }
  }

  // Obtener texto para botones de incremento
  getTextoIncremento(producto: ProductoStock): string {
  const incremento = this.getIncrementoAdecuado(producto);
  const tipoUnidad = this.getTipoUnidad(producto);
  
  if (tipoUnidad === 'kg') {
    return incremento === 0.5 ? '+0.5' : `+${incremento}`;
  }
  return `+${incremento}`;
  }

  getTextoDecremento(producto: ProductoStock): string {
    const decremento = this.getIncrementoAdecuado(producto);
    const tipoUnidad = this.getTipoUnidad(producto);
    
    if (tipoUnidad === 'kg') {
      return decremento === 0.5 ? '-0.5' : `-${decremento}`;
    }
    return `-${decremento}`;
  }
}