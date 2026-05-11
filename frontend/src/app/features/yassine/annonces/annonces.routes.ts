import { Routes } from '@angular/router';
import { ListingComponent } from './listing/listing.component';
import { DetailComponent } from './detail/detail.component';
import { CreateComponent } from './create/create.component';

export const ANNONCE_ROUTES: Routes = [
  {
    path: '',
    component: ListingComponent
  },
  { path: 'create',
    component: CreateComponent
  },
  {
    path: ':id',
    component: DetailComponent
  },
  {
  path: ':id/modifier',   
  component: CreateComponent
}
];
