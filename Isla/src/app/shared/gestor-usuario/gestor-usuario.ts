import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-gestor-usuario',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './gestor-usuario.html',
  styleUrl: './gestor-usuario.css'
})
export class GestorUsuario  implements OnInit {
  nombre: string = '';
  menuAbierto = false;
 ngOnInit() {
    const usuarioGuardado = localStorage.getItem('usuarioActivo');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      this.nombre = `${usuario.nombre} ${usuario.apellido}`;
    } else {
      this.nombre = 'Usuario no identificado';
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

}
