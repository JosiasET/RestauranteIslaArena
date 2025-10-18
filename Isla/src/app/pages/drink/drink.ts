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