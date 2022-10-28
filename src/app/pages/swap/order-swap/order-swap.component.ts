import { ChangeDetectorRef, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams } from '@ionic/angular';
import { CountdownComponent } from 'ngx-countdown';
import { BwcErrorProvider, Coin, ConfigProvider, CurrencyProvider, ErrorsProvider, ExternalLinkProvider, OrderProvider } from 'src/app/providers';
import { CoinConfig } from '../config-swap';
import { Location } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TokenInfo } from '../model/order-model';

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
  listTxIdUserDeposit?: string[];
  listTxIdUserReceive?: string[];
  status?: string;
  isSentToFund?: boolean;
  isSentToUser?: boolean;
  endedOn?: Date;
  createdOn?: Date;
  error?: string;
  coinConfig?: CoinConfig;
  toTokenInfo?: TokenInfo;
  fromTokenInfo?: TokenInfo;
  note?: string;
  pendingReason?: string;
  lastModified?: Date;
  isResolve?: boolean;
}

@Component({
  selector: 'page-order-swap',
  templateUrl: './order-swap.component.html',
  styleUrls: ['./order-swap.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OrderSwapPage implements OnInit {
  navPramss: any;
  order: IOrder = null;
  orderId: string = '';
  coinSwap: CoinConfig = null;
  coinReceive: CoinConfig = null;
  minSwapAmount = 0;
  maxSwapAmount = 0;
  errorStr = '';
  public createdDateStr = '';
  public endedDateStr = '';
  blockexplorerUrl = '';
  labelStatusString = '';
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
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    if(this.navPramss.order){
      this.order = this.navPramss.order;
      this.orderId = this.order.id as string;
    }
    if(this.navPramss.orderId){
      this.orderId = this.navPramss.orderId;
      this.getOrderInfo();
    }

   }

  ngOnInit() {

  }

  getNameCoin(order: IOrder) {
    let nameCoin = '';
    if (order && order.isFromToken) {
      nameCoin = order.fromTokenInfo.name;
    } else {
      const coin = this.currencyProvider.getCoin(order.fromCoinCode.toUpperCase());
      nameCoin = this.currencyProvider.getCoinName(coin) || '';
    }
    return nameCoin;
  }

  back() {
    this.router.navigate(['/'], { replaceUrl: true });
  }

  getLabelStatus(order: IOrder) {
    if (order) {
      let label = '';
      switch (order.status) {
        case 'waiting':
          label = `Waiting for ${order.toCoinCode.toUpperCase()} payment`;
          break;
        case 'pending':
          label = `Order is pending for review`;
          break;
        case 'expired':
        label = `Order is expired`;
        break;
        case 'complete':
          label = `Order completed`;
          break;
        default:
          break;
      }
      this.labelStatusString = label;
      this._cdRef.markForCheck();
    } else{
      this.labelStatusString = '';
    }
  }

  handleEvent(event){
    if(event.action === 'done'){
      this.countdown.restart();
      this.getOrderInfo();
    }
  }

  getOrderInfo(){
    this.orderProvider.getOrderInfo(this.orderId).then((res: IOrder) => {
      this.order = res;
      this.coinReceive = this.order.coinConfig;
      this.maxSwapAmount = this.coinReceive.maxConvertToSat / this.order.toSatUnit / ( this.order.updatedRate || this.order.createdRate );
      this.minSwapAmount = this.coinReceive.minConvertToSat / this.order.toSatUnit / ( this.order.updatedRate || this.order.createdRate );
      this.createdDateStr = new Date(this.order.createdOn).toUTCString();
      this.endedDateStr = new Date(this.order.endedOn).toUTCString();
      this.getLabelStatus(this.order);
      this.getErrorStr(this.order);
      this._cdRef.markForCheck();
    }).catch(e => {
      this.showErrorInfoSheet(e);
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

      }
    );
  }
  public getErrorStr(order: IOrder){
    if(order){
      if(order.status !== 'complete' && order.error && order.error.length > 0){
        if(order.pendingReason === 'OUT_OF_FUND'){
          this.errorStr = 'This order need to be reviewed by admin';
        } else{
          this.errorStr = "Error: " + order.error;
        }
      }
      else{
        this.errorStr = '';
      }
    }
  }
  public viewOnBlockchain(coin, isToken, txId, network): void {
    let defaults = this.configProvider.getDefaults();
    const coinSelected = isToken ? 'xec' : coin;
    if(network === 'livenet')
    this.blockexplorerUrl = defaults.blockExplorerUrl[coinSelected];
    else
    this.blockexplorerUrl = defaults.blockExplorerUrlTestnet[coinSelected];
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
