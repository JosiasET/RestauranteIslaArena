import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DrinkService } from '../../core/service/DrinkService';
import { Drinkinterface } from '../../core/interface/drink';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-drink',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, CommonModule],
  templateUrl: './drink.html',
  styleUrls: ['./drink.css']
})
export class Drink implements OnInit, OnDestroy {
  saucer: Drinkinterface[] = [];
  loading: boolean = true;
  isOffline: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private drinkService: DrinkService,
    private cartService: CartService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔄 Inicializando componente Drink...');
    this.cargarBebidas();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarBebidas() {
    this.loading = true;
    this.cdRef.detectChanges();

    // ✅ USAR EL MÉTODO ORIGINAL cargarBebidas()
    this.subscription.add(
      this.drinkService.cargarBebidas().subscribe({
        next: (bebidas: Drinkinterface[]) => {
          console.log("🥤 Bebidas cargadas:", bebidas.length);
          this.saucer = bebidas;
          this.isOffline = !navigator.onLine;
          this.loading = false;
          this.cdRef.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error cargando bebidas:', error);
          this.loading = false;
          this.cdRef.detectChanges();
        }
      })
    );
  }

  // ✅ MÉTODO ACTUALIZADO - agregarAlCarrito con validación de stock
  agregarAlCarrito(producto: Drinkinterface) {
    // VALIDAR STOCK para drinks (unidades)
    if (producto.cantidad_productos <= 0) {
      alert('❌ Producto agotado');
      return;
    }

    const cartItem: CartItem = {
      id: producto.id as number, // ✅ Asegurar que es number para el carrito
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 1
    };
    this.cartService.addToCart(cartItem);
  }

  // ✅ MÉTODO PARA MOSTRAR ESTADO OFFLINE EN TEMPLATE
  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }
}