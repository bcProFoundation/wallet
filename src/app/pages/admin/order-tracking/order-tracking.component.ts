import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { TokenInfo } from 'src/app/models/tokens/tokens.model';
import { BwcErrorProvider, ErrorsProvider, OrderProvider } from 'src/app/providers';
import { CoinConfig } from '../../swap/config-swap';
import {PageEvent} from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { DialogCustomComponent } from '../modal/modal.component';
import { TranslateService } from '@ngx-translate/core';
import { Sort } from '@angular/material/sort';
import jwt_decode from "jwt-decode";
import { AuthenticationService } from '../service/authentication.service';
import { PassWordHandleCases } from '../create-password/create-password.component';
import { Router } from '@angular/router';


export interface PeriodicElement {
  name: string;
  position: number;
  weight?: number;
  symbol: string;
}

export interface OrderReturnOpts{
  listOrderInfo: IOrder[];
  count: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];

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
  coinConfig?: CoinConfig;
  lastModified?: number;
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
  endedOn?: number;
  createdOn?: number;
  error?: string;
  toTokenInfo? : TokenInfo;
  fromTokenInfo?: TokenInfo;
  coinConfig?: CoinConfig;
  lastModified?: number;
}

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss'],
})
export class OrderTrackingComponent implements OnInit, AfterViewInit {
  // displayedColumns: string[] = ['id','fromCoinCode', 'amountFrom', 'isFromToken', 'toCoinCode', 
  // 'isToToken', 'createdRate', 'updatedRate', 'addressUserReceive', 'adddressUserDeposit', 
  // 'status', 'createdOn', 'endedOn','listTxIdUserReceive', 'listTxIdUserDeposit', 'error', 'changeStatus' ];
  displayedColumns: string[] = ['id','swapPairCode', 'rate', 'pendingReason', 'status', 'lastModified', 'action'];
  // displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  // displayedColumns: string[] = ['id','fromCoinCode', 'endedOn', 'abc'];

  // dataSource = ELEMENT_DATA;
  dataSource: any;
  length = 100;
  pageSize = 10;
  isLoggedin: boolean = true; 
  pageSizeOptions: number[] = [5, 10, 25, 100];
    // MatPaginator Output
    pageEvent: PageEvent;
    sortedData: IOrder[];
    // Date = new this.Date()
  constructor(
    private orderProvider: OrderProvider,
    private _cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private ngZone: NgZone,
    private authenticationService: AuthenticationService,
    private router: Router

  ) { 
    const opts = {
      query: {_id : 1},
      limit: this.pageSize,
      skip: this.pageSize * 0
    };

    this.orderProvider.getAllOrderInfo(opts).then((listOrderinfo: OrderReturnOpts) => {
      this.length = listOrderinfo.count;
      this.dataSource = listOrderinfo.listOrderInfo.map(obj => ({ ...obj, lastModifiedStr: new Date(obj.lastModified || obj.createdOn).toUTCString() }));
      this.sortedData = this.dataSource.slice();
      this._cdRef.markForCheck();
    });  

    window['handleCredentialResponse'] = user => ngZone.run(
      ()=>{
        this.afterSignInUser(user);
      }
    )
    
  }
  ngAfterViewInit(): void { 
 }
 redirectForgotPasswordPage(){
  this.router.navigate(['/dashboard/create-password'], {
    state: {
      passwordHandleCases :  PassWordHandleCases.ForgotPassword
    }
  })
 }

 redirectImportSeedPage(){
  this.router.navigate(['/import-seed']);
 }
 afterSignInUser(user){
   const userDecoded = jwt_decode(user.credential);
   this.orderProvider.login({id_token: user.credential}).then(approve => {
    if(approve){
      this.authenticationService.login(user.credential);
    }
   }).catch(e => {
    this.showErrorInfoSheet(e);
   })
  //  console.log(userDecoded);
 }
  ngOnInit() {
 
  }

  onPaginateChange(){
    const opts = {
      query: {_id : 1},
      limit: this.pageEvent.pageSize,
      skip: this.pageEvent.pageSize * this.pageEvent.pageIndex
    };
    this.orderProvider.getAllOrderInfo(opts).then((listOrderinfo: OrderReturnOpts) => {
      this.length = listOrderinfo.count;
      this.dataSource = listOrderinfo.listOrderInfo;
      this._cdRef.markForCheck();
    });  

  }

  handleChangeStatus(order){
    order.status = 'complete';
    this.orderProvider.updateOrder(order).then(

    ).catch(e => {
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

  handleChangeResolve(order){
    order.isResolve = true;
    this.orderProvider.updateOrder(order).then(

    ).catch(e => {
      this.showErrorInfoSheet(e);
    })
  }

  viewDetailOrder(order: IOrder){
    this.handleOpenNoteDialog(order);
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

  handleOpenNoteDialog(order){
    this.openDialog(order);
  }
  openDialog(order): void {
    const dialogRef = this.dialog.open(DialogCustomComponent, {
      width: '500px',
      data: order,
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        // order = result;
        this.orderProvider.updateOrder(order).then(orderUpdated => {
          if(orderUpdated){
            order = result;
          }
          alert('update order succesfully');
        }).catch(e => {
          alert(e);
        })
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

  ionViewDidLoad() {
   
  }

  handleDateTime(timeMil){
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

  logOut(){
    this.authenticationService.logout();
  }
}
function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

