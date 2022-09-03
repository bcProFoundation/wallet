import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import _ from 'lodash';
import { CountdownComponent } from 'ngx-countdown';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Coin, CurrencyProvider, RateProvider, ThemeProvider } from 'src/app/providers';

@Component({
  selector: 'page-create-swap',
  templateUrl: './create-swap.component.html',
  styleUrls: ['./create-swap.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSwapPage implements OnInit {
  public isScroll = false;
  public currentTheme:any;
  public rates: any;
  public coinSwapSelected: any;
  public coinReceiveSelected: any;
  public swapValue = 0;
  public receiveValue= 0;
  private modelChanged: Subject<Boolean> = new Subject<Boolean>();
  private subscription: Subscription;
  debounceTime = 500;
  // public config: Config;
  public fiatCode: any;
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;
  @ViewChild('input-swap') inputSwap:ElementRef; 
  @ViewChild('input-receive') inputReceive:ElementRef;
  public listConfig = {
    "coinSwap": [
      {
        "code": "xpi",
        "isToken": false,
        "networkFee": 226,
        "rate": {},
      },
      {
        "code": "btc",
        "isToken": false,
        "networkFee": 226,
        "rate": {},
      }
    ],
    "coinReceived": [
      {
        "code": "eat",
        "isToken": true,
        "networkFee": 1342,
        "rate": {}
      },
      {
        "code": "xec",
        "isToken": false,
        "networkFee": 1342,
        "rate": {}
      },
      {
        "code": "xpi",
        "isToken": false,
        "networkFee": 226,
        "rate": {}
      }
    ]
  }

  constructor(
    private router: Router,
    private themeProvider: ThemeProvider,
    private rateProvider: RateProvider,
    private currencyProvider: CurrencyProvider
    ) 
    { 
      // this.router.navigate(['/setting']);
    }

    public getChain(coin: Coin): string {
      // return '';
      return this.currencyProvider.getChain(coin).toLowerCase();
    }
    
    handleEvent(event){
      if(event.action === 'done'){
        this.countdown.restart();
        this.handleUpdateRate();
      }
    }

    async handleScrolling(event) {
      if (event.detail.currentY > 0) {
        this.isScroll = true;
      }
      else {
        this.isScroll = false;
      }
    }

    getFeeToken(networkFee) : number{
      const precision = _.get(this.currencyProvider.getPrecision('xec' as Coin), 'unitToSatoshi', 0);
      if(!precision){
        return 0;
      } else{
        return networkFee / precision;
      }
    }

    ngOnInit() {
      // this.rates = this.rateProvider.getRates();
      // this.rates = this.rates.map()
      // this.currentTheme = this.themeProvider.getCurrentAppTheme() === 'Dark Mode' ? 'dark' : 'light';
     this.handleUpdateRate();
     this.coinReceiveSelected = this.listConfig.coinReceived[0];
     this.coinSwapSelected = this.listConfig.coinSwap[0];
     this.subscription = this.modelChanged
      .pipe(
        debounceTime(this.debounceTime),
      )
      .subscribe((isSwap) => {
        this.handleInputChange(isSwap);
      });
    //  this.fiatCode =
    //     this.config.wallet.settings.alternativeIsoCode ||
    //     'USD';
    }

    handleInputChange(isSwap?:Boolean){
      if(!!isSwap){
        this.receiveValue = this.swapValue * ( this.coinSwapSelected.rate.USD/ this.coinReceiveSelected.rate.USD);
      } else{
        this.swapValue = this.receiveValue * (  this.coinReceiveSelected.rate.USD /this.coinSwapSelected.rate.USD);
      }
    }

    inputChanged(isSwap:boolean){
      this.modelChanged.next(isSwap);
    }

    handleUpdateRate(){
      this.rateProvider.updateRatesCustom().then(data => {
        this.listConfig.coinSwap.forEach(coin =>{
          coin.rate = data[coin.code];
        })
        this.listConfig.coinReceived.forEach(coin =>{
          coin.rate = data[coin.code];
        })
      });
    }

    handleCoinSwapChange(event){
      const coinSwapCodeSelected = event.detail.value;
      this.coinSwapSelected = this.listConfig.coinSwap.find(s => s.code === coinSwapCodeSelected);
    }

    handleCoinReceiveChange(event){
      const coinReceiveCodeSelected = event.detail.value;
      this.coinReceiveSelected = this.listConfig.coinReceived.find(s => s.code === coinReceiveCodeSelected);
    }

    ionViewWillEnter() {
      this.currentTheme = this.themeProvider.getCurrentAppTheme() === 'Dark Mode' ? 'dark' : 'light';
    }

    public openSettingPage() {
      this.router.navigate(['/setting']);
    }
}
