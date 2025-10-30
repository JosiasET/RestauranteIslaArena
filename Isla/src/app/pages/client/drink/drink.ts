import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';


import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { DrinkService } from '../../../core/service/DrinkService';
import { CartItem, CartService } from '../../../core/interface/cart.services';
import { Drinkinterface } from '../../../core/interface/drink';

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

    // ✅ SUSCRIBIRSE AL BEHAVIORSUBJECT EN LUGAR DE HACER NUEVA PETICIÓN
    this.subscription.add(
      this.drinkService.saucer$.subscribe({
        next: (bebidas: Drinkinterface[]) => {
          console.log("🥤 Bebidas actualizadas desde BehaviorSubject:", bebidas.length);
          this.saucer = bebidas;
          this.isOffline = !navigator.onLine;
          this.loading = false;
          this.cdRef.detectChanges();
        },
        error: (error: any) => {
          console.error('❌ Error en BehaviorSubject:', error);
          this.loading = false;
          this.cdRef.detectChanges();
        }
      })
    );

    // ✅ SOLO CARGAR DESDE API SI NO HAY DATOS EN EL BEHAVIORSUBJECT
    this.subscription.add(
      this.drinkService.loading$.subscribe(loading => {
        if (!loading && this.drinkService['saucerSource'].getValue().length === 0) {
          console.log('🔄 No hay bebidas en cache, cargando desde API...');
          this.drinkService.cargarBebidas().subscribe();
        }
      })
    );
  }

  // ✅ MANTENER EL RESTO DE MÉTODOS SIN CAMBIOS
  agregarAlCarrito(producto: Drinkinterface) {
    if (producto.cantidad_productos <= 0) {
      alert('❌ Producto agotado');
      return;
    }

    const cartItem: CartItem = {
      id: producto.id as number,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 1
    };
    this.cartService.addToCart(cartItem);
  }

  getEstadoConexion(): string {
    return this.isOffline ? '📱 Modo offline' : '🌐 En línea';
  }

  // ✅ MÉTODO OPCIONAL PARA FORZAR RECARGA SI ES NECESARIO
  recargarBebidas() {
    console.log('🔄 Recargando bebidas manualmente...');
    this.loading = true;
    this.drinkService.cargarBebidas().subscribe();
  }
}