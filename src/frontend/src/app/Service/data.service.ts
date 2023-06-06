import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '@environments/environment';

import { ProductData } from '@models/product-data';
import { Tracker } from '@models/tracker';
import { ServerResponse } from '@models/server-response';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  
  private apiUrl;
  private productsUrl;
  private trackersUrl;

  private subscribers: Function[] = [];

  constructor(private http: HttpClient) {
    if(!environment.production){
      this.apiUrl = environment.baseUrl;
    }else if(environment.baseUrl && environment.baseUrl != ''){
      this.apiUrl = environment.baseUrl + "/api";
    }else{
      this.apiUrl = location.protocol + '//' + location.host + "/api";
    }

    this.productsUrl = this.apiUrl + "/products";
    this.trackersUrl = this.apiUrl + "/trackers";
   }

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
    const obs: Observable<ProductData> = this.http.post<ProductData>(this.productsUrl, {});
    return obs;
  }

  createNewTracker(): Observable<Tracker> {
    const obs: Observable<Tracker> = this.http.post<Tracker>(this.trackersUrl, {});
    return obs;
  }

  updateProduct(product: ProductData): Observable<ProductData> {
    const obs: Observable<ProductData> = this.http.put<ProductData>(this.productsUrl + "/" + product._id, product);
    return obs;
  }

  updateTracker(tracker: Tracker): Observable<Tracker> {
    const obs: Observable<Tracker> = this.http.put<Tracker>(this.trackersUrl + "/" + tracker._id, tracker);
    return obs;
  }

  updateSubscribers(): void {
    for(let i = 0; i < this.subscribers.length; i++){
      const fn: Function = this.subscribers[i];
      fn();
    }
  }

  subscribeUpdates(callback: Function): void {
    this.subscribers.push(callback);
  }

}
