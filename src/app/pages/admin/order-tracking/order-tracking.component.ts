import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TokenInfo } from 'src/app/models/tokens/tokens.model';
import { OrderProvider } from 'src/app/providers';
import { CoinConfig } from '../../swap/config-swap';
import {PageEvent} from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';


export interface PeriodicElement {
  name: string;
  position: number;
  weight?: number;
  symbol: string;
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
  coinConfig?: CoinConfig
}

@Component({
  selector: 'app-order-tracking',
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss'],
})
export class OrderTrackingComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id','fromCoinCode', 'amountFrom', 'isFromToken', 'toCoinCode', 
  'isToToken', 'createdRate', 'updatedRate', 'addressUserReceive', 'adddressUserDeposit', 'status', 'createdOn', 'endedOn','listTxIdUserReceive', 'listTxIdUserDeposit', 'changeStatus'];
  // displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  // displayedColumns: string[] = ['id','fromCoinCode', 'endedOn', 'abc'];

  // dataSource = ELEMENT_DATA;
  dataSource: any;
  length = 100;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100];
    // MatPaginator Output
    pageEvent: PageEvent;
  constructor(
    private orderProvider: OrderProvider,
    private _cdRef: ChangeDetectorRef
  ) { 
    const opts = {
      query: {_id : 1},
      limit: this.pageSize,
      skip: this.pageSize * 0
    };

    this.orderProvider.getAllOrderInfo(opts).then((listOrderinfo: IOrder[]) => {
      this.length = listOrderinfo.length;
      this.dataSource = listOrderinfo;
      this._cdRef.markForCheck();
    });  
  }
  ngAfterViewInit(): void {
 }

  ngOnInit() {
    // console.log(this.pageEvent);
   
  }

  onPaginateChange(){
    const opts = {
      query: {_id : 1},
      limit: this.pageEvent.pageSize,
      skip: this.pageEvent.pageSize * this.pageEvent.pageIndex
    };
    this.orderProvider.getAllOrderInfo(opts).then((listOrderinfo: IOrder[]) => {
      this.length = listOrderinfo.length;
      this.dataSource = listOrderinfo;
      this._cdRef.markForCheck();
    });  

  }

  handleChangeStatus(order){
    console.log(order);
  }

  ionViewDidLoad() {
   
  }
}
