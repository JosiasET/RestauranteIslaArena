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


  private emailRegex: RegExp =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private  number: RegExp =
    /^\+?[1-9]\d{6,14}$/;

  toggleView() {
    this.visible = !this.visible;
  }

  regresarHome() {
    
  }

  enviarCodigo() {
    console.log('Enviando código...');
  }

  login(){
 
    if(this.correo == null && this.password== null ){
        alert('llene los campos')
    }else{
        this.router.navigate(['/gestorU']); 
    }
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

    if(!this.number.test(this.numero)){
      alert ('ingrese un numero de telefono valido')
    }

   
    alert('Formulario enviado correctamente');

  

  }
}