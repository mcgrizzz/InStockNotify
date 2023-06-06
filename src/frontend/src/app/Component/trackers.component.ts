import { Component } from '@angular/core';
import { FormGroup, FormArray, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Tracker } from '@models/tracker';
import { Condition } from '@models/condition';
import { DataService } from '@services/data.service';
import UIKit from 'uikit';

@Component({
  selector: 'app-trackers',
  templateUrl: '../../assets/html/trackers.component.html'
})
export class TrackersComponent {

  trackers: Tracker[] = [];

  forms: FormGroup[] = [];
  trackerIndex: number = 0;

  constructor(private dataService: DataService, private fb: NonNullableFormBuilder){};

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    const observables = [this.dataService.getProducts(), this.dataService.getTrackers()];
    this.dataService.getTrackers()
      .subscribe((results) => {
        this.trackers = results;
        this.initiateFormControls();
      });
  }

  createConditionSubForm(tracker: Tracker, positiveConditions: boolean): FormArray {
    const conditions: FormArray = this.fb.array([]);

    const conditionArray = positiveConditions ? tracker.conditionsPositive : tracker.conditionsNegative;
    for(let i = 0; i < conditionArray.length; i++){

      conditions.push(this.fb.group({
        selector: conditionArray[i].selector,
        value: conditionArray[i].value
      }));
    }

    return conditions;
  }

  createTrackerForm(tracker: Tracker): FormGroup {
    const trackerForm = this.fb.group({
      name: [tracker.name, Validators.required],
      rateLimit: [tracker.rateLimit ?? 60, Validators.required],
      priceSelector: [tracker.priceSelector, Validators.required],
      conditionsPositive: this.createConditionSubForm(tracker, true),
      conditionsNegative: this.createConditionSubForm(tracker, false)
    });

    this.trackerIndex = this.forms.length - 1;
    
    return trackerForm;
  }

  initiateFormControls(): void {
    for(let i = 0; i < this.trackers.length; i++){
      const tracker: Tracker = this.trackers[i];
      const trackerForm = this.createTrackerForm(tracker);
      this.forms.push(trackerForm);
    }
  }

  createNewTracker(): void {
    this.dataService.createNewTracker().subscribe({
      next: (x) => {
        UIKit.notification({message: "New Tracker created.", pos: 'top-right', status: 'success'}, );
        const newTracker = x;
        this.trackers.push(newTracker);
        const trackerForm = this.createTrackerForm(newTracker);
        this.forms.push(trackerForm);
        this.dataService.updateSubscribers();
      },

      error: (err) => {
        console.log(err);
        UIKit.notification({message: ("Error: " + err.error.message), pos: 'top-right', status: 'danger'}, );
      }
    });
  }

  saveChanges(): void {
    const tracker = this.trackers[this.trackerIndex];

    tracker.name = this.activeForm.get('name')?.getRawValue();
    tracker.priceSelector = this.activeForm.get('priceSelector')?.getRawValue();
    tracker.rateLimit = this.activeForm.get('rateLimit')?.getRawValue() as number;

    let positive: Condition[] = [];
    let negative: Condition[] = [];
    
    for(let i = 0; i < this.conditionsPositive.length; i++){
      const condition: FormGroup = this.conditionsPositive.at(i) as FormGroup;
      const selector: string = condition.get("selector")?.getRawValue();
      const value: string = condition.get("value")?.getRawValue();
      const conditionObj: Condition = {selector, value};
      positive.push(conditionObj);
    }

    for(let i = 0; i < this.conditionsNegative.length; i++){
      const condition: FormGroup = this.conditionsNegative.at(i) as FormGroup;
      const selector: string = condition.get("selector")?.getRawValue();
      const value: string = condition.get("value")?.getRawValue();
      const conditionObj: Condition = {selector, value};
      negative.push(conditionObj);
    }


    tracker.conditionsPositive = positive;
    tracker.conditionsNegative = negative;

    //Send new productData to update
    this.dataService.updateTracker(tracker).subscribe({
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

    const tracker = this.trackers[this.trackerIndex];

    const newConditionsPostive: FormArray = this.createConditionSubForm(tracker, true);
    const newConditionsNegative: FormArray = this.createConditionSubForm(tracker, false);

    const activePositive: FormArray = this.activeForm.get('conditionsPositive') as FormArray;
    const activeNegative: FormArray = this.activeForm.get('conditionsNegative') as FormArray;

    activePositive.clear();
    activeNegative.clear();
    
    for(let i = 0; activePositive.length < newConditionsPostive.length; i++){
      activePositive.push(newConditionsPostive.at(i));
    }

    for(let i = 0; activeNegative.length < newConditionsNegative.length; i++){
      activeNegative.push(newConditionsNegative.at(i));
    }
  }

  addNewCondition(isPositive: boolean): void {
    const conditions = isPositive ? this.conditionsPositive : this.conditionsNegative;
    conditions.push(this.fb.group({
      selector: "xPath selector",
      value: "Value"
    }));

    this.activeForm.markAsDirty();
  }

  removeCondition(index: number, isPositive: boolean): void {
    const conditions = isPositive ? this.conditionsPositive : this.conditionsNegative;
    conditions.removeAt(index);
    this.activeForm.markAsDirty();
  }

  get activeForm() { 
    return this.forms[this.trackerIndex];
  }

  get conditionsPositive() {
    return this.activeForm!.get('conditionsPositive') as FormArray;
  }

  get conditionsNegative() {
    return this.activeForm!.get('conditionsNegative') as FormArray;
  }

  toggleFormSwitch(i: number): void {
    this.trackerIndex = i;
  }

}
