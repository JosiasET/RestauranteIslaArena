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
  usuario: string = '';
  numero: string = '';
  password: string = '';

  regresarHome() {
    
  }

  enviarCodigo() {
    console.log('Enviando código...');
  }

  login(){
 
    if(this.usuario == null && this.password== null ){
        alert('llene los campos')
    }else{
        this.router.navigate(['/gestorU']); 
    }
  }
}