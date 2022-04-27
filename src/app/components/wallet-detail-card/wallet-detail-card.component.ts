import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetProvider, AddressProvider, AppProvider, BwcErrorProvider, ConfigProvider, CurrencyProvider, ErrorsProvider, EventManagerService, Logger, ProfileProvider, RateProvider, TokenProvider, WalletProvider } from 'src/app/providers';
import { DecimalFormatBalance } from 'src/app/providers/decimal-format.ts/decimal-format';
import * as _ from 'lodash';
import { TokenInforPage } from 'src/app/pages/token-info/token-info';
import { ModalController } from '@ionic/angular';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { timer } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const MIN_UPDATE_TIME = 2000;

@Component({
  selector: 'wallet-detail-card',
  templateUrl: './wallet-detail-card.component.html',
  styleUrls: ['./wallet-detail-card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WalletDetailCardComponent implements OnInit {
  @Input()
  wallet: any;

  @Input()
  address: any;
  
  @Input()
  walletNotRegistered: any;
  
  @Input()
  token: any;

  @Input()
  isToken: boolean = false;
  
  @Input()
  amountToken: any;

  public currentTheme: string;
  public hiddenBalance: boolean;
  private listEToken = ['EAT', 'DoC', 'bcPro'];
  public typeErrorQr =  NgxQrcodeErrorCorrectionLevels;
  public loading: boolean;
  public newAddressError: boolean;
  public playAnimation: boolean;
  private retryCount: number = 0;
  public bchAddrFormat: string;
  public bchCashAddress: string;
  public isEditNameFlag: boolean = false;

  constructor(
    private appProvider: AppProvider,
    private actionSheetProvider: ActionSheetProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider,
    private events: EventManagerService,
    private modalCtrl: ModalController,
    private profileProvider: ProfileProvider,
    private router: Router,
    private walletProvider: WalletProvider,
    private logger: Logger,
    private bwcErrorProvider: BwcErrorProvider,
    private addressProvider: AddressProvider,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider,
  ) {
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }

  ngOnInit() {
    this.hiddenBalance = this.wallet.balanceHidden;
    this.bchAddrFormat = 'cashAddress';
  }


  public updateAll = _.debounce(
    (opts?) => {
      opts = opts || {};
      this.events.publish('Local/WalletFocus', {
        walletId: this.wallet.credentials.walletId,
        force: true
      });
    },
    MIN_UPDATE_TIME,
    {
      leading: true
    }
  );

  public formatTxAmount(amount: any) {
    return DecimalFormatBalance(amount);
  }

  public getAlternativeBalance() {
    const totalBalanceAlternative =
      this.wallet.cachedStatus &&
      this.wallet.cachedStatus.totalBalanceAlternative;
    return DecimalFormatBalance(totalBalanceAlternative);
  }

  public isUtxoCoin(): boolean {
    return this.currencyProvider.isUtxoCoin(this.wallet.coin);
  }

  public getBalance() {
    const lastKnownBalance = this.wallet.lastKnownBalance;
    if (this.wallet.coin === 'xrp') {
      const availableBalanceStr =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.availableBalanceStr;
      return availableBalanceStr || lastKnownBalance;
    } else {
      const totalBalanceStr =
        this.wallet.cachedStatus && this.wallet.cachedStatus.totalBalanceStr;
      return totalBalanceStr || lastKnownBalance;
    }
  }

  public toggleBalance() {
    this.hiddenBalance = !this.hiddenBalance;
    this.profileProvider.toggleHideBalanceFlag(
      this.wallet.credentials.walletId
    );
  }

  public openWalletSettings(id) {
    this.router.navigate(['/wallet-settings'], {
      state: {
        walletId: id
      }
    });
  }

  public goToTokenInfo() {
    this.modalCtrl.create(
      {
        component: TokenInforPage,
        componentProps: {
          walletId: this.wallet.credentials.walletId,
          tokenInfo: this.token.tokenInfo
        }
      }).then(res => {
        res.present();
      })
  }

  public setIconToken(token) {
    const isValid = this.listEToken.includes(token?.tokenInfo?.symbol);
    return isValid ? `assets/img/currencies/${token?.tokenInfo?.symbol}.svg` : 'assets/img/currencies/xec.svg';
  }

  public goToMultisignInfo() {
    const receive = this.actionSheetProvider.createMultisignInfo(this.wallet);
      receive.present();
      receive.onDidDismiss(data => {
        if (data) console.log('close action multisig');
      });
  }

  public async setAddress(newAddr?: boolean, failed?: boolean): Promise<void> {
    if (
      !this.wallet ||
      !this.wallet.isComplete() ||
      (this.wallet.needsBackup && this.wallet.network == 'livenet')
    )
      return;

    this.loading = newAddr || _.isEmpty(this.address) ? true : false;

    this.walletProvider
      .getAddress(this.wallet, newAddr)
      .then(addr => {
        this.newAddressError = false;
        this.loading = false;
        if (!addr) return;
        const address = this.walletProvider.getAddressView(
          this.wallet.coin,
          this.wallet.network,
          addr
        );
        if (this.address && this.address != address) {
          this.playAnimation = true;
        }
        if (this.wallet.coin === 'bch' || this.wallet.coin === 'xec') this.bchCashAddress = address;

        this.updateQrAddress(address, newAddr);
      })
      .catch(err => {
        this.logger.warn('Retrying to create new adress:' + ++this.retryCount);
        if (this.retryCount > 3) {
          this.retryCount = 0;
          this.loading = false;
          // this.dismiss(err);
        } else if (err == 'INVALID_ADDRESS') {
          // Generate new address if the first one is invalid ( fix for concatenated addresses )
          if (!failed) {
            this.setAddress(newAddr, true);
            this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
            return;
          }
          this.setAddress(false); // failed to generate new address -> get last saved address
        } else {
          this.setAddress(false); // failed to generate new address -> get last saved address
        }
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
      });
  }

  private async updateQrAddress(address, newAddr?: boolean): Promise<void> {
    if (this.wallet.coin === 'bch') {
      address =
        this.bchAddrFormat === 'legacy'
          ? this.addressProvider.getLegacyBchAddressFormat(this.bchCashAddress)
          : this.bchCashAddress;
    }
    if (newAddr) {
      await timer(400).toPromise();
    }
    this.address = address;

    await timer(200).toPromise();
    this.playAnimation = false;
  }

  public goToReceivePage() {
    if (this.wallet && this.wallet.isComplete() && this.wallet.needsBackup) {
      const needsBackup = this.actionSheetProvider.createNeedsBackup();
      needsBackup.present();
      needsBackup.onDidDismiss(data => {
        if (data === 'goToBackup') this.goToBackup();
      });
    } else {
      const params = {
        wallet: this.wallet
      };
      const receive = this.actionSheetProvider.createWalletReceive(params);
      receive.present();
      receive.onDidDismiss(data => {
        if (data) this.showErrorInfoSheet(data);
      });
    }
  }

  public goToBackup(): void {
    this.router.navigate(['/backup-key'], {
      state: { keyId: this.wallet.credentials.keyId }
    });
  }

  public showErrorInfoSheet(error: Error | string): void {
    const infoSheetTitle = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(
      this.bwcErrorProvider.msg(error),
      infoSheetTitle
    );
  }

  public onClickOutSide(ev) {
    if (!ev.target.className.includes('btn-edit-name')) {
      this.isEditNameFlag = false;
    }
  }

  public editAccountName() {
    if (this.isEditNameFlag) {
      let opts = {
        aliasFor: {}
      };
      opts.aliasFor[
        this.wallet.credentials.walletId
      ] = this.wallet.name;
      this.configProvider.set(opts);
      this.events.publish('Local/ConfigUpdate', {
        walletId: this.wallet.credentials.walletId
      });
      this.profileProvider.setOrderedWalletsByGroup();
    }
    this.isEditNameFlag = !this.isEditNameFlag;
  }
}
