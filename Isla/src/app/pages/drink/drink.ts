import { Component, OnInit } from '@angular/core'; // ✅ importa OnInit
import { DrinkService } from '../../core/service/DrinkService';
import { Drinkinterface } from '../../core/interface/drink';
import { CartService, CartItem } from '../../core/interface/cart.services';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-drink',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, CommonModule],
  templateUrl: './drink.html',
  styleUrls: ['./drink.css']
})
export class Drink implements OnInit { // ✅ implementar OnInit
  saucer: Drinkinterface[] = [];

  constructor(
    private drinkService: DrinkService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.drinkService.saucer$.subscribe((data: Drinkinterface[]) => {
      console.log("Bebidas recibidas: ", data);
      this.saucer = data;
    });
  }

  agregarAlCarrito(bebida: Drinkinterface) {
    const cartItem: CartItem = {
      id: Date.now(),
      nombre: bebida.nombre,
      descripcion: bebida.descripcion,
      precio: bebida.precio,
      imagen: bebida.imagen,
      cantidad: 1
    };
    this.cartService.addToCart(cartItem);
    alert(`${bebida.nombre} agregado al carrito!`);
  }
}
