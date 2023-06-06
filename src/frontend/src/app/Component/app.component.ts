import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductData } from '@models/product-data';
import { Tracker } from '@models/tracker';
import { DataService } from '@services/data.service';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: '../../assets/html/app.component.html',
  styleUrls: ['../../styles/app.component.scss']
})
export class AppComponent {

  constructor(public router: Router, private dataService: DataService) { 
    dataService.subscribeUpdates(() => {
      this.getData();
    });
  };

  title = 'stock-notify';
  
  products: number = 0;
  trackers: number = 0;

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    const observables = [this.dataService.getProducts(), this.dataService.getTrackers()];
    forkJoin(observables)
      .subscribe((results) => {
        this.products = (results[0] as ProductData[]).length;
        this.trackers = (results[1] as Tracker[]).length; //Used just for validation/selection
      });
  }
}
