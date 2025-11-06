import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  constructor(private router: Router) { }
  correo: string = '';
  numero: string = '';
  password: string = '';
  visible: boolean = true;
  private passwordRegex: RegExp =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  // ✅ Expresión regular para validar formato de correo
  // Ejemplo válido: usuario@dominio.com
  private emailRegex: RegExp =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  toggleView() {
    this.visible = !this.visible;
  }

  regresarHome() {
    this.router.navigate(['/']); // Redirección al home
  }

  enviarCodigo() {
    console.log('Enviando código...');
  }

  campos() {
   
    if (!this.correo) {
      alert('Por favor, ingrese su correo electrónico');
      return;
    }
    if (!this.emailRegex.test(this.correo)) {
      alert('Por favor, ingrese un correo electrónico válido (ej: usuario@correo.com)');
      return;
    }

    if (!this.password) {
      alert('Por favor, ingrese su contraseña');
      return;
    }
    if (!this.passwordRegex.test(this.password)) {
      alert(
        'La contraseña debe tener al menos una mayúscula, un número, un carácter especial y mínimo 8 caracteres'
      );
      return;
    }

   
    alert('Formulario enviado correctamente');
  }
}