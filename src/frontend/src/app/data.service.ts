import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from './../environments/environment';

import { ProductData } from './product-data';
import { Tracker } from './tracker';
import { ServerResponse } from './server-response';

@Injectable({
  providedIn: 'root'
})

export class DataService {

  private apiUrl = environment.apiURL;

  private productsUrl = this.apiUrl + "/products";
  private trackersUrl = this.apiUrl + "/trackers";

  constructor(private http: HttpClient) { }

  getActiveProducts(): Observable<ProductData[]> {
    return this.http.get<ProductData[]>(this.productsUrl);
  }

  //will eventually be changed to include archived and non-archived, for editing settings
  getProducts(): Observable<ProductData[]> {
    return this.http.get<ProductData[]>(this.productsUrl);
  }

  getTrackers(): Observable<Tracker[]> {
    return this.http.get<Tracker[]>(this.trackersUrl);
  }

  createNewProduct(): Observable<ProductData> {
    return this.http.post<ProductData>(this.productsUrl, {});
  }

  createNewTracker(): Observable<Tracker> {
    return this.http.post<Tracker>(this.trackersUrl, {});
  }

  updateProduct(product: ProductData): Observable<ProductData> {
    return this.http.put<ProductData>(this.productsUrl + "/" + product._id, product);
  }

  updateTracker(tracker: Tracker): Observable<Tracker> {
    return this.http.put<Tracker>(this.trackersUrl + "/" + tracker._id, tracker);
  }

  
}
