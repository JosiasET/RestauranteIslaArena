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
  
  // Estadísticas - SEPARADAS por tipo de unidad
  stats = {
    totalProductos: 0,
    totalUnidades: 0,
    totalKilos: 0,
    productosStockBajo: 0
  };
  
  today: Date = new Date();

  private subscription: Subscription = new Subscription();

  constructor(
    private stockService: StockService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando módulo de stock...');
    
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

  // ✅ NUEVO: Determinar tipo de unidad del producto
  getTipoUnidad(producto: ProductoStock): string {
    // Si el producto es marisco o especialidad, usa kg
    if (producto.categoria.toLowerCase().includes('especialidad') || 
        producto.categoria.toLowerCase().includes('marisco') ||
        producto.nombre.toLowerCase().includes('kg') ||
        producto.nombre.toLowerCase().includes('kilo')) {
      return 'kg';
    }
    // Por defecto, unidades
    return 'unidades';
  }

  // ✅ NUEVO: Obtener el incremento adecuado según el tipo de producto
  getIncrementoAdecuado(producto: ProductoStock): number {
    const tipoUnidad = this.getTipoUnidad(producto);
    return tipoUnidad === 'kg' ? 0.5 : 1; // 0.5 kg para mariscos, 1 unidad para bebidas
  }

  // ✅ NUEVO: Formatear cantidad para mostrar
  formatearCantidad(producto: ProductoStock): string {
    const cantidad = producto.cantidad_productos;
    const tipoUnidad = this.getTipoUnidad(producto);
    
    if (tipoUnidad === 'kg') {
      return `${cantidad} kg`;
    }
    return `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}`;
  }

  // Actualizar stock de un producto
  actualizarStock(producto: ProductoStock, nuevaCantidad: number) {
    if (nuevaCantidad < 0) {
      alert('La cantidad no puede ser negativa');
      return;
    }

    if (nuevaCantidad === producto.cantidad_productos) {
      console.log('ℹ️ Misma cantidad, no se actualiza');
      return;
    }

    this.isUpdating = true;
    
    this.stockService.actualizarStock(producto, nuevaCantidad).subscribe({
      next: (productoActualizado) => {
        console.log('✅ Stock actualizado:', producto.nombre, nuevaCantidad);
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

  // Incrementar stock con incrementos adecuados
  incrementarStock(producto: ProductoStock, incrementoPersonalizado?: number) {
    const incremento = incrementoPersonalizado || this.getIncrementoAdecuado(producto);
    const nuevaCantidad = producto.cantidad_productos + incremento;
    this.actualizarStock(producto, nuevaCantidad);
  }

  // Decrementar stock con decrementos adecuados
  decrementarStock(producto: ProductoStock, decrementoPersonalizado?: number) {
    const decremento = decrementoPersonalizado || this.getIncrementoAdecuado(producto);
    const nuevaCantidad = Math.max(0, producto.cantidad_productos - decremento);
    this.actualizarStock(producto, nuevaCantidad);
  }

  // Buscar productos
  buscarProductos() {
    this.stockService.buscarProductos(this.terminoBusqueda);
  }

  // Aplicar filtros
  aplicarFiltros() {
    let productosFiltrados = [...this.productos];

    // Filtro por categoría
    if (this.categoriaFiltro) {
      productosFiltrados = productosFiltrados.filter(p => 
        p.categoria.toLowerCase() === this.categoriaFiltro.toLowerCase()
      );
    }

    // ✅ NUEVO: Filtro por tipo de unidad
    if (this.tipoUnidadFiltro) {
      productosFiltrados = productosFiltrados.filter(p => 
        this.getTipoUnidad(p) === this.tipoUnidadFiltro
      );
    }

    // Filtro por stock bajo (ajustado por tipo de producto)
    if (this.stockBajoFiltro) {
      productosFiltrados = productosFiltrados.filter(p => {
        const tipoUnidad = this.getTipoUnidad(p);
        const limiteStockBajo = tipoUnidad === 'kg' ? 5 : 10; // 5 kg o 10 unidades
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

  // ✅ CORREGIDO: Calcular estadísticas separadas
  calcularEstadisticas() {
    this.stats.totalProductos = this.productos.length;
    
    // Separar totales por tipo de unidad
    this.stats.totalUnidades = 0;
    this.stats.totalKilos = 0;
    
    this.productos.forEach(producto => {
      const tipoUnidad = this.getTipoUnidad(producto);
      if (tipoUnidad === 'kg') {
        this.stats.totalKilos += producto.cantidad_productos;
      } else {
        this.stats.totalUnidades += producto.cantidad_productos;
      }
    });

    // Calcular productos con stock bajo (con límites diferentes)
    this.stats.productosStockBajo = this.productos.filter(p => {
      const tipoUnidad = this.getTipoUnidad(p);
      const limiteStockBajo = tipoUnidad === 'kg' ? 5 : 10;
      return p.cantidad_productos <= limiteStockBajo;
    }).length;
  }

  // ✅ ACTUALIZADO: Obtener clase CSS para el stock (considerando tipo de producto)
  getStockClass(producto: ProductoStock): string {
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

  // ✅ NUEVO: Obtener texto para botones de incremento
  getTextoIncremento(producto: ProductoStock): string {
    const incremento = this.getIncrementoAdecuado(producto);
    const tipoUnidad = this.getTipoUnidad(producto);
    
    if (tipoUnidad === 'kg') {
      return incremento === 0.5 ? '+0.5' : `+${incremento}`;
    }
    return `+${incremento}`;
  }

  // ✅ NUEVO: Obtener texto para botones de decremento
  getTextoDecremento(producto: ProductoStock): string {
    const decremento = this.getIncrementoAdecuado(producto);
    const tipoUnidad = this.getTipoUnidad(producto);
    
    if (tipoUnidad === 'kg') {
      return decremento === 0.5 ? '-0.5' : `-${decremento}`;
    }
    return `-${decremento}`;
  }
  
}