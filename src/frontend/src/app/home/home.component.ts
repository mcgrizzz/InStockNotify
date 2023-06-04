import { Component, OnInit} from '@angular/core';
import {interval} from "rxjs/internal/observable/interval";
import {startWith, switchMap} from "rxjs/operators";
import { ProductData } from '../product-data';
import { TrackerData } from '../tracker-data';
import { Tracker } from '../tracker';
import { DataService } from '../data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  pollingRate: number = 5000;

  activeProducts: ProductData[] = [];
  
  sortDir: number = 1;

  constructor(private dataService: DataService){}

  ngOnInit(): void {
    this.getActiveProducts();
  }

  sortProducts(): void {
    this.activeProducts = this.activeProducts.filter(product => { return product.priority > 0});
    this.activeProducts.sort((a, b) => {
      return a.name.localeCompare(b.name)*this.sortDir;
    });
  }

  //go through an update values, add if its new. Hopefully this can stop the weird updating in css
  updateActiveProducts(products: ProductData[]): void {
    for(let x = 0; x < products.length; x++){
      let updated = false;
      const product = products[x];
      for(let i = 0; i < this.activeProducts.length; i++){
        const storedProduct = this.activeProducts[i];
        if(product._id === storedProduct._id){
          //Update
          storedProduct.name = product.name;
          storedProduct.priority = product.priority;
          storedProduct.activeTrackers = product.activeTrackers;
          updated = true;
          break;
        }
      }

      if(!updated){
        //add
        this.activeProducts.push(product);
      }
      this.sortProducts();
    }
    
  }

  getActiveProducts(): void {
    interval(this.pollingRate)
      .pipe(
        startWith(0),
        switchMap(() => this.dataService.getActiveProducts())
      )
      .subscribe(res => this.updateActiveProducts(res));
  }

  isStocked(product: ProductData): boolean {
    for(let i = 0; i < product.activeTrackers.length; i++){
      const trackerData: TrackerData = product.activeTrackers[i];
      if(trackerData.stocked)return true;
    }
    return false;
  }

  //Return minimal purchasable price, if not return minimum price that is not zero
  getPrice(product: ProductData): number {
    let min: number = Number.MAX_SAFE_INTEGER;
    let minStocked: number = Number.MAX_SAFE_INTEGER;
    for(let i = 0; i < product.activeTrackers.length; i++){
      const trackerData: TrackerData = product.activeTrackers[i];
      if(trackerData.lastPrice <= 0)continue;
      if(trackerData.lastPrice < min){
        min = trackerData.lastPrice;
      }

      if(trackerData.stocked && trackerData.lastPrice < minStocked){
        minStocked = trackerData.lastPrice
      }
    
    }
    return (minStocked === Number.MAX_SAFE_INTEGER) ? min : minStocked;
  }

  getLastStocked(product: ProductData): Date {
    let lastStocked: Date = new Date(0);
    for(let i = 0; i < product.activeTrackers.length; i++){
      const trackerData: TrackerData = product.activeTrackers[i];
      const lastStockedTracker: Date = new Date(trackerData.lastStocked);
      if(lastStockedTracker > lastStocked){
        lastStocked = lastStockedTracker;
      }
    }
    return lastStocked;
  }

  getHostName(url: string): string {
    let domain = (new URL(url));
    return domain.hostname.replace("www.", "");
  }
}
