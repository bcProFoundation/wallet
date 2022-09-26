import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Router } from '@angular/router';
import _ from 'lodash';
import { CountdownComponent } from 'ngx-countdown';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  AddressProvider,
  BwcErrorProvider,
  Coin,
  CurrencyProvider,
  ErrorsProvider,
  FilterProvider,
  IncomingDataProvider,
  RateProvider,
  ThemeProvider
} from 'src/app/providers';
import { OrderProvider } from 'src/app/providers/order/order-provider';
import { Config, ConfigProvider } from '../../../providers/config/config';
import { TokenInforPage } from '../../token-info/token-info';
import { CoinConfig, ConfigSwap, TokenInfo } from '../config-swap';
import BigNumber from "bignumber.js";
import { TranslateService } from '@ngx-translate/core';
import { IOrder, OrderOpts } from '../model/order-model';


@Component({
  selector: 'page-create-swap',
  templateUrl: './create-swap.component.html',
  styleUrls: ['./create-swap.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateSwapPage implements OnInit {
  public isScroll = false;
  public currentTheme: any;
  public rates: any;
  public coinSwapSelected: CoinConfig;
  public coinReceiveSelected: CoinConfig;
  public altValue : BigNumber = new BigNumber(0);
  private modelChanged: Subject<Boolean> = new Subject<Boolean>();
  private subscription: Subscription;
  public usdRate: any;
  public fiatCode: any;
  public config: Config;
  public addressSwapValue: any;
  public validAddress: any;
  public minAmount: any;
  public minWithCurrentFiat: any;
  public maxWithCurrentFiat: any;
  public createForm: FormGroup;
  public searchValue = '';
  debounceTime = 500;
  // public config: Config;
  @ViewChild('cd', { static: false }) private countdown: CountdownComponent;
  @ViewChild('inputSwap') inputSwap: ElementRef;
  @ViewChild('inputReceive') inputReceive: ElementRef;
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

  // public listConfig = {
  //   "coinSwap": [
  //     {
  //       "code": "xpi",
  //       "isToken": false,
  //       "networkFee": 226,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     },
  //     {
  //       "code": "xec",
  //       "isToken": false,
  //       "networkFee": 226,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     },
  //     {
  //       "code": "bch",
  //       "isToken": false,
  //       "networkFee": 226,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     },
  //     {
  //       "code": "abcslp",
  //       "isToken": true,
  //       "networkFee": 1342,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     }
  //   ],
  //   "coinReceive": [
  //     {
  //       "code": "abcslp",
  //       "isToken": true,
  //       "networkFee": 1342,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     },
  //     {
  //       "code": "EAT",
  //       "isToken": true,
  //       "networkFee": 1342,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     },
  //     {
  //       "code": "bcPro",
  //       "isToken": true,
  //       "networkFee": 1342,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     },
  //     {
  //       "code": "xpi",
  //       "isToken": false,
  //       "networkFee": 226,
  //       "rate": {},
  //       "min": 0, // USD
  //       "tokenInfo": {}
  //     }
  //   ]
  // }

  public listConfig: ConfigSwap = null;

  constructor(
    private router: Router,
    private themeProvider: ThemeProvider,
    private rateProvider: RateProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider,
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private form: FormBuilder,
    private _cdRef: ChangeDetectorRef,
    private orderProvider: OrderProvider,
    private errorsProvider: ErrorsProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    this.createForm = this.form.group({
      swapAmount: [
        0,
        {
          validators: [this.amountMinValidator(true), this.amountMaxValidator()],
          updateOn: 'change'
        }
      ],
      // swapAmount: [null],
      receiveAmount: [
        0,
        {
          validators: [this.amountMinValidator(false)],
          updateOn: 'change'
        }
      ],
      address: [
        null,
        {
          validators: [this.addressValidator()],
          updateOn: 'change'
        }
      ]
    });
  }

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin as Coin).toLowerCase();
  }
  

  public convertAmountToSatoshiAmount(coinConfig, amount): number {
    if (coinConfig.isToken) {
      const decimals = coinConfig.tokenInfo.decimals;
      return amount * Math.pow(10, decimals);
    } else {
      const precision = _.get(
        this.currencyProvider.getPrecision(coinConfig.code),
        'unitToSatoshi',
        0
      );
      return amount * precision;
    }
  }

  public getSatUnitFromCoin(coinConfig) {
    if (coinConfig.isToken) {
      const decimals = coinConfig.tokenInfo.decimals;
      return Math.pow(10, decimals);
    } else {
      const precision = _.get(
        this.currencyProvider.getPrecision(coinConfig.code),
        'unitToSatoshi',
        0
      );
      return precision;
    }
  }

  handleEvent(event) {
    if (event.action === 'done') {
      this.countdown.restart();
      this.handleUpdateRate();
    }
  }

  async handleScrolling(event) {
    if (event.detail.currentY > 0) {
      this.isScroll = true;
    } else {
      this.isScroll = false;
    }
  }

  getFeeToken(networkFee): number {
    const precision = _.get(
      this.currencyProvider.getPrecision('xec' as Coin),
      'unitToSatoshi',
      0
    );
    if (!precision) {
      return 0;
    } else {
      return networkFee / precision;
    }
  }

  ngOnInit() {
    this.orderProvider.getConfigSwap().then(configSwap => {
      this.listConfig = configSwap;
      this._cdRef.markForCheck();
      // this.orderProvider
      //   .getTokenInfo()
      //   .then((listTokenInfo: TokenInfo[]) => {
      //     const allConig = this.listConfig.coinSwap.concat(
      //       this.listConfig.coinReceive
      //     );
      //     allConig.forEach(coinConfig => {
      //       if (coinConfig.isToken) {
      //         coinConfig.tokenInfo = listTokenInfo.find(
      //           s => s.symbol.toLowerCase() === coinConfig.code
      //         );
      //       }
      //     });
      //   })
      //   .catch(err => {
      //     console.log(err);
      //   });
      this.coinReceiveSelected = this.listConfig.coinReceive[0];
      this.coinSwapSelected = this.listConfig.coinSwap[0];
      this.subscription = this.modelChanged
        .pipe(debounceTime(this.debounceTime))
        .subscribe(isSwap => {
          this.handleInputChange(isSwap);
        });
    });
  }

  handleInputChange(isSwap: Boolean) {
    if (!!isSwap) {
      const result =
        this.createForm.controls['swapAmount'].value *
        (this.coinSwapSelected.rate.USD / this.coinReceiveSelected.rate.USD);
      this.createForm.controls['receiveAmount'].setValue(result);
    } else {
      const result =
        this.createForm.controls['receiveAmount'].value *
        (this.coinReceiveSelected.rate.USD / this.coinSwapSelected.rate.USD);
      this.createForm.controls['swapAmount'].setValue(result);
    }
  }

  amountMinValidator(isSwap: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === 0) {
        return null;
      }
      
      if (!!isSwap) {
        this.altValue =
        new BigNumber(control.value).multipliedBy(this.coinSwapSelected.rate[this.fiatCode]);
      } else {
        this.altValue =
        new BigNumber(control.value).multipliedBy(this.coinReceiveSelected.rate[this.fiatCode]);
      }
      if (this.altValue.isGreaterThan(0)) {
        // const result = new BigNumber(this.altValue).toString();
        // this.altValue = new BigNumber(this.altValue).toNumber();
        this.minWithCurrentFiat =
          this.coinSwapSelected.min * this.usdRate[this.fiatCode];
        if (this.altValue.toNumber() < this.minWithCurrentFiat) {
          return { amountMinValidator: true };
        } else {
          return null;
        }
      } else {
        return null;
      }
    };
  }

  amountMaxValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === 0) {
        return null;
      }
      if (this.altValue.isGreaterThan(0)) {
        this.maxWithCurrentFiat =
          this.coinReceiveSelected.max * this.usdRate[this.fiatCode];
        if (this.altValue.toNumber() > this.maxWithCurrentFiat) {
          return { amountMaxValidator: true };
        } else {
          return null;
        }
      } else {
        return null;
      }
    };
  }


  addressValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // handle case no address input
      if (!control.value) {
        return null;
      }
      if (control.value.length === 0) {
        return { addressNotInput: true };
      }
      const addressInputValue = this.createForm.controls['address'].value;
      // handle case token
      if (this.coinReceiveSelected.isToken) {
        try {
          const { prefix, type, hash } =
            this.addressProvider.decodeAddress(addressInputValue);
          if (prefix === 'etoken' || prefix === 'ecash') {
            return null;
          } else {
            return { addressInvalid: true };
          }
        } catch (e) {
          return { addressInvalid: true };
        }
      }

      // handle case coin
      const parsedData = this.incomingDataProvider.parseData(addressInputValue);
      if (
        parsedData &&
        _.indexOf(this.validDataTypeMap, parsedData.type) != -1
      ) {
        this.validAddress = this.checkCoinAndNetwork(addressInputValue);
        if (this.validAddress) {
          return null;
        } else {
          return { addressInvalid: true };
        }
      } else {
        return { addressInvalid: true };
      }
    };
  }

  handleKeyDown(isSwap: boolean, event) {
    const keyInput = event.key;
    const pattern = /[^0-9\.]/;
    const keyCode = event.keyCode;
    const allowSpecialKeyCode = [37, 39, 8, 46];
    const swapValueInputStr =
      this.createForm.controls['swapAmount'].value.toString();
    const receiveValueInputStr =
      this.createForm.controls['receiveAmount'].value.toString();
    if (isSwap) {
      if (keyInput === '.') {
        if (swapValueInputStr.split('.').length > 1) {
          event.preventDefault();
        }
      } else if (
        !allowSpecialKeyCode.includes(keyCode) &&
        pattern.test(keyInput)
      ) {
        event.preventDefault();
      }
    } else {
      if (!allowSpecialKeyCode.includes(keyCode) && pattern.test(keyInput)) {
        event.preventDefault();
      }
    }
  }

  handleSearchInput(){
    if(this.searchValue.trim().length > 1){
      this.router.navigate(['/order-swap'], {
        replaceUrl: true,
        state: {
          orderId: this.searchValue
        }
      });
    }
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

  formatInput(balance) {
    if (typeof balance === 'string') balance = balance.replace(/,/g, '');
    if (isNaN(Number(balance)) || Number(balance) <= 0) {
      return '0.00';
    } else {
      if (Number(balance) < 10) {
        return Number(
          Number(balance).toFixed(
            Math.round(1 / Number(balance)).toString().length + 2
          )
        ).toLocaleString('en-GB');
      } else {
        return Number(
          Number(balance).toFixed(
            Math.round(1 / Number(balance)).toString().length + 1
          )
        ).toLocaleString('en-GB');
      }
    }
  }

  handleUpdateRate() {
    this.rateProvider.updateRatesCustom().then(data => {
      this.usdRate = data['eat'];
      this.listConfig.coinSwap.forEach(coin => {
        const code = coin.code.toLowerCase();
        coin.rate = data[code];
      });
      this.listConfig.coinReceive.forEach(coin => {
        const code = coin.code.toLowerCase();
        coin.rate = data[code];
      });
    });
  }

  handleCoinSwapChange(event) {
    const coinSwapCodeSelected = event.detail.value;
    this.coinSwapSelected = this.listConfig.coinSwap.find(
      s => s.code === coinSwapCodeSelected
    );
    this.resetFormControl();
  }

  handleCoinReceiveChange(event) {
    const coinReceiveCodeSelected = event.detail.value;
    this.coinReceiveSelected = this.listConfig.coinReceive.find(
      s => s.code === coinReceiveCodeSelected
    );
    this.resetFormControl();
  }

  resetFormControl() {
    this.createForm.controls['swapAmount'].setValue(0);
    this.createForm.controls['receiveAmount'].setValue(0);
    this.createForm.controls['address'].setValue('');
  }

  ionViewWillEnter() {
    this.config = this.configProvider.get();
    this.fiatCode = this.config.wallet.settings.alternativeIsoCode;
    this.currentTheme =
      this.themeProvider.getCurrentAppTheme() === 'Dark Mode'
        ? 'dark'
        : 'light';
    this._cdRef.markForCheck();
  }

  private checkCoinAndNetwork(data): boolean {
    let isValid, addrData;

    addrData = this.addressProvider.getCoinAndNetwork(data, 'livenet');
    isValid =
      this.currencyProvider
        .getChain(this.coinReceiveSelected.code as Coin)
        .toLowerCase() == addrData.coin && addrData.network == 'livenet';

    if (isValid) {
      return true;
    } else {
      return false;
    }
  }

  public openSettingPage() {
    this.router.navigate(['/setting']);
  }

  public createOrder() {
    const orderOpts = {
      fromCoinCode: this.coinSwapSelected.code,
      amountFrom: this.convertAmountToSatoshiAmount(
        this.coinSwapSelected,
        this.createForm.controls['swapAmount'].value as number
      ),
      isFromToken: this.coinSwapSelected.isToken,
      fromTokenId: this.coinSwapSelected.isToken
        ? this.coinSwapSelected.tokenInfo.id
        : null,
      toCoinCode: this.coinReceiveSelected.code,
      toTokenId: this.coinReceiveSelected.isToken
        ? this.coinReceiveSelected.tokenInfo.id
        : null,
      isToToken: this.coinReceiveSelected.isToken,
      createdRate:
        this.coinSwapSelected.rate.USD / this.coinReceiveSelected.rate.USD,
      addressUserReceive: this.createForm.controls['address'].value,
      toTokenInfo : this.coinReceiveSelected.tokenInfo || null,
      fromTokenInfo : this.coinSwapSelected.tokenInfo || null,
    } as OrderOpts;
    this.orderProvider
      .createOrder(orderOpts)
      .then((result: IOrder) => {
        this.router.navigate(['/order-swap'], {
          replaceUrl: true,
          state: {
            orderId: result.id
          }
        });
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
        // if (exit) {
        //   this.location.back()
        // }
      }
    );
  }
}
