import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderTracking {
  id?: number;
  tracking_code: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  order_items: any[];
  total_amount?: number;
  status: string;
  order_date: string;
  status_updated_at: string;
  payment_verified: boolean;
  payment_method?: string;
  payment_reference?: string;
  delivery_address?: {
    address: string;
    neighborhood: string;
    postal_code: string;
    city: string;
    state: string;
    references?: string;
    cashAmount?: number;  // ✅ AGREGAR ESTO
  };
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiUrl = 'http://localhost:3000/tracking';

  constructor(private http: HttpClient) { }

  // Cliente
  getOrderByCode(code: string): Observable<OrderTracking> {
    return this.http.get<OrderTracking>(`${this.apiUrl}/${code}`);
  }

  // Admin
  getAllOrders(): Observable<OrderTracking[]> {
    return this.http.get<OrderTracking[]>(this.apiUrl);
  }

  // ✅ NUEVOS MÉTODOS PARA ADMIN
  updateOrderStatus(id: number, status: string, payment_verified: boolean): Observable<OrderTracking> {
    return this.http.put<OrderTracking>(`${this.apiUrl}/${id}/status`, {
      status,
      payment_verified
    });
  }

  updatePaymentStatus(id: number, payment_verified: boolean): Observable<OrderTracking> {
    return this.http.put<OrderTracking>(`${this.apiUrl}/${id}/payment`, {
      payment_verified
    });
  }
}