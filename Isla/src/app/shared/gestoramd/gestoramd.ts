import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
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
    
    // INICIALIZAR DETECCIÓN RESPONSIVE
    this.checkScreenSize();
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        console.log('Ruta actual:', this.currentRoute); // Para debug
        
        // CERRAR MENÚ MÓVIL AL NAVEGAR
        this.closeMobileMenu();
      });
  }

  // Ir al gestor principal (ruta vacía)
  // NUEVO: Detectar cambios de tamaño de pantalla
  @HostListener('window:resize', [])
  onResize() {
    this.checkScreenSize();
  }

  // NUEVO: Verificar si está en móvil
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    
    // Si se cambia a desktop y el menú móvil está abierto, cerrarlo
    if (!this.isMobile && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  // NUEVO: Alternar menú móvil
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // NUEVO: Cerrar menú móvil
  closeMobileMenu() {
    if (this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  // Ir al gestor principal (ruta vacía) - ACTUALIZADA
  irAlGestorPrincipal() {
    this.closeMobileMenu();
    this.router.navigate(['/gestoramd']);
  }

  // Navegar a otras secciones - ACTUALIZADA
  navegarA(ruta: string) {
    this.closeMobileMenu();
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

  // Cerrar sesión - ACTUALIZADA
  cerrarSesion() {
    this.closeMobileMenu();
    this.router.navigate(['']);
  }
}