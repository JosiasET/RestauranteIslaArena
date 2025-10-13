import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { foodInterface } from '../interface/foodInterface';

@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = 'http://localhost:3000/platillos';
  private saucerSource = new BehaviorSubject<foodInterface[]>([]);
  private loadingSource = new BehaviorSubject<boolean>(true);
  
  saucer$ = this.saucerSource.asObservable();
  loading$ = this.loadingSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarPlatillos();
  }

  cargarPlatillos() {
    this.loadingSource.next(true);

    this.http.get<foodInterface[]>(this.apiUrl).subscribe({
      next: (platillos) => {
        this.saucerSource.next(platillos);
        this.loadingSource.next(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar platillos:', err);
        this.saucerSource.next([]);
        this.loadingSource.next(false);
      }
    });
  }

  agregarPlatillo(platillo: foodInterface) {
    this.loadingSource.next(true);

    this.http.post<foodInterface>(this.apiUrl, platillo).subscribe({
      next: (nuevoPlatillo) => {
        const platillosActuales = this.saucerSource.getValue();
        this.saucerSource.next([...platillosActuales, nuevoPlatillo]);
        this.loadingSource.next(false);
      },
      error: (err) => {
        console.error('❌ Error al subir platillo:', err);
        this.loadingSource.next(false);
      }
    });
  }

  eliminarPlatillo(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        const nuevosPlatillos = this.saucerSource.getValue().filter(p => p.id !== id);
        this.saucerSource.next(nuevosPlatillos);
      },
      error: (err) => console.error('❌ Error al eliminar platillo:', err)
    });
  }

  actualizarPlatillo(platillo: foodInterface) {
    this.http.put<foodInterface>(`${this.apiUrl}/${platillo.id}`, platillo).subscribe({
      next: (actualizado) => {
        const nuevosPlatillos = this.saucerSource.getValue().map(p =>
          p.id === actualizado.id ? actualizado : p
        );
        this.saucerSource.next(nuevosPlatillos);
      },
      error: (err) => console.error('❌ Error al actualizar platillo:', err)
    });
  }
}
