// app/core/service/DrinkService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Drinkinterface } from '../interface/drink';

@Injectable({
  providedIn: 'root'
})
export class DrinkService {
  private apiUrl = 'http://localhost:3000/bebidas';
  private saucerSource = new BehaviorSubject<Drinkinterface[]>([]);
  saucer$ = this.saucerSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarBebidas();
  }

  /** 🔹 Obtener todas las bebidas */
  cargarBebidas() {
    this.http.get<Drinkinterface[]>(this.apiUrl).subscribe({
      next: (bebidas) => this.saucerSource.next(bebidas),
      error: (err) => console.error('❌ Error al cargar bebidas:', err)
    });
  }

  /** 🔹 Crear bebida */
  agregarPlatillo(bebida: Drinkinterface) {
    this.http.post(this.apiUrl, bebida).subscribe({
      next: () => this.cargarBebidas(),
      error: (err) => console.error('❌ Error al subir bebida:', err)
    });
  }

  /** 🔹 Eliminar bebida */
  eliminarPlatillo(bebida: Drinkinterface) {
    this.http.delete(`${this.apiUrl}/${bebida.id}`).subscribe({
      next: () => {
        console.log('✅ Bebida eliminada');
        this.cargarBebidas();
      },
      error: (err) => console.error('❌ Error al eliminar bebida:', err)
    });
  }

  /** 🔹 Actualizar bebida */
  actualizarPlatillo(bebidaVieja: Drinkinterface, bebidaNueva: Drinkinterface) {
    this.http.put(`${this.apiUrl}/${bebidaVieja.id}`, bebidaNueva).subscribe({
      next: () => {
        console.log('✅ Bebida actualizada');
        this.cargarBebidas();
      },
      error: (err) => console.error('❌ Error al actualizar bebida:', err)
    });
  }
}
