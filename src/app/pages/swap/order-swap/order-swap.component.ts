import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams } from '@ionic/angular';
import { CountdownComponent } from 'ngx-countdown';
import { OrderProvider } from 'src/app/providers';
interface IOrder {
  id: string | number;
  version: number;
  priority: number;
  fromCoinCode: string;
  fromTokenId?: string;
  amountFrom: number;
  fromSatUnit: number;
  isFromToken: boolean;
  toCoinCode: string;
  isToToken: boolean;
  toSatUnit: number;
  amountSentToUser: number;
  amountUserDeposit: number;
  createdRate: number;
  updatedRate: number;
  addressUserReceive: string;
  adddressUserDeposit: string;
  toTokenId?: string;
  txId?: string;
  status?: string;
  isSentToFund?: boolean;
  isSentToUser?: boolean;
  endedOn?: number;
  createdOn?: number;
  error?: string;
}
@Component({
  selector: 'app-order-swap',
  templateUrl: './order-swap.component.html',
  styleUrls: ['./order-swap.component.scss'],
})
export class OrderSwapPage implements OnInit {
  navPramss: any;
  order: IOrder = null;
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;
  constructor(    private router: Router,
    private navParams: NavParams,
    private orderProvider: OrderProvider) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.order = this.navPramss.order;
    
   }

  ngOnInit() {
    // setInterval(
    //   this.getOrderInfo(),
    // )
  }

  handleEvent(event){
    if(event.action === 'done'){
      this.countdown.restart();
      this.getOrderInfo();
    }
  }

  getOrderInfo(){
    this.orderProvider.getOrderInfo(this.order.id).then((res: IOrder) => {
      this.order = res;
    })
  }

}
