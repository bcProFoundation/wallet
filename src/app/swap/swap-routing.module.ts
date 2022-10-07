import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateSwapPage } from '../pages/swap/create-swap/create-swap.component';
import { OrderSwapPage } from '../pages/swap/order-swap/order-swap.component';

const routes: Routes = [
  {
    path: 'swap',
    children: [
      {
        path: 'create',
        component: CreateSwapPage
      },
      {
        path: 'order',
        component: OrderSwapPage
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class SwapPageRoutingModule {}
