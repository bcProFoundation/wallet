import {
  Component,
  ElementRef,
  NgZone,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as _ from 'lodash';
import { ReCaptchaV3Service } from 'ng-recaptcha';

// Providers
import {
  AppProvider,
  EventManagerService,
  LixiLotusProvider,
  LoadingProvider,
  Logger,
  PersistenceProvider,
  PlatformProvider,
  ProfileProvider,
  RateProvider,
  ThemeProvider,
  TokenProvider,
  WalletProvider
} from '../../providers';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../providers/config/config';

// Pages
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ClaimVoucherModalComponent } from 'src/app/components/page-claim-modal/claim-voucher-modal.component';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styleUrls: ['home.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage {
  @ViewChild('homeToolbar') homeToolbar: ElementRef;
  public totalBalanceAlternative: string;
  public totalBalanceAlternativeIsoCode: string;
  public totalBalanceChange: number;
  public showTotalBalance: boolean = true;
  public fetchingStatus: boolean;
  public accessDenied: boolean;
  public isCopay: boolean;
  public currentTheme: any;
  public isCordova: boolean;
  private zone;
  public txpsN: number;
  public isScroll: boolean;
  public walletGroupsHome: Array<any> = [];
  public removeAllItem: boolean = false;
  public isShowBalance: boolean = false;
  public loading: boolean = false;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private router: Router,
    private configProvider: ConfigProvider,
    private events: EventManagerService,
    public platformProvider: PlatformProvider,
    private modalCtrl: ModalController,
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private rateProvider: RateProvider,
    private themeProvider: ThemeProvider,
    private tokenProvider: TokenProvider,
    private loadingProvider: LoadingProvider,
    private lixiLotusProvider: LixiLotusProvider,
    private recaptchaV3Service: ReCaptchaV3Service,
    private walletProvider: WalletProvider
  ) {
    this.currentTheme = this.themeProvider.currentAppTheme;
    this.logger.info('Loaded: HomePage');
    this.isCopay = this.appProvider.info.name === 'copay';
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.subscribeEvents();
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillEnter() {
    const config = this.configProvider.get();
    this.totalBalanceAlternativeIsoCode =
      config.wallet.settings.alternativeIsoCode;
    this.showTotalBalance = config.totalBalance.show;
    if (this.showTotalBalance)
      this.updateTotalBalance(this.appProvider.homeBalance);
    this.updateTxps();
  }

  ngOnInit() {
    this.preFetchWallets();
    this.themeProvider.themeChange.subscribe(() => {
      this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    });
    //Get Primary account in LocalStorage & fetch to update data
    this.getWalletGroupsHomeTemp();
    this.loadToken(true);
    // Required delay to improve performance loading
    setTimeout(() => {
      this.checkAltCurrency(); // Check if the alternative currency setted is no longer supported
    }, 2000);
  }

  async handleScrolling(event) {
    if (event.detail.currentY > 0) {
      this.isScroll = true;
    } else {
      this.isScroll = false;
    }
  }

  public async loadToken(isFetchData?: boolean) {
    let wallets = this.profileProvider.wallet;
    for (const i in wallets) {
      const wallet = wallets[i];
      await this.tokenProvider.loadTokenWallet(wallet);
    }
    if (isFetchData) {
      this.walletGroupsHome = await this.profileProvider.getWalletGroupsHome();
      this.loading = false;
    }
  }

  public async getWalletGroupsHome() {
    this.loading = true;
    this.walletGroupsHome = await this.profileProvider.getWalletGroupsHome();
    if (this.walletGroupsHome.length <= 1) this.removeAllItem = false;
    this.loading = false;
  }

  public getWalletGroupsHomeTemp() {
    const walletGroupsHome = this.profileProvider.getWalletGroupsHomeTemp();
    if (walletGroupsHome.includes(undefined)) {
      this.loading = true;
    } else {
      this.walletGroupsHome = walletGroupsHome;
    }
    if (this.walletGroupsHome.length <= 1) this.removeAllItem = false;
  }

  private updateTxps() {
    this.profileProvider
      .getTxps({ limit: 3 })
      .then(data => {
        this.events.publish('Local/UpdateTxps', {
          n: data.n
        });
        this.zone.run(() => {
          this.txpsN = data.n;
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private updateTotalBalance(data) {
    if (!data) return;
    this.zone.run(() => {
      this.totalBalanceAlternative = data.totalBalanceAlternative;
      this.totalBalanceChange = data.totalBalanceChange;
      this.totalBalanceAlternativeIsoCode = data.totalBalanceAlternativeIsoCode;
    });
  }

  private setTotalBalance(data) {
    this.updateTotalBalance(data);
    this.appProvider.homeBalance = data;
    this.persistenceProvider.setTotalBalance(data);
  }

  private subscribeEvents() {
    this.events.subscribe('Local/HomeBalance', data => {
      if (data && this.showTotalBalance) this.setTotalBalance(data);
      else {
        this.totalBalanceAlternative = '0';
      }
      this.fetchingStatus = false;
    });
    this.events.subscribe('Local/GetListPrimary', data => {
      if (data) this.getWalletGroupsHome();
    });
    this.events.subscribe('Local/AccessDenied', () => {
      this.accessDenied = true;
    });
    this.events.subscribe('Local/ConnectionError', () => {
      this.fetchingStatus = false;
    });
    this.events.subscribe('Local/ClaimVoucher', claimCode => {
      this.handleQrScanVoucher(claimCode);
    });
  }

  private preFetchWallets() {
    // Avoid heavy tasks that can slow down the unlocking experience
    if (this.appProvider.isLockModalOpen) return;
    this.fetchingStatus = true;
    this.events.publish('Local/FetchWallets');
  }

  public doRefresh(refresher) {
    this.preFetchWallets();
    setTimeout(() => {
      refresher.target.complete();
      this.updateTxps();
      this.getWalletGroupsHome();
    }, 2000);
  }

  private showInfoSheet(altCurrency): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'unsupported-alt-currency',
      altCurrency
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        this.router.navigate(['/tabs/setting']).then(() => {
          this.router.navigate(['/alt-curency']);
        });
      }
    });
  }

  private checkAltCurrency(): void {
    const config = this.configProvider.get();
    const altCurrency = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    if (
      !this.rateProvider.isAltCurrencyAvailable(altCurrency.isoCode) &&
      !_.isEmpty(this.rateProvider.alternatives)
    ) {
      this.showInfoSheet(altCurrency);
    }
  }

  public openSettingPage() {
    this.router.navigate(['/setting']);
  }

  public openProposalsNotificationsPage(): void {
    this.router.navigate(['/proposals-notifications']);
  }

  public openChartViewPage(): void {
    this.router.navigate(['/chart-view']);
  }

  public addToHome(coin?: string, network?: string) {
    this.router.navigateByUrl('/accounts-page', {
      state: {
        isAddToHome: true,
        coin: coin,
        network: network
      }
    });
  }

  public async handleQrScanVoucher(claimCode) {
    // Get first wallet lotus in home list
    let wallet = this.profileProvider.getFirstLotusWalletHome();
    this.executeImportantAction();
    if (!_.isEmpty(wallet)) {
      let message = 'Loading...';
      let claimWalletAddress = '';
      let codeClaimSplit = claimCode?.value
        ? claimCode?.value.replace('lixi_', '')
        : '';
      this.loadingProvider.simpleLoader(message);
      await this.walletProvider.getAddress(wallet, false).then(addr => {
        return addr ? (claimWalletAddress = addr) : (claimWalletAddress = '');
      });
      if (claimCode?.value) claimCode.value.replace('lixi_', '');
      const bodyClaim = {
        captchaToken: 'isAbcpay',
        claimAddress: claimWalletAddress,
        claimCode: codeClaimSplit
      };
      this.logger.info('Body claim', bodyClaim);
      // Call provider to claim xpi from lixilotus/api
      await this.lixiLotusProvider
        .claimVoucher(bodyClaim)
        .then(async data => {
          this.logger.info('Response claim', data);
          const copayerModal = await this.modalCtrl.create({
            component: ClaimVoucherModalComponent,
            componentProps: {
              result: { ...data, ...wallet }
            },
            cssClass: 'recevied-voucher-success',
            initialBreakpoint: 0.4
          });
          // Update balance card home
          this.events.publish('Local/FetchWallets');
          await copayerModal.present();
          this.events.publish('Local/GetListPrimary', true);
          this.loadingProvider.dismissLoader();
          copayerModal.onDidDismiss().then(({ data }) => {});
        })
        .catch(err => {
          this.logger.error('Response claim err', err);
          const infoSheet = this.actionSheetProvider.createInfoSheet(
            'process-fail-voucher'
          );
          infoSheet.present();
          this.loadingProvider.dismissLoader();
          infoSheet.onDidDismiss(async option => {
            if (option) {
              this.router.navigate(['/tabs/scan']);
            }
          });
        });
    } else {
      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'process-select-wallet'
      );
      infoSheet.present();
      this.loadingProvider.dismissLoader();
      infoSheet.onDidDismiss(async option => {
        if (option) {
          this.addToHome('xpi', 'livenet');
        }
      });
    }
  }

  public executeImportantAction(): void {
    this.recaptchaV3Service
      .execute('getTokenForVoucher')
      .subscribe(token => console.log('****** TOKEN' + token));
  }
}
