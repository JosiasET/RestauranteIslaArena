import { Component, OnInit } from '@angular/core';
import { FishesService } from '../../core/service/FishesService';
import { Fish } from '../../core/interface/Fish';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fishes',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
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

  agregarAlCarrito(platillo: Fish) {
    const cartItem: CartItem = {
      id: Date.now(),
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio,
      imagen: platillo.imagen
    };
    this.cartService.addToCart(cartItem);
    alert(`${platillo.nombre} agregado al carrito!`);
  }
}
