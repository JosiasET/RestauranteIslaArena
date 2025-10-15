import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SaleDataService {
  private saleDataSubject = new BehaviorSubject<any>(null);
  public saleData$ = this.saleDataSubject.asObservable();

  setSaleData(data: any) {
    this.saleDataSubject.next(data);
  }

  getSaleData() {
    return this.saleDataSubject.value;
  }

  clearSaleData() {
    this.saleDataSubject.next(null);
  }
}