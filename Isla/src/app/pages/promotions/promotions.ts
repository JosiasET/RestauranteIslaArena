import { Component } from '@angular/core';
import { PromoService } from '../../core/service/PromoService';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { PromoInterface } from '../../core/interface/PromoInterface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotions.html',
  styleUrls: ['./promotions.css']
})
export class Promotions {
  saucer: PromoInterface[] = [];

  constructor(
    private promoService: PromoService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.promoService.saucer$.subscribe(data => {
      console.log("Promociones recibidas: ", data);
      this.saucer = data;
    });
  }

  agregarAlCarrito(platillo: PromoInterface) {
    const cartItem: CartItem = {
      id: Date.now(),
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio,
      imagen: platillo.imagen,
      cantidad: 1
    };

    this.cartService.addToCart(cartItem);
    alert(`${platillo.nombre} agregado al carrito!`);
  }
}
