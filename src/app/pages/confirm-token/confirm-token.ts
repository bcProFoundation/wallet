import { HttpClient } from "@angular/common/http";
import { Component, ViewChild, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { ModalController } from '@ionic/angular';
import _ from "lodash";
import { KeyProvider } from "src/app/providers/key/key";
import { ProfileProvider } from "src/app/providers/profile/profile";
import { TokenProvider } from "src/app/providers/token-sevice/token-sevice";
import { WalletProvider } from "src/app/providers/wallet/wallet";
import { PlatformProvider } from "src/app/providers/platform/platform";
import { TranslateService } from "@ngx-translate/core";
import { Coin, CurrencyProvider } from "src/app/providers/currency/currency";
import { FinishModalPage } from "../finish/finish";
import { Logger } from "src/app/providers/logger/logger";
import { ErrorsProvider } from "src/app/providers/errors/errors";
import { BwcErrorProvider } from "src/app/providers/bwc-error/bwc-error";
import { Location } from '@angular/common';
import { OnGoingProcessProvider } from "src/app/providers/on-going-process/on-going-process";
import { AddressBookProvider, EventManagerService } from "src/app/providers";
import { EventsService } from "src/app/providers/events.service";

@Component({
  selector: 'confirm-token',
  templateUrl: 'confirm-token.html',
  styleUrls: ['confirm-token.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfirmTokenPage {
  @ViewChild('slideButton')
  slideButton;
  navPramss;
  wallet;
  token;
  amountTokenToSend;
  amount;
  selectedTheme;
  hideSlideButton: boolean;
  isCordova: boolean;
  buttonText: string;
  successText: string;
  sendToAddress: string;
  fee: number
  precision;
  toAddressName;
  nameContact;
  isSendFromHome: boolean = false;
  constructor(
    public http: HttpClient,
    private router: Router,
    private profileProvider: ProfileProvider,
    private tokenProvider: TokenProvider,
    private walletProvider: WalletProvider,
    private events: EventManagerService,
    private keyProvider: KeyProvider,
    private platformProvider: PlatformProvider,
    private translate: TranslateService,
    private currencyProvider: CurrencyProvider,
    private modalCtrl: ModalController,
    private logger: Logger,
    private errorsProvider: ErrorsProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private location: Location,
    private eventsService: EventsService,
    private addressBookProvider: AddressBookProvider,
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.isSendFromHome = this.navPramss.isSendFromHome;
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.token = this.navPramss.token;
    this.sendToAddress = this.navPramss.toAddress;
    if (this.navPramss.useSendMax) {
      this.amountTokenToSend = this.token.amountToken;
      this.amount = this.token.amountToken * Math.pow(10, this.token.tokenInfo.decimals);
    }
    else {
      this.amount = this.navPramss.amount;
      this.amountTokenToSend = this.amount / Math.pow(10, this.token.tokenInfo.decimals);
    }
    this.isCordova = this.platformProvider.isCordova;
    this.hideSlideButton = false;
    this.setButtonText();
    this.fee = this.estimateFee();
  }

  ionViewDidEnter() {
    this.loadInit();
  }

  estimateFee() {
    // Send dust transaction representing tokens being sent.
    const dustRepresenting = 546;
    //  Return any token change back to the sender.
    const dustReturnAnyToken = 546
    // fee 
    const fee = 250;

    this.precision = _.get(this.currencyProvider.getPrecision(this.wallet.coin as Coin), 'unitToSatoshi', 0);
    if (this.precision == 0) return 0;
    return ((dustRepresenting + dustReturnAnyToken + fee) / this.precision)
  }

  loadInit() {
    if (this.isCordova) {
      window.addEventListener('keyboardWillShow', () => {
        this.hideSlideButton = true;
      });

      window.addEventListener('keyboardWillHide', () => {
        this.hideSlideButton = false;
      });
    }
  }

  private setButtonText() {
    this.buttonText = this.isCordova
      ? this.translate.instant('Slide to send')
      : this.translate.instant('Click to send');
    this.successText = this.translate.instant(' Sent Token Success');
  }

  ngOnInit() {
    this.checkExistContact();
    this.tokenProvider.getUtxosToken(this.wallet).then(utxos => {
      let amountXec = 0;
      let amountToken = 0
      _.forEach(utxos, item => {
        if (item.isNonSLP) {
          amountXec += item.value;
        } else {
          if (item.tokenId === this.token.tokenInfo.id)
            amountToken += item.amountToken;
        }
      })
      if (amountXec < this.fee * this.precision) this.showErrorInfoSheet(this.translate.instant('Not enough funds for fee'), null, true);
      if (amountToken < this.amount) this.showErrorInfoSheet(this.translate.instant('Not enough funds for fee'), null, true);
    }).catch(err => {
      this.showErrorInfoSheet(err, null, true);
    })
  }

  async approve(wallet) {
    if (this.nameContact && this.nameContact.trim().length > 0) {
      this.addressBookProvider
        .add({
          name: this.nameContact,
          email: '',
          address: this.sendToAddress,
          network: 'livenet',
          coin: 'xec'
        });
    }    
    this.walletProvider.prepare(wallet).then(pass => {
      const mnemonic = this.keyProvider.getMnemonic(wallet, pass);
      this.onGoingProcessProvider.set('Sending Token ...');
      this.tokenProvider.sendToken(wallet, mnemonic, this.token.tokenInfo, this.amountTokenToSend, this.sendToAddress).then(() => {
        this.onGoingProcessProvider.clear();
        // Update balance in card home
        this.events.publish('Local/GetListPrimary', true);
        this.annouceFinish();
      }).catch(err => {
        this.onGoingProcessProvider.clear();
        this.showErrorInfoSheet(err);
      })
    }, err => {
      this.onGoingProcessProvider.clear();
      this.showErrorInfoSheet(err);
    })

  }

  checkExistContact() {
    this.addressBookProvider.getContactName(this.sendToAddress, 'livenet')
    .then(rs => {
      {
        this.toAddressName = rs;
      }
    })
    .catch(err => console.log(err))
  }
  protected async annouceFinish() {
    let params: {
      finishText: string;
      finishComment?: string;
      autoDismiss?: boolean;
    } = {
      finishText: this.successText,
      autoDismiss: true
    };
    setTimeout(() => {
      this.router.navigate(['/tabs/wallets'], { replaceUrl: true },).then(() => {
        this.router.navigate(['/token-details'], {
          state: {
            walletId: this.wallet.credentials.walletId,
            token: this.token,
            finishParam: params,
            isSendFromHome: this.isSendFromHome
          }
        });
      })
      // TODO: Test handle key not update
      // .then(
      //   () => {
      //     this.eventsService.publishRefresh({
      //       keyId: this.wallet.keyId
      //     });
      //     this.events.publish('Local/GetData', true);
      //   }
      // );
    }, 50);
  }

  public showErrorInfoSheet(
    error: Error | string,
    title?: string,
    exit?: boolean
  ): void {
    let msg: string;
    if (!error) return;
    this.logger.warn('ERROR:', error);
    if (this.isCordova) this.slideButton.isConfirmed(false);

    if (
      (error as Error).message === 'FINGERPRINT_CANCELLED' ||
      (error as Error).message === 'PASSWORD_CANCELLED'
    ) {
      return;
    }

    if ((error as Error).message === 'WRONG_PASSWORD') {
      this.errorsProvider.showWrongEncryptPasswordError();
      return;
    }

    // Currently the paypro error is the following string: 500 - "{}"
    if (error.toString().includes('500 - "{}"')) {
      msg = this.translate.instant(
        'Error 500 - There is a temporary problem, please try again later.'
      );
    }

    const infoSheetTitle = title ? title : this.translate.instant('Error');

    this.errorsProvider.showDefaultError(
      msg || this.bwcErrorProvider.msg(error),
      infoSheetTitle,
      () => {
        if (exit) {
          this.location.back()
        }
      }
    );
  }
}