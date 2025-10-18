import { Component, OnInit } from '@angular/core';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fishes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fishes.html',
  styleUrls: ['./fishes.css']
})
export class Fishes implements OnInit {
  saucer: Fish[] = [];

  constructor(
    private fishesService: FishesService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.fishesService.saucer$.subscribe((data: Fish[]) => {
      console.log("🐟 Mariscos recibidos:", data);
      this.saucer = data;
    });
  }

  agregarAlCarrito(producto: any) {
  const cartItem: CartItem = {
    id: producto.id, // ← USAR EL ID REAL DEL PRODUCTO, no Date.now()
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    imagen: producto.imagen,
    cantidad: 1
  };

  this.cartService.addToCart(cartItem);
}
}
