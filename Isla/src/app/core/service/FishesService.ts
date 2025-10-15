// app/core/service/FishesService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Fish } from '../interface/Fish';

@Injectable({
  providedIn: 'root'
})
export class FishesService {
  private apiUrl = 'http://localhost:3000/especialidades';
  private saucerSource = new BehaviorSubject<Fish[]>([]);
  saucer$ = this.saucerSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarEspecialidades();
  }

  cargarEspecialidades() {
    this.http.get<Fish[]>(this.apiUrl).subscribe({
      next: (especialidades) => this.saucerSource.next(especialidades),
      error: (err) => console.error('❌ Error al cargar especialidades:', err)
    });
  }

  agregarPlatillo(especialidad: Fish) {
    this.http.post<Fish>(this.apiUrl, especialidad).subscribe({
      next: (nueva) => {
        const actuales = this.saucerSource.getValue();
        this.saucerSource.next([nueva, ...actuales]);
      },
      error: (err) => console.error('❌ Error al subir especialidad:', err)
    });
  }

  eliminarPlatillo(especialidad: Fish) {
    this.http.delete(`${this.apiUrl}/${especialidad.id}`).subscribe({
      next: () => {
        const nuevas = this.saucerSource.getValue().filter(p => p.id !== especialidad.id);
        this.saucerSource.next(nuevas);
      },
      error: (err) => console.error('❌ Error al eliminar especialidad:', err)
    });
  }

  actualizarPlatillo(especialidadVieja: Fish, especialidadNueva: Fish) {
    this.http.put<Fish>(`${this.apiUrl}/${especialidadVieja.id}`, especialidadNueva).subscribe({
      next: (actualizada) => {
        const nuevas = this.saucerSource.getValue().map(p =>
          p.id === actualizada.id ? actualizada : p
        );
        this.saucerSource.next(nuevas);
      },
      error: (err) => console.error('❌ Error al actualizar especialidad:', err)
    });
  }
}
