import { Component, ViewEncapsulation } from '@angular/core';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

// services
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { PlatformProvider } from '../../../providers/platform/platform';
import { Router } from '@angular/router';
import _ from 'lodash';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThemeProvider } from 'src/app/providers';
@Component({
  selector: 'page-custom-amount-token',
  templateUrl: './custom-amount-token.html',
  styleUrls: ['./custom-amount-token.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomAmountTokenPage {
  public protocolHandler: string;
  public addressToken: string;
  public qrAddress: string;
  public showShareButton: boolean;
  public amountCustomForm: FormGroup;
  public isCordova: boolean;
  public currentTheme: string;
  private navParamsData;
  public token;
  typeErrorQr = NgxQrcodeErrorCorrectionLevels;
  constructor(
    private platformProvider: PlatformProvider,
    private logger: Logger,
    private socialSharing: SocialSharing,
    private actionSheetProvider: ActionSheetProvider,
    private router: Router,
    private formBuilder: FormBuilder,
    private themeProvider: ThemeProvider,
  ) {
    this.currentTheme = this.themeProvider.currentAppTheme;
    this.amountCustomForm = this.formBuilder.group({
      amountCustom: [
        0
        ,
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    this.isCordova = this.platformProvider.isCordova;
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    this.token = this.navParamsData?.token;
    this.addressToken = this.navParamsData?.tokenAddress || null;
    this.showShareButton = this.platformProvider?.isCordova;
  }

  ngOnInit() {
    this.logger.info('Loaded: CustomAmountTokenPage');
    this.getAmountCustom();
  }

  public getAmountCustom() {
    if (this.amountCustomForm.value.amountCustom > 0) {
      this.qrAddress = this.addressToken +
        '?amount1=' +
        this.amountCustomForm.value.amountCustom +
        '-' + this.token?.tokenId;
    }
    else {
      this.qrAddress = this.addressToken;
    }
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

