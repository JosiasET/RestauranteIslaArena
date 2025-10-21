import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-fishes',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './fishes.html',
  styleUrls: ['./fishes.css']
})
export class Fishes implements OnInit, OnDestroy {
  saucer: Fish[] = [];
  productosFiltrados: any[] = [];
  recomendacionesDelDia: any[] = [];
  loading: boolean = true;

  // Variables para el modal de tamaños (VENTANAS FLOTANTES)
  mostrarModal: boolean = false;
  productoSeleccionado: any = null;
  tipoSeleccionado: any = null;
  tamanoSeleccionado: any = null;
  cantidad: number = 1;

  // Variable para posición del modal
  currentScrollPosition: number = 0;

  private subscription: Subscription = new Subscription();

  constructor(
    private fishesService: FishesService,
    private cartService: CartService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Inicializando componente Fishes...');
    this.cargarEspecialidades();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarEspecialidades() {
    this.loading = true;
    this.cdRef.detectChanges();

    // FORZAR CARGA INICIAL
    this.fishesService.cargarEspecialidades().subscribe();

    this.subscription.add(
      this.fishesService.saucer$.subscribe((data: Fish[]) => {
        console.log("🐟 Especialidades recibidas:", data.length);
        this.saucer = data;
        
        // Preparar datos para las ventanas flotantes
        this.productosFiltrados = data.map(producto => ({
          ...producto,
          descripcion_real: producto.descripcion_real || producto.descripcion || '',
          tiene_tamanos: producto.tiene_tamanos || false,
          tamanos: producto.tamanos || [],
          tipos: producto.tipos || []
        }));
        
        this.generarRecomendacionesDelDia();
        this.loading = false;
        this.cdRef.detectChanges();
      })
    );

    // Suscribirse al estado de loading
    this.subscription.add(
      this.fishesService.loading$.subscribe((loading: boolean) => {
        if (!loading) {
          this.loading = false;
          this.cdRef.detectChanges();
        }
      })
    );
  }

  // MÉTODO PARA ABRIR MODAL - VENTANA FLOTANTE
  abrirModalProducto(producto: any) {
    this.currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.productoSeleccionado = producto;
    
    console.log('📦 Producto seleccionado:', producto);
    
    if (producto.tiene_tamanos && producto.tamanos && producto.tamanos.length > 0) {
      this.tamanoSeleccionado = producto.tamanos[0];
    } else {
      this.tamanoSeleccionado = {
        nombre: 'Único',
        precio: producto.precio
      };
    }
    
    this.cantidad = 1;
    this.mostrarModal = true;
    
    setTimeout(() => {
      this.aplicarPosicionModal();
    }, 0);
    
    this.cdRef.detectChanges();
  }

  aplicarPosicionModal() {
    const modalElement = document.querySelector('.modal-content.horizontal') as HTMLElement;
    if (modalElement) {
      const viewportHeight = window.innerHeight;
      const modalHeight = modalElement.offsetHeight;
      const scrollTop = this.currentScrollPosition;
      
      const idealPosition = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
      const safePosition = Math.max(20, Math.min(idealPosition, scrollTop + (viewportHeight - modalHeight - 20)));
      
      modalElement.style.marginTop = safePosition + 'px';
    }
  }

  seleccionarTamano(tamano: any) {
    this.tamanoSeleccionado = tamano;
    this.cdRef.detectChanges();
  }

  incrementarCantidad() {
    this.cantidad++;
    this.cdRef.detectChanges();
  }

  decrementarCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.cdRef.detectChanges();
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.tipoSeleccionado = null;
    this.tamanoSeleccionado = null;
    this.cantidad = 1;
    this.cdRef.detectChanges();
  }

  agregarConOpciones() {
    if (!this.productoSeleccionado) return;

    const precioFinal = this.getPrecioFinal();

    const item: CartItem = {
      id: this.productoSeleccionado.id,
      nombre: this.productoSeleccionado.nombre,
      descripcion: this.productoSeleccionado.descripcion_real || this.productoSeleccionado.descripcion,
      precio: precioFinal,
      imagen: this.productoSeleccionado.imagen,
      cantidad: this.cantidad,
      tamanoSeleccionado: this.tamanoSeleccionado ? {
        nombre: this.tamanoSeleccionado.nombre,
        precio: this.tamanoSeleccionado.precio
      } : undefined,
      tieneTamanos: this.productoSeleccionado.tiene_tamanos
    };

    console.log('🛒 Agregando al carrito:', item);
    this.cartService.addToCart(item);
    this.cerrarModal();
  }

  getPrecioFinal(): number {
    if (this.tamanoSeleccionado) {
      return this.tamanoSeleccionado.precio;
    }
    return this.productoSeleccionado?.precio || 0;
  }

  generarRecomendacionesDelDia() {
    if (this.saucer.length === 0) return;
    if (this.saucer.length <= 4) {
      this.recomendacionesDelDia = [...this.productosFiltrados];
      return;
    }
    const productosMezclados = [...this.productosFiltrados].sort(() => Math.random() - 0.5);
    this.recomendacionesDelDia = productosMezclados.slice(0, 4);
  }

  agregarAlCarrito(producto: any) {
    this.abrirModalProducto(producto);
  }
}