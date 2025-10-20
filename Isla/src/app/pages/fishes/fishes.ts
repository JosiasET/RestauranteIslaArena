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
  loading: boolean = true;

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

    // 🔥 FORZAR CARGA INICIAL - ESTO ES LO QUE FALTA
    this.fishesService.cargarEspecialidades().subscribe();

    this.subscription.add(
      this.fishesService.saucer$.subscribe((data: Fish[]) => {
        console.log("🐟 Especialidades recibidas:", data.length);
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