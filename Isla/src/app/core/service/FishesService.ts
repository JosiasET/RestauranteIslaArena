// app/core/service/FishesService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Fish } from '../interface/Fish';

@Injectable({
  providedIn: 'root'
})
export class FishesService {
  private apiUrl = 'http://localhost:3000/especialidades'; // 🔹 Apunta al backend
  private saucerSource = new BehaviorSubject<Fish[]>([]);
  saucer$ = this.saucerSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarEspecialidades();
  }

  // 📥 Cargar especialidades desde backend
  cargarEspecialidades() {
    this.http.get<Fish[]>(this.apiUrl).subscribe({
      next: (especialidades) => this.saucerSource.next(especialidades),
      error: (err) => console.error('❌ Error al cargar especialidades:', err)
    });
  }

  // ➕ Agregar especialidad
  agregarPlatillo(especialidad: Fish) {
    this.http.post(this.apiUrl, especialidad).subscribe({
      next: () => this.cargarEspecialidades(),
      error: (err) => console.error('❌ Error al subir especialidad:', err)
    });
  }

  // 🗑️ Eliminar especialidad
  eliminarPlatillo(especialidad: Fish) {
    this.http.delete(`${this.apiUrl}/${especialidad.id}`).subscribe({
      next: () => this.cargarEspecialidades(),
      error: (err) => console.error('❌ Error al eliminar especialidad:', err)
    });
  }

  // ✏️ Actualizar especialidad
  actualizarPlatillo(especialidadVieja: Fish, especialidadNueva: Fish) {
    this.http.put(`${this.apiUrl}/${especialidadVieja.id}`, especialidadNueva).subscribe({
      next: () => this.cargarEspecialidades(),
      error: (err) => console.error('❌ Error al actualizar especialidad:', err)
    });
  }
}
