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
  olvideContrasena = false;
  correo: string = '';
  contrasena: string = '';
  mostrarPassword: boolean = false; // Nueva variable para mostrar/ocultar contraseña
  mostrarRecuperar: boolean = false;
  
  regresarHome() {
    this.router.navigate(['/']); // Esto te llevará a la página principal
  }

  acept(){
    if(this.correo=='' || this.contrasena==''){
      alert('Por favor llene todos los campos');
    }else{
      alert('Registro exitoso');
      this.router.navigate(['gestoramd']);
    }
  }

  toggleRecuperar() {
    this.mostrarRecuperar = !this.mostrarRecuperar;
  }

  // Nueva función para mostrar/ocultar contraseña
  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  ingresar() {
    console.log('Ingresando con', this.correo, this.contrasena);
  }

  enviarCodigo() {
    console.log('Enviando código...');
  }
}