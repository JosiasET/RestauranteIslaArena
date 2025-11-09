import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
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
  isMobile = false;
  mobileMenuOpen = false;
  
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
    
    // Inicializar detección de tamaño de pantalla
    this.checkScreenSize();
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
        console.log('📍 Ruta cambiada:', this.currentRoute);
        
        // Cerrar menú móvil al navegar
        this.closeMobileMenu();
      });
  }

  // Detectar cambios de tamaño de pantalla
  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  // Verificar si está en móvil
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    
    // Si se cambia a desktop y el menú móvil está abierto, cerrarlo
    if (!this.isMobile && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  // Alternar menú móvil
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // Cerrar menú móvil
  closeMobileMenu() {
    if (this.isMobile) {
      this.mobileMenuOpen = false;
    }
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
    this.closeMobileMenu();
    this.router.navigate(['/gestoramd/dashboard']);
  }

  // Navegar a otras secciones
  navegarA(ruta: string) {
    console.log('🚀 Navegando a:', ruta);
    this.closeMobileMenu();
    this.router.navigate(['/gestoramd', ruta]);
  }

  cerrarSesion() {
    this.closeMobileMenu();
    this.router.navigate(['']);
  }
}