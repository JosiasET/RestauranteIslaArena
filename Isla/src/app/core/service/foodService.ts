// app/core/service/FoodService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { foodInterface } from '../interface/foodInterface';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = 'http://localhost:3000/platillos'; // 🔴 aquí debe apuntar al backend
  private saucerSource = new BehaviorSubject<foodInterface[]>([]);
  saucer$ = this.saucerSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarPlatillos();
  }

  cargarPlatillos() {
    this.http.get<foodInterface[]>(this.apiUrl).subscribe({
      next: (platillos) => this.saucerSource.next(platillos),
      error: (err) => console.error('❌ Error al cargar platillos:', err)
    });
  }
    eliminarPlatillo(platillo: foodInterface) {
    // pendiente: implementar delete en backend
  }

  actualizarPlatillo(platilloViejo: foodInterface, platilloNuevo: foodInterface) {
    // pendiente: implementar update en backend
  }

  agregarPlatillo(platillo: foodInterface) {
    this.http.post(this.apiUrl, platillo).subscribe({
      next: () => this.cargarPlatillos(),
      error: (err) => console.error('❌ Error al subir platillo:', err)
    });
  }
}
