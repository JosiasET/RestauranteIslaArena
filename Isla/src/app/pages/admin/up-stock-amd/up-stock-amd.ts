// src/app/pages/admin/up-stock-amd/up-stock-amd.page.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService, ProductoStock } from '../../../core/service/Stock.service';

@Component({
  selector: 'app-up-stock-amd',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe], // ✅ Agregar DatePipe
  templateUrl: './up-stock-amd.html',
  styleUrls: ['./up-stock-amd.css']
})
export class UpStockAmdPage implements OnInit, OnDestroy { // ✅ Cambiar nombre a UpStockAmdPage
  productos: ProductoStock[] = [];
  productosFiltrados: ProductoStock[] = [];
  isLoading: boolean = false;
  isUpdating: boolean = false;
  
  // Filtros
  terminoBusqueda: string = '';
  categoriaFiltro: string = '';
  stockBajoFiltro: boolean = false;
  
  // Estadísticas
  totalProductos: number = 0;
  totalStock: number = 0;
  productosStockBajo: number = 0;
  today: Date = new Date();

  private subscription: Subscription = new Subscription();

  constructor(
    private stockService: StockService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔄 Inicializando módulo de stock...');
    
    // Suscribirse al estado de loading
    this.subscription.add(
      this.stockService.loading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdRef.detectChanges();
      })
    );

    // Suscribirse a los productos
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

    // Cargar productos iniciales
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

  // Incrementar stock
  incrementarStock(producto: ProductoStock, incremento: number = 1) {
    const nuevaCantidad = producto.cantidad_productos + incremento;
    this.actualizarStock(producto, nuevaCantidad);
  }

  // Decrementar stock
  decrementarStock(producto: ProductoStock, decremento: number = 1) {
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

    // Filtro por stock bajo
    if (this.stockBajoFiltro) {
      productosFiltrados = productosFiltrados.filter(p => p.cantidad_productos <= 10);
    }

    this.productosFiltrados = productosFiltrados;
  }

  // Limpiar filtros
  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.categoriaFiltro = '';
    this.stockBajoFiltro = false;
    this.productosFiltrados = [...this.productos];
    this.stockService.obtenerProductosConStock().subscribe();
  }

  // Calcular estadísticas
  calcularEstadisticas() {
    this.totalProductos = this.productos.length;
    this.totalStock = this.productos.reduce((sum, p) => sum + p.cantidad_productos, 0);
    this.productosStockBajo = this.productos.filter(p => p.cantidad_productos <= 10).length;
  }

  // Obtener clase CSS para el stock
  getStockClass(cantidad: number): string {
    if (cantidad === 0) return 'stock-cero';
    if (cantidad <= 5) return 'stock-bajo';
    if (cantidad <= 10) return 'stock-medio';
    return 'stock-alto';
  }

  // Obtener icono según categoría
  getCategoriaIcon(categoria: string): string {
    switch (categoria.toLowerCase()) {
      case 'bebida': return '🥤';
      case 'especialidad': return '🐟';
      default: return '📦';
    }
  }
}