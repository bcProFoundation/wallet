import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetProvider,
  AddressProvider,
  AppProvider,
  BwcErrorProvider,
  ConfigProvider,
  CurrencyProvider,
  ErrorsProvider,
  EventManagerService,
  Logger,
  PlatformProvider,
  ProfileProvider,
  RateProvider,
  TokenProvider,
  WalletProvider
} from 'src/app/providers';
import { DecimalFormatBalance } from 'src/app/providers/decimal-format.ts/decimal-format';
import * as _ from 'lodash';
import { TokenInforPage } from 'src/app/pages/token-info/token-info';
import {
  IonItemSliding,
  ModalController,
  ToastController
} from '@ionic/angular';
import { NgxQrcodeErrorCorrectionLevels } from '@techiediaries/ngx-qrcode';
import { timer } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const configProvider = require('src/assets/appConfig.json');
const MIN_UPDATE_TIME = 2000;

@Component({
  selector: 'wallet-detail-card',
  templateUrl: './wallet-detail-card.component.html',
  styleUrls: ['./wallet-detail-card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WalletDetailCardComponent {
  @Input()
  wallet: any;

  @Input()
  isHomeCard: boolean = false;

  @Input()
  walletNotRegistered: any;

  @Input()
  token: any;

  @Input()
  isToken: boolean = false;

  @Input()
  flagAllItemRemove: boolean = false;

  @Output() genNewAddressEvent = new EventEmitter<boolean>();

  @ViewChild('slidingItem') slidingItem: IonItemSliding;
  @ViewChild('itemWallet') itemWallet: ElementRef;

  public currentTheme: string;
  public hiddenBalance: boolean;
  listEToken = ['EAT', 'DoC', 'bcPro', 'LPSe', 'eHNL', 'eLPS', 'USDR', '🎖MVP', 'BUX'];
  public typeErrorQr = NgxQrcodeErrorCorrectionLevels;
  public loading: boolean;
  public newAddressError: boolean;
  public playAnimation: boolean;
  private retryCount: number = 0;
  public bchAddrFormat: string;
  public bchCashAddress: string;
  public isEditNameFlag: boolean = false;
  public amountToken: string;
  public address: string;
  public flagOptionRemove: boolean = false;

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
    private toastController: ToastController,
    public platformProvider: PlatformProvider
  ) {
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }

  ngOnInit() {
    this.getAddressWallet();
    this.hiddenBalance = this.wallet.balanceHidden;
    this.bchAddrFormat = 'cashAddress';
    this.checkCardExistListPrimary();
    if (this.isToken) {
      this.amountToken = `${this.token.amountToken} ${this.token.tokenInfo.symbol}`;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.flagAllItemRemove) {
      this.flagAllItemRemove = changes.flagAllItemRemove.currentValue;
      if (this.flagAllItemRemove) {
        if (this.slidingItem) this.slidingItem.open('end');
      } else {
        if (this.slidingItem) this.slidingItem.close();
      }
    }
    this.events.subscribe('Local/Update Amount Token', data => {
      if (data) this.amountToken = data;
    });
  }

  ngAfterViewInit() {
    if (this.flagAllItemRemove) {
      this.slidingItem.open('end');
    } else {
      this.slidingItem.close();
    }
  }

  getAddressWallet() {
    this.walletProvider.getAddress(this.wallet, undefined).then(addr => {
      if (!addr) return;
      const address = this.walletProvider.getAddressView(
        this.wallet.coin,
        this.wallet.network,
        addr
      );
      this.address = address;
    }).finally(() => {
      if (this.isHomeCard && !this.address) {
        this.retryGetAddressWallet();
      }
    })
  }

  retryGetAddressWallet() {
    const walletId = this.wallet.id || null;
    const wallet = this.profileProvider.getWallet(walletId);
    if (wallet) this.wallet = wallet;
    this.walletProvider.getAddress(this.wallet, undefined).then(addr => {
      if (!addr) return;
      const address = this.walletProvider.getAddressView(
        this.wallet.coin,
        this.wallet.network,
        addr
      );
      this.address = address;
    })
  }

  handleOnDrag() {
    let element = this.itemWallet.nativeElement;
    this.flagOptionRemove
      ? (element.style.background = '#677A87')
      : (element.style.background = '#30885a');
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

  private checkCardExistListPrimary() {
    let data = JSON.parse(localStorage.getItem('listHome'));
    let isExist = _.find(
      data,
      item =>
        item.walletId === this.wallet.id &&
        item?.tokenId === this.token?.tokenId
    );
    this.flagOptionRemove = !!isExist;
  }

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
    this.events.publish('Local/GetListPrimary', true);
  }

  public openWalletSettings(id) {
    this.router.navigate(['/wallet-settings'], {
      state: {
        walletId: id
      }
    });
  }

  public goToTokenInfo() {
    this.modalCtrl
      .create({
        component: TokenInforPage,
        componentProps: {
          walletId: this.wallet.credentials.walletId,
          tokenInfo: this.token.tokenInfo
        }
      })
      .then(res => {
        res.present();
      });
  }

  public setIconToken(token) {
    const isValid = this.listEToken.includes(token?.tokenInfo?.symbol);
    if (token?.tokenInfo?.name == 'MVP') {
      return `assets/img/currencies/${token?.tokenInfo?.name}.svg`
    }
    return isValid
      ? `assets/img/currencies/${token?.tokenInfo?.symbol}.svg`
      : 'assets/img/currencies/eToken.svg';
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
        if (this.wallet.coin === 'bch' || this.wallet.coin === 'xec')
          this.bchCashAddress = address;

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
    if (this.wallet && this.wallet.etokenAddress) {
      const { prefix, type, hash } =
        this.addressProvider.decodeAddress(address);
      this.wallet.etokenAddress = this.addressProvider.encodeAddress(
        'etoken',
        type,
        hash,
        address
      );
    }
    this.genNewAddressEvent.emit(true);
    await timer(200).toPromise();
    this.playAnimation = false;
  }

  public goToReceivePage() {
    if (this.wallet && this.wallet.needsBackup) {
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
      opts.aliasFor[this.wallet.credentials.walletId] = this.wallet.name;
      this.configProvider.set(opts);
      this.events.publish('Local/ConfigUpdate', {
        walletId: this.wallet.credentials.walletId
      });
      this.profileProvider.setOrderedWalletsByGroup();
      this.events.publish('Local/GetListPrimary', true);
    }
    this.isEditNameFlag = !this.isEditNameFlag;
  }

  public goToSendPage() {
    this.router.navigate(['/send-page'], {
      state: {
        walletId: this.wallet.id,
        isSendFromHome: true
      }
    });
  }

  public goToSendPageToken() {
    if (
      this.wallet.cachedStatus.availableBalanceSat < configProvider.eTokenFee
    ) {
      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'no-amount-xec',
        { secondBtnGroup: true, isShowTitle: false }
      );
      infoSheet.present();
    } else {
      this.router.navigate(['/send-page'], {
        state: {
          walletId: this.wallet.id,
          token: this.token,
          isSendFromHome: true
        }
      });
    }
  }

  public removeOutGroupsHome() {
    if (this.profileProvider.isLastItemPrimaryList()) {
      this.presentToast(
        'Can not remove the last account in Home!',
        'toast-warning'
      );
    } else {
      let walletObj = {
        walletId: this.wallet.id,
        tokenId: this.token?.tokenId
      };
      let result = this.profileProvider.removeWalletGroupsHome(walletObj);
      if (result) {
        this.presentToast('Removed account successfully!');
        this.events.publish('Local/GetListPrimary', true);
        this.flagOptionRemove = !this.flagOptionRemove;
        this.handleOnDrag();
      } else {
        this.presentToast('Removed account unsuccessfully!');
      }
    }
  }

  public addToGroupsHome() {
    let walletObj = {
      walletId: this.wallet?.id,
      tokenId: this.token?.tokenId
    };
    let result = this.profileProvider.setWalletGroupsHome(walletObj);
    if (result && result.added.status) {
      this.router.navigate(['/tabs/home']).then(() => {
        this.events.publish('Local/GetListPrimary', true);
        this.presentToast(result.added.message);
      });
    } else if (result && result.full.status) {
      this.presentToast(result.full.message, 'toast-warning');
    } else if (result && result.duplicate.status) {
      this.presentToast(result.duplicate.message, 'toast-info');
    }
  }

  async presentToast(finishText, cssClass?) {
    const toast = await this.toastController.create({
      message: this.translate.instant(finishText),
      duration: 3000,
      position: 'bottom',
      animated: true,
      cssClass: `custom-finish-toast ${cssClass}`
    });
    toast.present();
  }

  public goToAccountDetail() {
    if (!this.token) {
      this.router.navigate(['/wallet-details'], {
        state: {
          walletId: this.wallet.credentials.walletId
        }
      });
    } else {
      this.router.navigate(['/token-details'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          token: this.token
        }
      });
    }
  }
}
