import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ← Agregar Router
import { CartService, CartItem } from '../../core/interface/cart.services';

@Component({
  selector: 'app-checkoutpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkoutpage.html',
  styleUrls: ['./checkoutpage.css']
})
export class Checkoutpage implements OnInit {
  customerData = {
    email: '',
    phone: '',
    country: 'México',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    neighborhood: '',
    postalCode: '',
    city: '',
    state: 'Campeche',
    phoneNumber: '',
    newsletter: false,
    saveInfo: false
  };

  cartItems: CartItem[] = [];
  total: number = 0;
  isSubmitting: boolean = false;

  constructor(
    private cartService: CartService,
    private router: Router // ← Inyectar Router
  ) {}

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();
    this.total = this.cartService.getTotal();
  }

  placeOrder() {
    // Validar campos obligatorios
    if (!this.isFormValid()) {
      alert('Por favor completa todos los campos obligatorios marcados con *');
      return;
    }

    this.isSubmitting = true;

    // Simular procesamiento
    setTimeout(() => {
      console.log('Datos del cliente:', this.customerData);
      console.log('Productos en el carrito:', this.cartItems);
      
      // 1. Limpiar el carrito
      this.cartService.clearCart();
      
      // 2. Mostrar confirmación
      alert('¡Pedido realizado con éxito!');
      
      // 3. Redirigir a home
      this.router.navigate(['/Home']);
      
      this.isSubmitting = false;
    }, 1000);
  }

  // Validar formulario
  isFormValid(): boolean {
    const requiredFields = [
      this.customerData.email,
      this.customerData.firstName,
      this.customerData.lastName,
      this.customerData.address,
      this.customerData.neighborhood,
      this.customerData.postalCode,
      this.customerData.city,
      this.customerData.phoneNumber
    ];

    return requiredFields.every(field => field && field.trim() !== '');
  }

  // Verificar si hay productos en el carrito
  hasItems(): boolean {
    return this.cartItems.length > 0;
  }
}