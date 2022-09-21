import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams } from '@ionic/angular';
import { CountdownComponent } from 'ngx-countdown';
import { BwcErrorProvider, ConfigProvider, ErrorsProvider, ExternalLinkProvider, OrderProvider } from 'src/app/providers';
import { CoinConfig, TokenInfo } from '../config-swap';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { runInThisContext } from 'vm';

interface IOrder {
  id: string | number;
  version: number;
  priority: number;
  fromCoinCode: string;
  fromTokenId?: string;
  amountFrom: number;
  fromSatUnit?: number;
  isFromToken?: boolean;
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
  listTxIdUserDeposit?: string[];
  listTxIdUserReceive?: string[];
  status?: string;
  isSentToFund?: boolean;
  isSentToUser?: boolean;
  endedOn?: number;
  createdOn?: number;
  error?: string;
  toTokenInfo? : TokenInfo;
  fromTokenInfo?: TokenInfo;
  coinConfig?: CoinConfig
}
@Component({
  selector: 'app-order-swap',
  templateUrl: './order-swap.component.html',
  styleUrls: ['./order-swap.component.scss'],
})
export class OrderSwapPage implements OnInit {
  navPramss: any;
  order: IOrder = null;
  orderId: string = '';
  coinSwap: CoinConfig = null;
  coinReceive: CoinConfig = null;
  minSwapAmount = 0;
  maxSwapAmount = 0;
  public dateStr = '';
  blockexplorerUrl = '';
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;
  constructor(    private router: Router,
    private navParams: NavParams,
    private orderProvider: OrderProvider,
    private location: Location,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private _cdRef: ChangeDetectorRef,
    private bwcErrorProvider: BwcErrorProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private configProvider: ConfigProvider) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    if(this.navPramss.orderId){
      this.orderId = this.navPramss.orderId;
    }
    this.getOrderInfo();
    // else(this.navPramss.orderId)
    // this.coinReceive = this.navPramss.coinReceive;
    // // this.coinSwap = this.navPramss.coinSwap;
    // this.maxSwapAmount = this.coinReceive.maxConvertToSat / this.order.toSatUnit;
    // this.minSwapAmount = this.coinReceive.minConvertToSat / this.order.toSatUnit;
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

  back() {
    this.router.navigate[''];
  }

  getOrderInfo(){
    this.orderProvider.getOrderInfo(this.orderId).then((res: IOrder) => {
      this.order = res;
      this.coinReceive = this.order.coinConfig;
      this.maxSwapAmount = this.coinReceive.maxConvertToSat / this.order.toSatUnit / ( this.order.updatedRate || this.order.createdRate );
      this.minSwapAmount = this.coinReceive.minConvertToSat / this.order.toSatUnit / ( this.order.updatedRate || this.order.createdRate );
      this.dateStr = new Date(this.order.createdOn).toUTCString();
      this._cdRef.markForCheck();
    }).catch(e => {

    })
  }

  public showErrorInfoSheet(
    error: any,
    title?: string,
    exit?: boolean
  ): void {
    let msg: string;
    if (!error) return;
    // Currently the paypro error is the following string: 500 - "{}"
    if (error.status === 500) {
      msg = error.error.error;
    }

    const infoSheetTitle = title ? title : this.translate.instant('Error');

    this.errorsProvider.showDefaultError(
      msg || this.bwcErrorProvider.msg(error),
      infoSheetTitle,
      () => {
        // if (exit) {
        //   this.location.back()
        // }
      }
    );
  }

  public viewOnBlockchain(coin, isToken, txId): void {
    let defaults = this.configProvider.getDefaults();
    const coinSelected = isToken ? 'xec' : coin;
    this.blockexplorerUrl = defaults.blockExplorerUrl[coinSelected];
    // let btx = this.btx;
    // const coin = btx.coin;
    const url = `https://${this.blockexplorerUrl}tx/${txId}`;
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Transaction');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
