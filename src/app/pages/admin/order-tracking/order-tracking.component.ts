import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit
} from '@angular/core';
import { TokenInfo } from 'src/app/models/tokens/tokens.model';
import {
  BwcErrorProvider,
  Coin,
  CurrencyProvider,
  ErrorsProvider,
  OnGoingProcessProvider,
  OrderProvider
} from 'src/app/providers';
import { CoinConfig } from '../../swap/config-swap';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogCustomComponent } from '../modal/modal.component';
import { TranslateService } from '@ngx-translate/core';
import { Sort } from '@angular/material/sort';
import jwt_decode from 'jwt-decode';
import { AuthenticationService } from '../service/authentication.service';
import { PassWordHandleCases } from '../create-password/create-password.component';
import { Router } from '@angular/router';

import * as moment from 'moment';
import _, { StringNullableChain } from 'lodash';
import { LabelTip } from 'src/app/components/label-tip/label-tip';

export interface PeriodicElement {
  name: string;
  position: number;
  weight?: number;
  symbol: string;
}

export interface OrderReturnOpts {
  listOrderInfo: IOrder[];
  count: number;
}

export interface ICoinConfigFilter {
  fromDate?: Date;
  toDate?: Date;
  fromCoinCode?: string;
  toCoinCode?: string;
  status?: string;
  fromNetwork?: string;
  toNetwork?: string;
}

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
  endedOn?: Date;
  createdOn?: Date;
  error?: string;
  toTokenInfo?: TokenInfo;
  fromTokenInfo?: TokenInfo;
  coinConfig?: CoinConfig;
  lastModified?: Date;
}

interface IOrderCustom {
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
  endedOn?: Date;
  createdOn?: Date;
  error?: string;
  toTokenInfo?: TokenInfo;
  fromTokenInfo?: TokenInfo;
  coinConfig?: CoinConfig;
  lastModified?: Date;
}

enum CoinFilterDate {
  DAY,
  WEEK,
  MONTH
}

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit, AfterViewInit {
  dateSelected = null;
  optsCoinConfigFilter: ICoinConfigFilter = null;
  listCoinFilterDate = [
    {
      label: 'All',
      value: null
    },
    {
      label: 'today',
      value: CoinFilterDate.DAY
    },
    {
      label: 'this week',
      value: CoinFilterDate.WEEK
    },
    {
      label: 'this month',
      value: CoinFilterDate.MONTH
    }
  ];
  displayedColumns: string[] = [
    'id',
    'swapPairCode',
    'rate',
    'pendingReason',
    'status',
    'lastModified',
    'action'
  ];
  listStatus =[
    {
      label: 'All',
      value: null
    },
    {
      label: 'Complete',
      value: 'complete'
    },
    {
      label: 'Pending',
      value: 'pending'
    },
    {
      label: 'Waiting',
      value: 'waiting'
    },
    {
      label: 'Expired',
      value: 'expired'
    }
  ];
  status = null;
  listCoinSwap = [];
  listCoinReceive = [];
  dataSource: any;
  length = 100;
  pageSize = 10;
  isLoggedin: boolean = true;
  pageSizeOptions: number[] = [5, 10, 25, 100];
  // MatPaginator Output
  pageEvent: PageEvent;
  sortedData: IOrder[];
  // Date = new this.Date()
  fromCoin : {
    label: string,
    value: CoinConfig
  };
  toCoin : {
    label: string,
    value: CoinConfig
  };
  listCoinConfig : {
    label: string,
    value: CoinConfig
  }[] = [];
  constructor(
    private orderProvider: OrderProvider,
    private _cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private ngZone: NgZone,
    private authenticationService: AuthenticationService,
    private router: Router,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private currencyProvider: CurrencyProvider
  ) {
    this.dateSelected = this.listCoinFilterDate[0];
    this.status = this.listStatus[0];
    this.getAllOrderInfo();

    window['handleCredentialResponse'] = user =>
      ngZone.run(() => {
        this.afterSignInUser(user);
      });
  }
  ngAfterViewInit(): void {}
  redirectForgotPasswordPage() {
    this.router.navigate(['/dashboard/create-password'], {
      state: {
        passwordHandleCases: PassWordHandleCases.ForgotPassword
      }
    });
  }

  redirectImportSeedPage() {
    this.router.navigate(['/import-seed']);
  }
  afterSignInUser(user) {
    const userDecoded = jwt_decode(user.credential);
    this.orderProvider
      .login({ id_token: user.credential })
      .then(approve => {
        if (approve) {
          this.authenticationService.login(user.credential);
        }
      })
      .catch(e => {
        this.showErrorInfoSheet(e);
      });
    //  console.log(userDecoded);
  }
  ngOnInit() {
    this.orderProvider
      .getCoinConfigList()
      .then((listCoinConfig: CoinConfig[]) => {
        if (listCoinConfig && listCoinConfig.length > 0) {
          this.listCoinConfig = listCoinConfig.map(coinConfig => { 
            return{
              label: coinConfig.code.toUpperCase()  + ( coinConfig.network === 'testnet' ? ' ( Testnet )' : ''),
              value: coinConfig
            }
          });
          this.listCoinConfig = [
            {
              label: 'All',
              value: null
            },
            ...this.listCoinConfig
          ]
          this.toCoin = this.listCoinConfig[0];
          this.fromCoin = this.listCoinConfig[0];
          // this.listCoinSwap = listCoinConfig
          //   .map(s => {
          //     if (s.isSwap) {
          //       return {
          //         label: this.getCoinName(s),
          //         value: s.code
          //       };
          //     } else {
          //       return null;
          //     }
          //   })
          //   .filter(coin => coin !== null);
          // this.listCoinSwap = [{label: 'All', value: null}, ...this.listCoinSwap];
          // this.fromCoin = this.listCoinSwap[0];
          // this.listCoinReceive = listCoinConfig
          //   .map(s => {
          //     if (s.isReceive) {
          //       return {
          //         label: this.getCoinName(s),
          //         value: s.code
          //       };
          //     } else {
          //       return null;
          //     }
          //   })
          //   .filter(coin => coin !== null);
          // this.listCoinReceive = [{label: 'All', value: null}, ...this.listCoinReceive];
          // this.toCoin = this.listCoinReceive[0];
        }
      });
  }

  onPaginateChange() {
    this.getAllOrderInfo();
  }

  handleChangeStatus(order) {
    order.status = 'complete';
    this.orderProvider
      .updateOrder(order)
      .then()
      .catch(e => {
        this.showErrorInfoSheet(e);
      });
  }

  handleCredentialResponse(response: any) {
    // Decoding  JWT token...
    let decodedToken: any | null = null;
    try {
      decodedToken = JSON.parse(atob(response?.credential.split('.')[1]));
    } catch (e) {
      console.error('Error while trying to decode token', e);
    }
    console.log('decodedToken', decodedToken);
  }

  handleChangeResolve(order) {
    order.isResolve = true;
    this.orderProvider
      .updateOrder(order)
      .then()
      .catch(e => {
        this.showErrorInfoSheet(e);
      });
  }

  viewDetailOrder(order: IOrder) {
    this.handleOpenNoteDialog(order);
  }

  public showErrorInfoSheet(error: any, title?: string, exit?: boolean): void {
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

  handleOpenNoteDialog(order) {
    this.openDialog(order);
  }
  openDialog(order): void {
    const dialogRef = this.dialog.open(DialogCustomComponent, {
      width: '500px',
      data: order
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // order = result;
        this.orderProvider
          .updateOrder(order)
          .then(orderUpdated => {
            if (orderUpdated) {
              order = result;
            }
            alert('update order succesfully');
          })
          .catch(e => {
            alert(e);
          });
      }
    });
  }

  formatAmountWithLimitDecimal(amount: number, maxDecimals): number {
    if (amount.toString().split('.').length > 1) {
      if (amount.toString().split('.')[1].length > maxDecimals) {
        return Number(
          amount.toString().split('.')[0] +
            '.' +
            amount.toString().split('.')[1].substr(0, maxDecimals)
        );
      }
      return amount;
    } else {
      return amount;
    }
  }

  ionViewDidLoad() {}

  handleDateTime(timeMil) {
    return timeMil && timeMil > 0 ? new Date(timeMil).toUTCString() : '';
  }

  sortData(sort: any) {
    const data = this.dataSource.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'status':
          return compare(a.status, b.status, isAsc);
        case 'lastModified':
          return compare(a.lastModified, b.lastModified, isAsc);
        // case 'fat':
        //   return compare(a.fat, b.fat, isAsc);
        // case 'carbs':
        //   return compare(a.carbs, b.carbs, isAsc);
        // case 'protein':
        //   return compare(a.protein, b.protein, isAsc);
        default:
          return 0;
      }
    });
  }

  applyFilter() {
    this.optsCoinConfigFilter = {};
    if (this.dateSelected) {
      if (this.dateSelected.value === CoinFilterDate.DAY) {
        this.optsCoinConfigFilter.fromDate = moment().startOf('day').toDate();
        this.optsCoinConfigFilter.toDate = moment().endOf('day').toDate();
      } else if (this.dateSelected.value === CoinFilterDate.WEEK) {
        this.optsCoinConfigFilter.fromDate = moment().startOf('week').toDate();
        this.optsCoinConfigFilter.toDate = moment().endOf('week').toDate();
      } else if (this.dateSelected.value === CoinFilterDate.MONTH) {
        this.optsCoinConfigFilter.fromDate = moment().startOf('month').toDate();
        this.optsCoinConfigFilter.toDate = moment().endOf('month').toDate();
      }
    }

    if (this.fromCoin.value) {
      this.optsCoinConfigFilter.fromCoinCode = this.fromCoin.value.code;
      this.optsCoinConfigFilter.fromNetwork = this.fromCoin.value.network;
    }

    if (this.toCoin.value) {
      this.optsCoinConfigFilter.toCoinCode = this.toCoin.value.code;
      this.optsCoinConfigFilter.toNetwork = this.toCoin.value.network;
    }

    if(this.status){
      this.optsCoinConfigFilter.status = this.status.value;
    }

    if (_.isEmpty(this.optsCoinConfigFilter)) {
      this.optsCoinConfigFilter = null;
    }

    this.getAllOrderInfo();
  }

  getCoinName(coin: CoinConfig): string{
    let name = '';
    if(coin.isToken){
      name= coin.tokenInfo.name;
    } else{
      const objCoin = this.currencyProvider.getCoin(coin.code.toUpperCase());
      const nameCoin = this.currencyProvider.getCoinName(objCoin) || '';
      name= nameCoin;
    }
    return name + (coin.network === 'testnet' ? ' (Testnet)' : "");
  }

  clearFilter() {
    this.dateSelected = this.listCoinFilterDate[0];
    this.fromCoin = this.listCoinConfig[0];
    this.toCoin = this.listCoinConfig[0];
    this.optsCoinConfigFilter = null;
    this.getAllOrderInfo();
  }

  getAllOrderInfo() {
    const opts = {
      query: { _id: -1 },
      limit: this.pageEvent ? this.pageEvent.pageSize : this.pageSize,
      skip: this.pageEvent
        ? this.pageEvent.pageSize * this.pageEvent.pageIndex
        : 0,
      coinConfigFilter: this.optsCoinConfigFilter
    };
    this.onGoingProcessProvider.set('Processing');
    this.orderProvider
      .getAllOrderInfo(opts)
      .then((listOrderinfo: OrderReturnOpts) => {
        this.length = listOrderinfo.count;
        this.dataSource = listOrderinfo.listOrderInfo.map(obj => ({
          ...obj,
          lastModifiedStr: new Date(
            obj.lastModified || obj.createdOn
          ).toUTCString()
        }));
        this.sortedData = this.dataSource.slice();
        this._cdRef.markForCheck();
      })
      .catch(e => {
        this.showErrorInfoSheet(e);
      }).finally(()=>{
        this.onGoingProcessProvider.clear();
      });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
