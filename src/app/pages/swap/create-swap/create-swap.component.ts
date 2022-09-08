import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { truncateSync } from 'fs';
import _ from 'lodash';
import { CountdownComponent } from 'ngx-countdown';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AddressProvider, Coin, CurrencyProvider, FilterProvider, IncomingDataProvider, RateProvider, ThemeProvider } from 'src/app/providers';
import { Config, ConfigProvider } from '../../../providers/config/config';
// import { Config } from 'src/app/providers/config/config';

@Component({
  selector: 'page-create-swap',
  templateUrl: './create-swap.component.html',
  styleUrls: ['./create-swap.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateSwapPage implements OnInit {
  public isScroll = false;
  public currentTheme:any;
  public rates: any;
  public coinSwapSelected: any;
  public coinReceiveSelected: any;
  public swapValue = 0;
  public receiveValue= 0;
  public altValue = 0;
  public altValueStr : any;
  public receiveAltValue= 0;
  private modelChanged: Subject<Boolean> = new Subject<Boolean>();
  private subscription: Subscription;
  public usdRate: any;
  public fiatCode: any;
  public config: Config;
  public addressSwapValue: any;
  public validAddress: any;
  public minAmount : any;
  public minStr : any;
  public validSwapAmount = true;
  public minWithCurrentFiat: any;
  public minWithCurrentFiatStr: any;
  public createForm: FormGroup
  debounceTime = 500;
  // public config: Config;
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;
  @ViewChild('inputSwap') inputSwap:ElementRef; 
  @ViewChild('inputReceive') inputReceive:ElementRef;
  private validDataTypeMap: string[] = [
    'BitcoinAddress',
    'BitcoinCashAddress',
    'ECashAddress',
    'LotusAddress',
    'EthereumAddress',
    'EthereumUri',
    'RippleAddress',
    'DogecoinAddress',
    'LitecoinAddress',
    'RippleUri',
    'BitcoinUri',
    'BitcoinCashUri',
    'DogecoinUri',
    'LitecoinUri',
    'BitPayUri',
    'ECashUri',
    'LotusUri'
  ];
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
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private form: FormBuilder,
    private _cdRef: ChangeDetectorRef
    ) 
    { 
      this.createForm = this.form.group({
        swapAmount:[0,{
          validators: [this.amountMinValidator()],
          updateOn: 'change'
        }],
        // swapAmount: [null],
        receiveAmount:[0,{
          validators: [this.amountMinValidator()],
          updateOn: 'change'
        }],
        address: [
          null, {
            validators: [this.addressValidator()],
            updateOn: 'change'
          }
        ]
      });
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
      .subscribe(isSwap => {
        this.handleInputChange(isSwap);
      });
    }

    handleInputChange(isSwap: Boolean){
      if(!!isSwap){
        const result = Number(this.createForm.controls['swapAmount'].value * ( this.coinSwapSelected.rate.USD / this.coinReceiveSelected.rate.USD));
        this.createForm.controls['receiveAmount'].setValue(this.formatAmountWithLimitDecimal(result, 8));
      } else{
        const result = Number((this.createForm.controls['receiveAmount'].value * ( this.coinReceiveSelected.rate.USD / this.coinSwapSelected.rate.USD)));;
        this.createForm.controls['swapAmount'].setValue(this.formatAmountWithLimitDecimal(result, 8));
      }
    }

    amountMinValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        if(control.value === 0){
          return { amountNotInput: true };
        }
        if(this.altValue > 0 ){
          this.minWithCurrentFiat = this.coinSwapSelected.min * this.usdRate[this.fiatCode];
          if(this.altValue < this.minWithCurrentFiat){
            this.minWithCurrentFiatStr = new Intl.NumberFormat('en-GB').format(this.minWithCurrentFiat);
            return { amountMinValidator: true };
          } else{
            return null;
          }
        }
        else{
          return null;
        }
      };
    }

    addressValidator():ValidatorFn{
      return (control: AbstractControl): ValidationErrors | null => {
        // handle case no address input
        if(!control.value){
          return null;
        }
        if(control.value.length === 0){
          return { addressNotInput: true };
        }
        
        // handle case token
        if(this.coinReceiveSelected.isToken){
          try {
            const addressInputValue = this.createForm.controls['address'].value;
            const { prefix, type, hash } = this.addressProvider.decodeAddress(addressInputValue);
            if(prefix === 'etoken' || prefix === 'ecash'){
              return null;
            } else{
              return { addressInvalid: true }
            }
          }
          catch(e){
            return { addressInvalid: true }
          }
        }
       
        // handle case coin
        const parsedData = this.incomingDataProvider.parseData(this.addressSwapValue);
        if (
          parsedData &&
          _.indexOf(this.validDataTypeMap, parsedData.type) != -1
        ) {
          this.validAddress = this.checkCoinAndNetwork(this.addressSwapValue);
          if(this.validAddress){
            return null;
          } else {
            return { addressInvalid: true }
          }
        } else{
          return { addressInvalid: true }
        }
      }
    }

    validateInput(isSwap){
      if(!!isSwap){
        // this.createForm.controls['receiveAmount'].setValue
        // this.swapValue = this.formatAmountWithLimitDecimal(this.swapValue, 8);
        // this._cdRef.markForCheck();
        // this.inputSwap.nativeElement.value = this.swapValue;
      } else{
        this.receiveValue = this.formatAmountWithLimitDecimal(this.receiveValue, 8);
        // this.inputReceive.nativeElement.value = new Intl.NumberFormat('en-GB').format(this.swapValue);
      }
      this.inputSwap.nativeElement.value = new Intl.NumberFormat('en-GB').format(this.swapValue);
      //   this.inputReceive.nativeElement.value = this.receiveValue;

    }

    handleKeyDown(isSwap: boolean, event){
      const keyInput = event.key;
      const pattern = /[^0-9\.]/;
      const keyCode = event.keyCode;
      const allowSpecialKeyCode = [37, 39, 8, 46];
      const swapValueInputStr = this.createForm.controls['swapAmount'].value.toString();
      const receiveValueInputStr = this.createForm.controls['receiveAmount'].value.toString();
      if(isSwap){
        if(keyInput === '.'){
          if(swapValueInputStr.split('.').length > 1) {
            event.preventDefault();
          }
        }
        else if (!allowSpecialKeyCode.includes(keyCode) && pattern.test(keyInput)) {
          event.preventDefault();
        }
        else{
          let swapValue;
          if(keyCode === 8 || keyCode === 46){
            swapValue = Number(swapValueInputStr.substring(0, swapValueInputStr.length -1));
          } else if(!allowSpecialKeyCode.includes(keyCode)){
            swapValue = Number(swapValueInputStr + event.key);
          } else{
            swapValue = swapValueInputStr;
          }   
          swapValue = isNaN(swapValueInputStr) ? 0 : swapValue;
          this.modelChanged.next(isSwap);
          this.altValue = this.formatAmountWithLimitDecimal(swapValue * this.coinSwapSelected.rate[this.fiatCode], 8);
          this.altValueStr = new Intl.NumberFormat('en-GB').format(this.altValue);
        } 
      }
      else{
        if (!allowSpecialKeyCode.includes(keyCode) && pattern.test(keyInput)) {
          event.preventDefault();
        }
        else{
          let receiveValue;
          if(keyCode === 8 || keyCode === 46){
            receiveValue = Number(receiveValueInputStr.substring(0, receiveValueInputStr.length -1));
          } else if(!allowSpecialKeyCode.includes(keyCode)){
            receiveValue = Number(receiveValueInputStr + event.key);
          } else{
            receiveValue = receiveValueInputStr;
          }
          receiveValue = isNaN(receiveValue) ? 0 : receiveValue;   
          this.modelChanged.next(isSwap);
          this.altValue = this.formatAmountWithLimitDecimal(receiveValue * this.coinReceiveSelected.rate[this.fiatCode], 8);
          this.altValueStr = new Intl.NumberFormat('en-GB').format(this.altValue);
        } 
      }
      this.modelChanged.next(isSwap);
    }

    formatAmountWithLimitDecimal(amount:number, maxDecimals):number {
      if(amount.toString().split('.').length > 1){
        if(amount.toString().split('.')[1].length > maxDecimals){
          return Number(amount.toString().split('.')[0] + '.' + amount.toString().split('.')[1].substr(0, maxDecimals));
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

    handleUpdateRate(){
      this.rateProvider.updateRatesCustom().then(data => {
        this.usdRate = data['eat'];
        this.listConfig.coinSwap.forEach(coin =>{
          const code = coin.code.toLowerCase();
          coin.rate = data[code];
        });
        this.listConfig.coinReceived.forEach(coin =>{
          const code = coin.code.toLowerCase();
          coin.rate = data[code];
        });
      });
    }

    handleCoinSwapChange(event){
      const coinSwapCodeSelected = event.detail.value;
      this.coinSwapSelected = this.listConfig.coinSwap.find(s => s.code === coinSwapCodeSelected);
      this.resetFormControl();
      // this.swapValue = 0;
      // this.receiveValue = 0;
    }

    handleCoinReceiveChange(event){
      const coinReceiveCodeSelected = event.detail.value;
      this.coinReceiveSelected = this.listConfig.coinReceived.find(s => s.code === coinReceiveCodeSelected);
      this.resetFormControl();
      // this.swapValue = 0;
      // this.receiveValue = 0;
      // this.addressSwapValue = '';
    }

    resetFormControl(){
      this.createForm.controls['swapAmount'].setValue(0);
      this.createForm.controls['receiveAmount'].setValue(0);
      this.createForm.controls['address'].setValue('');
    }

    ionViewWillEnter() {
      this.config = this.configProvider.get();
      this.fiatCode = this.config.wallet.settings.alternativeIsoCode;
      this.currentTheme = this.themeProvider.getCurrentAppTheme() === 'Dark Mode' ? 'dark' : 'light';
      this._cdRef.markForCheck();
    }

    validateAddress(){
      
      const parsedData = this.incomingDataProvider.parseData(this.addressSwapValue);

      if (
        parsedData &&
        _.indexOf(this.validDataTypeMap, parsedData.type) != -1
      ) {
        this.validAddress = this.checkCoinAndNetwork(this.addressSwapValue);
      }
    }

    private checkCoinAndNetwork(data): boolean {
      let isValid, addrData;

        addrData = this.addressProvider.getCoinAndNetwork(
          data,
          'livenet'
        );
        isValid =
          this.currencyProvider.getChain(this.coinReceiveSelected.code as Coin).toLowerCase() ==
          addrData.coin && addrData.network == 'livenet';
  
      if (isValid) {
        return true;
      } else {
      return false;
    }
}

    public openSettingPage() {
      this.router.navigate(['/setting']);
    }

}
