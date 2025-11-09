import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';

import { Router } from '@angular/router';
import { MeseroInterface } from '../../core/interface/waiter';
import { MeseroService } from '../../core/service/WaiterService';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
 
  usuario: string = '';
  password: string = '';
  isLoading: boolean = false;
  isOffline: boolean = false;

  constructor(
    private router: Router,
    private meseroService: MeseroService
  ) {}

  ngOnInit() {
    this.isOffline = !navigator.onLine;
    window.addEventListener('online', () => this.isOffline = false);
    window.addEventListener('offline', () => this.isOffline = true);
  }

  login() {
    if (!this.usuario || !this.password) {
      alert('Por favor, completa todos los campos');
      return;
    }

    this.isLoading = true;

    this.meseroService.loginMesero(this.usuario, this.password).subscribe({
      next: (mesero: MeseroInterface | null) => {
        this.isLoading = false;
        if (mesero) {
          console.log('✅ Login exitoso:', mesero);

          // Guardar datos en localStorage
          localStorage.setItem('usuarioActivo', JSON.stringify(mesero));

          if (this.isOffline) {
            alert(`📱 Bienvenido ${mesero.nombre} (modo offline)`);
          } else {
            alert(`✅ Bienvenido ${mesero.nombre}`);
          }

          // Redirigir al panel principal
          this.router.navigate(['/gestorU']);
        } else {
          alert('❌ Usuario o contraseña incorrectos');
        }
      },
      error: (error) => {
        console.error('❌ Error en login', error);
        this.isLoading = false;
        alert('Ocurrió un error al iniciar sesión');
      }
    });
  }
}