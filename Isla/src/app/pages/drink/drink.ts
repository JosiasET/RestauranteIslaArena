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

    // 🔥 FORZAR CARGA INICIAL - ESTO ES LO QUE FALTA
    this.drinkService.cargarBebidas().subscribe();

    this.subscription.add(
      this.drinkService.saucer$.subscribe((data: Drinkinterface[]) => {
        console.log("🥤 Bebidas recibidas:", data.length);
        this.saucer = data;
        this.loading = false;
        this.cdRef.detectChanges();
      })
    );
  }

  agregarAlCarrito(producto: any) {
    const cartItem: CartItem = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 1
    };
    this.cartService.addToCart(cartItem);
  }
}