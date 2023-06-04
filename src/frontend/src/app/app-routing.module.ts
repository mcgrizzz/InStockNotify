import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { TrackersComponent } from './trackers/trackers.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {path: 'manage-products', component: ProductsComponent},
  {path: 'manage-trackers', component: TrackersComponent},
  {path: 'dashboard', component: HomeComponent},
  {path: '**', redirectTo: '/dashboard'}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
