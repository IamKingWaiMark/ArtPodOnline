import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PodComponent } from './pages/pod/pod.component';

const routes: Routes = [
  {path: "", component: PodComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
