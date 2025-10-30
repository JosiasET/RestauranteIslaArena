import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StockService } from '../../core/service/Stock.service';

@Component({
  standalone: true,
  selector: 'app-gestoramd',
  imports: [CommonModule, RouterOutlet, FormsModule, RouterLink],
  templateUrl: './gestoramd.html',
  styleUrl: './gestoramd.css'
})
export class Gestoramd implements OnInit {
  currentRoute: string = '';
  
  // Datos para el dashboard
  contadores = {
    platillos: 25,
    bebidas: 18,
    especialidades: 12,
    reservas: 8,
    meseros: 6,
    ventas: 45,
    stock: 30
  };

  constructor(private router: Router) { }

  ngOnInit() {
    // Inicializar con la ruta actual
    this.currentRoute = this.router.url;
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        console.log('Ruta actual:', this.currentRoute); // Para debug
      });
  }

  // Ir al gestor principal (ruta vacía)
  irAlGestorPrincipal() {
    this.router.navigate(['/gestoramd']);
  }

  // Navegar a otras secciones
  navegarA(ruta: string) {
    this.router.navigate(['/gestoramd', ruta]);
  }

  // Mostrar dashboard solo en la ruta principal (/gestoramd)
  mostrarDashboardPrincipal(): boolean {
    const esRutaPrincipal = 
      this.currentRoute === '/gestoramd' || 
      this.currentRoute === '/gestoramd/' ||
      this.currentRoute === '/gestoramd' ||
      this.currentRoute.endsWith('/gestoramd');
    
    console.log('Mostrar dashboard:', esRutaPrincipal); // Para debug
    return esRutaPrincipal;
  }

  cerrarSesion() {
    this.router.navigate(['']);
  }
}