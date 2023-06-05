import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: '../../assets/html/app.component.html',
  styleUrls: ['../../styles/app.component.scss']
})
export class AppComponent {

  constructor(public router: Router) { };

  title = 'stock-notify';
}
