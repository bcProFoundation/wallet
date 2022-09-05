import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import _ from 'lodash';
import { CountdownComponent } from 'ngx-countdown';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Coin, CurrencyProvider, FilterProvider, RateProvider, ThemeProvider } from 'src/app/providers';
import { Config, ConfigProvider } from '../../../providers/config/config';
// import { Config } from 'src/app/providers/config/config';

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
  public swapAltValue = 0;
  public receiveAltValue= 0;
  private modelChanged: Subject<Boolean> = new Subject<Boolean>();
  private subscription: Subscription;
  public usdRate: any;
  public fiatCode: any;
  public config: Config;
  debounceTime = 500;
  // public config: Config;
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;
  @ViewChild('inputSwap') inputSwap:ElementRef; 
  @ViewChild('inputReceive') inputReceive:ElementRef;
  public listConfig = {
    "coinSwap": [
      {
        "code": "xpi",
        "isToken": false,
        "networkFee": 226,
        "rate": {},
        "min": 10, // USD
        "unitDecimals": 0
      },
      {
        "code": "xec",
        "isToken": false,
        "networkFee": 226,
        "rate": {},
        "min": 10, // USD
        "unitDecimals": 0
      },
      {
        "code": "bch",
        "isToken": false,
        "networkFee": 226,
        "rate": {},
        "min": 10, // USD
        "unitDecimals": 0
      }
    ],
    "coinReceived": [
      {
        "code": "EAT",
        "isToken": true,
        "networkFee": 1342,
        "rate": {},
        "unitDecimals": 0
      },
      {
        "code": "bcPro",
        "isToken": true,
        "networkFee": 1342,
        "rate": {},
        "unitDecimals": 0
      },
      {
        "code": "xpi",
        "isToken": false,
        "networkFee": 226,
        "rate": {},
        "unitDecimals": 0
      }
    ]
  }

  constructor(
    private router: Router,
    private themeProvider: ThemeProvider,
    private rateProvider: RateProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider,
    private filterProvider: FilterProvider
    ) 
    { 
      // this.router.navigate(['/setting']);
      // this.config = this.configProvider.get();
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
    }

    handleInputChange(isSwap?:Boolean){
      if(!!isSwap){
        const result = Number((this.swapValue * ( this.coinSwapSelected.rate.USD / this.coinReceiveSelected.rate.USD)));
        this.receiveValue = this.formatAmountWithLimitDecimal(result, 8);
      } else{
        const result = Number((this.receiveValue * ( this.coinReceiveSelected.rate.USD / this.coinSwapSelected.rate.USD)).toFixed(this.coinSwapSelected.unitDecimals));
        this.swapValue = this.formatAmountWithLimitDecimal(result, 8);
      }
    }

    validateInputSwap(input){
      if(this.swapValue.toString().split('.').length > 1){
        if(this.swapValue.toString().split('.')[1].length > this.coinSwapSelected.unitDecimals){
          const valueFixed = Number(Number(this.swapValue).toFixed(this.coinSwapSelected.unitDecimals));
          this.swapValue = valueFixed;
          input.value = this.swapValue;
        }
      }
    }

    validateInputReceive(input){
      if(this.receiveValue.toString().split('.').length > 1){
        if(this.receiveValue.toString().split('.')[1].length > this.coinReceiveSelected.unitDecimals){
          const valueFixed = Number(Number(this.receiveValue).toFixed(this.coinReceiveSelected.unitDecimals));
          this.receiveValue = valueFixed;
          input.value = this.receiveValue;
        }
      }
    }

    formatAmountWithLimitDecimal(amount:number, maxDecimals):number {
      if(amount.toString().split('.').length > 1){
        if(amount.toString().split('.')[1].length > maxDecimals){
          return Number(amount.toFixed(maxDecimals));
        }
        return amount;      
      } else {
        return amount;
      }
    }

    formatInput(balance){
      if (typeof balance === 'string') 
        balance = balance.replace(/,/g, '')
    if (isNaN(Number(balance)) || Number(balance) <= 0) {
        return "0.00";
    } else {
        if (Number(balance) < 10) {
            return Number(Number(balance).toFixed(Math.round(1/Number(balance)).toString().length+2)).toLocaleString("en-GB");
        } else {
            return Number(Number(balance).toFixed(Math.round(1/Number(balance)).toString().length+1)).toLocaleString("en-GB");
        }
    }
    }

    inputChanged(isSwap:boolean){
      this.modelChanged.next(isSwap);
      
    }

    handleUpdateRate(){
      this.rateProvider.updateRatesCustom().then(data => {
        this.listConfig.coinSwap.forEach(coin =>{
          const code = coin.code.toLowerCase();
          coin.rate = data[code];
          const coinCode = coin.isToken ? 'xec' : coin.code;
          if(coin.unitDecimals <= 0){
            const { unitDecimals } = this.currencyProvider.getPrecision(coinCode as Coin);
            coin.unitDecimals = unitDecimals;
          }
        });
        this.listConfig.coinReceived.forEach(coin =>{
          const code = coin.code.toLowerCase();
          coin.rate = data[code];
          const coinCode = coin.isToken ? 'xec' : coin.code;
          if(coin.unitDecimals <= 0){
            const { unitDecimals } = this.currencyProvider.getPrecision(coinCode as Coin);
            coin.unitDecimals = unitDecimals;
          }
        });
        this.usdRate = data['eat'];
      });
    }

    handleCoinSwapChange(event){
      const coinSwapCodeSelected = event.detail.value;
      this.coinSwapSelected = this.listConfig.coinSwap.find(s => s.code === coinSwapCodeSelected);
      this.swapValue = 0;
      this.receiveValue = 0;
    }

    handleCoinReceiveChange(event){
      const coinReceiveCodeSelected = event.detail.value;
      this.coinReceiveSelected = this.listConfig.coinReceived.find(s => s.code === coinReceiveCodeSelected);
      this.swapValue = 0;
      this.receiveValue = 0;
    }

    ionViewWillEnter() {
      this.currentTheme = this.themeProvider.getCurrentAppTheme() === 'Dark Mode' ? 'dark' : 'light';
      this.config = this.configProvider.get();
      this.fiatCode = this.config.wallet.settings.alternativeIsoCode;
    }

    public openSettingPage() {
      this.router.navigate(['/setting']);
    }
}
