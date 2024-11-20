import { Component, ViewEncapsulation } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

// services
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ConfigProvider, Config } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { NavParams } from '@ionic/angular';
import { Router } from '@angular/router';
import _ from 'lodash';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FilterProvider, RateProvider, ThemeProvider } from 'src/app/providers';
@Component({
  selector: 'page-custom-amount-token',
  templateUrl: './custom-amount-token.html',
  styleUrls: ['./custom-amount-token.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomAmountTokenPage {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallet;
  public showShareButton: boolean;
  public amountUnitStr: string;
  public amountCoin: string;
  public altAmountStr: string;
  public amountCustomForm: UntypedFormGroup;
  public isCordova: boolean;
  public currentTheme: string;

  public config: Config;
  expression;
  private availableUnits;
  private unitIndex: number;
  public fiatCode: string;
  private altUnitIndex: number;
  public unit: string;
  public alternativeUnit: string;
  private unitToSatoshi: number;
  private satToUnit: number;
  private unitDecimals: number;
  public alternativeAmount: string;
  private amountSat: number;
  public amountToShow;
  public token;
  public addressToken;
  public isTokenFiatRate: boolean;
  navParamsData;
  typeErrorQr = NgxQrcodeErrorCorrectionLevels;
  constructor(
    public currencyProvider: CurrencyProvider,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private themeProvider: ThemeProvider,
    private rateProvider: RateProvider,
    private filterProvider: FilterProvider
  ) {
    this.currentTheme = this.themeProvider.currentAppTheme;
    this.amountCustomForm = this.formBuilder.group({
      amountCustom: [
        0
        ,
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    this.expression = 0;
    this.isCordova = this.platformProvider.isCordova;
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    this.token = this.navParamsData?.token;
    this.addressToken = this.navParamsData?.tokenAddress || null;
    const walletId = this.navParamsData.id;
    this.showShareButton = this.platformProvider.isCordova;
    this.config = this.configProvider.get();
    this.wallet = this.profileProvider.getWallet(walletId);

  }

  ngOnInit() {
    this.logger.info('Loaded: CustomAmountPage');
    this.checkTokenFiatRate();
    this.setAvailableUnits();
    this.changeUnit();
    this.processAmount();
    this.getAmountCustom();
  }

  private setAvailableUnits(): void {
    this.availableUnits = [];
    this.availableUnits.push({
      name: this.token.tokenInfo.name,
      id: this.token.tokenId,
      shortName: this.token.tokenInfo.symbol
    });
    this.unitIndex = 1;
    //  currency have preference
    this.fiatCode =
      this.config.wallet.settings.alternativeIsoCode ||
      'USD';
    const fiatName = this.config.wallet.settings.alternativeName || this.fiatCode;
    this.altUnitIndex = this.availableUnits.length;

    this.availableUnits.push({
      name: fiatName || this.fiatCode,
      id: this.fiatCode,
      shortName: this.fiatCode,
      isFiat: true
    });
  }

  private updateUnitUI(): void {
    this.unit = this.availableUnits[this.unitIndex].shortName;
    this.alternativeUnit = this.availableUnits[this.altUnitIndex].shortName;
    this.processAmount();
    this.logger.debug(
      'Update unit coin @amount unit:' +
      this.unit +
      ' alternativeUnit:' +
      this.alternativeUnit
    );
  }

  public getAmountCustom() {
    if (this.amountCustomForm.value.amountCustom === '') return;
    if (this.amountToShow > 0) {
        this.qrAddress =
          this.addressToken +
          '?amount1=' +
          this.amountToShow +
          '-' + this.token?.tokenId;
      }
      else {
        this.qrAddress = this.addressToken;
      }
  }

  private checkTokenFiatRate() {
    const isTokenFiatRate = this.rateProvider.isCoinAvailable(this.token.tokenInfo.symbol);
    this.isTokenFiatRate = isTokenFiatRate;
  }

  private format(val: string): string {
    if (!val) return undefined;

    let result = val.toString();

    if (this.isOperator(_.last(val))) result = result.slice(0, -1);

    return result.replace('x', '*');
  }

  private isOperator(val: string): boolean {
    const regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  }

  private evaluate(val: string) {
    let result;
    try {
      result = eval(val);
    } catch (e) {
      return 0;
    }
    if (!_.isFinite(result)) return 0;
    return result;
  }

  private isExpression(val: string): boolean {
    const regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  }

  private processResult(val): number {
    if (this.availableUnits[this.unitIndex].isFiat)
      return +this.filterProvider.formatFiatAmount(val);
    else
      return +this.txFormatProvider.formatAmount(
        this.unit.toLowerCase(),
        val.toFixed(this.unitDecimals) * this.unitToSatoshi,
        true
      );
  }

  processAmount() {
    let formatedValue = this.format(this.amountCustomForm.value.amountCustom);
    let result = this.evaluate(formatedValue);

    if (_.isNumber(result)) {

      const globalResult = this.isExpression(this.expression)
        ? '= ' + this.processResult(result)
        : '';


      if (this.availableUnits[this.unitIndex].isFiat) {
        let a = result === 0 ? 0 : this.fromFiat(result);
        if (a) {
          this.alternativeAmount = this.txFormatProvider.formatAmount(
            this.availableUnits[this.altUnitIndex].id,
            a * this.unitToSatoshi,
            true
          );
        } else {
          this.alternativeAmount = result ? 'N/A' : '0.00';
        }
      } else {
        this.alternativeAmount = this.filterProvider.formatFiatAmount(
          this.toFiat(result)
        );
      }
    }
    const unit = this.availableUnits[this.unitIndex];
    let amount = result;
    const decimals = _.get(this.token, 'tokenInfo.decimals', undefined);
    const unitDecimal = Math.pow(10, decimals);
    if (!unit.isFiat) {
      if (decimals && result > 0) amount = (amount * unitDecimal).toFixed(0);
      const alternativeAmount = this.rateProvider.toFiatToken(
        result,
        this.wallet.cachedStatus.alternativeIsoCode,
        this.token.tokenInfo.symbol
        );
        this.alternativeAmount =
        this.filterProvider.formatFiatAmount(alternativeAmount);
      } else {
        amount = this.fromFiatToken(amount, this.token.tokenInfo.symbol);
        this.alternativeAmount = this.filterProvider
        .formatFiatAmount(amount)
        .toString();
      }
    this.amountToShow = unit.isFiat ? this.alternativeAmount.replace(/,/g, '') : result;
    this.altAmountStr = this.alternativeAmount;
  }

  private fromFiatToken(val: number, tokenSymbol): number {
    const fiatToken = this.rateProvider.fromFiatToken(val, this.fiatCode, tokenSymbol) || 0;
    return parseFloat(fiatToken.toFixed(2));
  }

  private toFiat(val: number, coin?: Coin): number {
    if (
      !this.rateProvider.getRate(
        this.fiatCode,
        coin || this.availableUnits[this.unitIndex].id
      )
    )
      return undefined;

    const rateProvider = this.rateProvider
      .toFiat(
        val * this.unitToSatoshi,
        this.fiatCode,
        coin || this.availableUnits[this.unitIndex].id
      )
    if (_.isNil(rateProvider)) return undefined;
    return parseFloat(rateProvider.toString());
  }

  private fromFiat(val: number, coin?: Coin): number {
    coin = coin || this.availableUnits[this.altUnitIndex].id;
    return parseFloat(
      (
        this.rateProvider.fromFiat(val, this.fiatCode, coin) * this.satToUnit
      ).toFixed(this.unitDecimals)
    );
  }

  changeUnit() {
    this.unitIndex++;
    if (this.unitIndex >= this.availableUnits.length) this.unitIndex = 0;

    if (this.availableUnits[this.unitIndex].isFiat) {
      // Always return to BTC... TODO?
      this.altUnitIndex = 0;
    } else {
      this.altUnitIndex = _.findIndex(this.availableUnits, {
        isFiat: true
      });
    }

    this.amountCustomForm.value.amountCustom = 0;
    this.updateUnitUI();
  }

  public shareAddress(): void {
    this.socialSharing.share(this.qrAddress);
  }

  public showPaymentRequestInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'payment-request',
      {
        amount: this.amountCustomForm.value.amountCustom,
        name: this.token?.tokenInfo?.name
      }
    );
    infoSheet.present();
  }
}

