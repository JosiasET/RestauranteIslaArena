import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
    console.log('🔄 Ruta inicial:', this.currentRoute);
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
        console.log('📍 Ruta cambiada:', this.currentRoute);
      });
  }

  // Mostrar dashboard solo en rutas específicas del dashboard
  mostrarDashboardPrincipal(): boolean {
    if (!this.currentRoute) return true;
    
    const rutaLimpia = this.currentRoute.split('?')[0].replace(/\/+$/, '');
    
    // Mostrar dashboard SOLO en estas rutas:
    const rutasDashboard = [
      '/gestoramd',
      '/gestoramd/',
      '/gestoramd/dashboard'
    ];
    
    const mostrar = rutasDashboard.includes(rutaLimpia);
    console.log('📊 Mostrar dashboard:', mostrar, '- Ruta:', rutaLimpia);
    
    return mostrar;
  }

  // Navegar al dashboard principal
  irAlGestorPrincipal() {
    console.log('🏠 Navegando al dashboard principal');
    this.router.navigate(['/gestoramd/dashboard']);
  }

  // Navegar a otras secciones
  navegarA(ruta: string) {
    console.log('🚀 Navegando a:', ruta);
    this.router.navigate(['/gestoramd', ruta]);
  }

  cerrarSesion() {
    this.router.navigate(['']);
  }
}