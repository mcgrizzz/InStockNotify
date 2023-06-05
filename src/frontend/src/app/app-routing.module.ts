import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsComponent } from '@components/products.component';
import { TrackersComponent } from '@components/trackers.component';
import { HomeComponent } from '@components/home.component';

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
