import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { FoodService } from '../../core/service/foodService';
import { foodInterface } from '../../core/interface/foodInterface';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, CommonModule],
  templateUrl: './food.html',
  styleUrl: './food.css'
})
export class Food implements OnInit {
  saucer: foodInterface[] = [];
  loading: boolean = true;

  constructor(
    private foodService: FoodService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.foodService.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.foodService.saucer$.subscribe(data => {
      this.saucer = data;
    });
  }

  agregarAlCarrito(platillo: foodInterface) {
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
