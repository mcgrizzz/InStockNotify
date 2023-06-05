import { Component } from '@angular/core';
import { FormGroup, FormArray, NonNullableFormBuilder, Validators } from '@angular/forms';
import UIKit from 'uikit';

import { ProductData } from '@models/product-data';
import { TrackerData } from '@models/tracker-data';
import { Tracker } from '@models/tracker';
import { DataService } from '@services/data.service';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-products',
  templateUrl: '../../assets/html/products.component.html'
})
export class ProductsComponent {

  products: ProductData[] = [];
  trackers: Tracker[] = [];

  forms: FormGroup[] = [];

  formIndex: number = 0;

  constructor(private dataService: DataService, private fb: NonNullableFormBuilder){};

  ngOnInit(): void {
    this.getData();
  }

  generateTrackerSubForm(product: ProductData): FormArray {
    const activeTrackers: FormArray = this.fb.array([]);

    for(let b = 0; b < product.activeTrackers.length; b++){
      const trackerData: TrackerData = product.activeTrackers[b];
      const tracker: Tracker = trackerData.tracker;
      const trackerForm = this.fb.group({
        tracker: [tracker.name, Validators.required], //Select from list of names of trackers (Tracker Name)
        url: [trackerData.url], //Tracker Url
      });
      trackerForm.controls.tracker.setValue(tracker.name);
      activeTrackers.push(trackerForm);
    }

    return activeTrackers;
  }

  createProductForm(product: ProductData): FormGroup {

    const activeTrackers = this.generateTrackerSubForm(product);

    const productForm = this.fb.group({
      name: [product.name, Validators.required], //Item Name
      priority: [product.priority, Validators.required], //Item Refresh Rate
      activeTrackers: activeTrackers //All the trackers attached to the item
    });

    this.formIndex = this.forms.length - 1;
    
    return productForm;
  }

  initiateFormControls(): void {
    for(let i = 0; i < this.products.length; i++){
      const product: ProductData = this.products[i];
      const productForm = this.createProductForm(product);
      this.forms.push(productForm);
    }
  }

  getData(): void {
    const observables = [this.dataService.getProducts(), this.dataService.getTrackers()];
    forkJoin(observables)
      .subscribe((results) => {
        this.products = results[0] as ProductData[];
        this.trackers = results[1] as Tracker[]; //Used just for validation/selection
        this.initiateFormControls();
      });
  }

  createNewProduct(): void {
    this.dataService.createNewProduct().subscribe({
      next: (x) => {
        UIKit.notification({message: "New Product created.", pos: 'top-right', status: 'success'}, );
        const newProduct = x;
        this.products.push(newProduct);
        const productForm = this.createProductForm(newProduct);
        this.forms.push(productForm);
      },

      error: (err) => {
        console.log(err);
        UIKit.notification({message: ("Error: " + err.error.message), pos: 'top-right', status: 'danger'}, );
      }
    });
  }

  addNewTracker(): void {
    const activeTrackers = this.activeTrackers;
    activeTrackers.push(this.fb.group({
      tracker: [this.getAllTrackers()[0], Validators.required], 
      url: [''], //Tracker Url
    }));
    this.activeForm.markAsDirty();
  }

  removeTracker(index: number): void {
    this.activeTrackers.removeAt(index);
    this.activeForm.markAsDirty();
  }

  saveChanges(): void {
    console.log("Updating...");

    //Update actual ProductData
    const product = this.products[this.formIndex];
    const oldActiveTrackers: TrackerData[] = [...product.activeTrackers];

    product.name = this.activeForm.get('name')?.getRawValue();
    product.priority = this.activeForm.get('priority')?.getRawValue();
    product.activeTrackers = [];
    for(let i = 0; i < this.activeTrackers.length; i++){
      const formGroup: FormGroup = this.activeTrackers.at(i) as FormGroup;
      

      const trackerName = formGroup.get('tracker')?.getRawValue();
      const tracker: Tracker = this.trackers.find(x => x.name === trackerName) as Tracker;
      const oldTrackerData: TrackerData | undefined = oldActiveTrackers.find(x => x.tracker.name === trackerName) as TrackerData;

      const trackerData: TrackerData = {
        _id: '',
        stocked: oldTrackerData ? oldTrackerData.stocked : false,
        lastStocked: oldTrackerData ? oldTrackerData.lastStocked : new Date(0),
        lastPrice: oldTrackerData ? oldTrackerData.lastPrice : 0,
        url: formGroup.get('url')?.getRawValue(),
        tracker: tracker
      };

      product.activeTrackers.push(trackerData);
    }

    
    

    //Send new productData to update
    this.dataService.updateProduct(product).subscribe({
      next: (x) => {
        UIKit.notification({message: "Saved Changes", pos: 'top-right', status: 'success'}, );
        this.activeForm.markAsPristine();
      },
      
      error: (err) => {
        console.log(err);
        UIKit.notification({message: ("Error: " + err.error.message), pos: 'top-right', status: 'danger'}, );
      }
    }); 
    
  }

  discardChanges(): void {

    this.activeForm.reset();

    const product = this.products[this.formIndex];

    const newActiveTrackers: FormArray = this.generateTrackerSubForm(product);

    const activeTrackers: FormArray = this.activeForm.get('activeTrackers') as FormArray;
    
    activeTrackers.clear();
    
    for(let i = 0; activeTrackers.length < newActiveTrackers.length; i++){
      activeTrackers.push(newActiveTrackers.at(i));
    }
    
  }

  //Cannot get default value to work. This is used to manually set it 
  getSelectedTracker(i: number, b: number): string {
    return this.products[i].activeTrackers[b].tracker.name;
  }

  getAllTrackers(): string[] {
    const tracks = this.trackers.map(x => x.name);
    return tracks;
  }
 
  get activeForm() { 
    return this.forms[this.formIndex];
  }

  get activeTrackers() {
    return this.activeForm!.get('activeTrackers') as FormArray;
  }

  isArchived(product: ProductData): Boolean {
    return product.priority <= 0;
  }

  toggleFormSwitch(i: number): void {
    this.formIndex = i;
  }
}
