// app/core/service/DrinkService.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Drinkinterface } from '../interface/drink';

@Injectable({
  providedIn: 'root'
})
export class DrinkService {
  private apiUrl = 'http://localhost:3000/bebidas'; // 👉 Backend
  private saucerSource = new BehaviorSubject<Drinkinterface[]>([]);
  saucer$ = this.saucerSource.asObservable();

  constructor(private http: HttpClient) {
    this.cargarBebidas();
  }

  cargarBebidas() {
    this.http.get<Drinkinterface[]>(this.apiUrl).subscribe({
      next: (bebidas) => this.saucerSource.next(bebidas),
      error: (err) => console.error('❌ Error al cargar bebidas:', err)
    });
  }

  agregarPlatillo(bebida: Drinkinterface) {
    this.http.post(this.apiUrl, bebida).subscribe({
      next: () => this.cargarBebidas(),
      error: (err) => console.error('❌ Error al subir bebida:', err)
    });
  }

  eliminarPlatillo(bebida: Drinkinterface) {
    // Luego agregamos DELETE en backend
  }

  actualizarPlatillo(bebidaVieja: Drinkinterface, bebidaNueva: Drinkinterface) {
    // Luego agregamos PUT en backend
  }
}
