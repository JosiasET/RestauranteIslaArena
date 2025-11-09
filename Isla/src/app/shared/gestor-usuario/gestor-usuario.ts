import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-gestor-usuario',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './gestor-usuario.html',
  styleUrl: './gestor-usuario.css'
})
export class GestorUsuario {

  nombre : string = 'EMIR RUBISSELL AKE CAB'
  menuAbierto = false;
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

}
