import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { MeseroInterface } from '../interface/waiter';

@Injectable({
  providedIn: 'root'
})
export class MeseroService {
  private apiUrl = 'http://localhost:3000/mesero';
  private meserosSource = new BehaviorSubject<MeseroInterface[]>([]);
  meseros$ = this.meserosSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarMeseros();
  }

  /** 🔹 Obtener todos los meseros */
  cargarMeseros() {
    this.http.get<MeseroInterface[]>(this.apiUrl).subscribe({
      next: (meseros) => this.meserosSource.next(meseros),
      error: (err) => console.error('❌ Error al cargar meseros:', err)
    });
  }

  /** 🔹 Crear mesero */
  crearMesero(mesero: MeseroInterface) {
    this.http.post(this.apiUrl, mesero).subscribe({
      next: () => this.cargarMeseros(),
      error: (err) => console.error('❌ Error al crear mesero:', err)
    });
  }

  /** 🔹 Actualizar mesero */
  actualizarMesero(meseroViejo: MeseroInterface, meseroNuevo: MeseroInterface) {
    this.http.put(`${this.apiUrl}/${meseroViejo.id}`, meseroNuevo).subscribe({
      next: () => this.cargarMeseros(),
      error: (err) => console.error('❌ Error al actualizar mesero:', err)
    });
  }

  /** 🔹 Eliminar mesero */
  eliminarMesero(mesero: MeseroInterface) {
    this.http.delete(`${this.apiUrl}/${mesero.id}`).subscribe({
      next: () => this.cargarMeseros(),
      error: (err) => console.error('❌ Error al eliminar mesero:', err)
    });
  }

  /** 🔹 Activar/Desactivar mesero */
  toggleEstado(mesero: MeseroInterface) {
    const actualizado = { ...mesero, activo: !mesero.activo };
    this.actualizarMesero(mesero, actualizado);
  }
}
