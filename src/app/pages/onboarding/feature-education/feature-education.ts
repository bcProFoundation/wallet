import {
  Component,
  NgZone,
  ViewChild,
  ViewEncapsulation,
  AfterContentChecked
} from '@angular/core';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';

// Pages
import { ExternalLinkProvider } from 'src/app/providers/external-link/external-link';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SwiperComponent } from 'swiper/angular';
import { Pagination, SwiperOptions } from 'swiper';
import SwiperCore from 'swiper';
import {
  BwcErrorProvider,
  ErrorsProvider,
  EventManagerService,
  LoadingProvider,
  OnGoingProcessProvider,
  ProfileProvider,
  PushNotificationsProvider,
  ThemeProvider,
  WalletProvider
} from 'src/app/providers';
import { TranslateService } from '@ngx-translate/core';

SwiperCore.use([Pagination]);
@Component({
  selector: 'page-feature-education',
  templateUrl: 'feature-education.html',
  styleUrls: ['./feature-education.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FeatureEducationPage {
  @ViewChild('swiper', { static: true }) swiper: SwiperComponent;

  public isCordova: boolean;
  public selectedTheme;
  slideEnd: boolean = false;
  private params = {
    isOnboardingFlow: true,
    isZeroState: true,
    isSimpleFlow: false,
    isFirstImport: false
  };

  config: SwiperOptions = {
    slidesPerView: 1,
    pagination: true,
    speed: 400,
    resistanceRatio: 0
  };
  zone;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private configProvider: ConfigProvider,
    private platformProvider: PlatformProvider,
    private router: Router,
    private themeProvider: ThemeProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private events: EventManagerService,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private errorsProvider: ErrorsProvider,
    private loadingProvider: LoadingProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.isCordova = this.platformProvider.isCordova;
    this.selectedTheme = this.themeProvider.currentAppTheme;
  }
  ngAfterViewInit() {
    this.swiper.swiperRef.allowSlidePrev = true;
  }
  ngOnInit() {
    this.logger.info('Loaded: FeatureEducationPage');
  }

  public slideChanged() {
    // Disable first bounce
    this.zone.run(() => {
      this.swiper.swiperRef.update();
      this.slideEnd = this.swiper.swiperRef.isEnd;
      if (this.swiper.swiperRef.isBeginning) {
        this.swiper.swiperRef.allowSlidePrev = false;
      }
    });
  }

  public goToNextPage(nextViewName: string): void {
    if (nextViewName === 'SelectCurrencyPage') {
      this.createSimpleFlow();
    } else {
      const config = this.configProvider.get();
      if ((config.lock && config.lock.method) || !this.isCordova) {
        this.params.isSimpleFlow = true;
        this.params.isFirstImport = true;
        this.router.navigate(['/import-wallet'], {
          state: this.params
        });
      } else {
        this.goToLockMethodPage(nextViewName);
      }
    }
  }

  private createSimpleFlow() {
    this.onGoingProcessProvider.set('creatingWallet');
    // if case full flow do not skip ask encrypt password
    this.profileProvider
      .createDefaultWalletsForSimpleFlow(false)
      .then(async wallets => {
        this.walletProvider.updateRemotePreferences(wallets);
        this.pushNotificationsProvider.updateSubscription(wallets);
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.profileProvider.setNewWalletGroupOrder(
          wallets[0].credentials.keyId
        );
        // if case full flow do not skip recover phrase
        this.endProcess(wallets[0].credentials.keyId, false);
        this.loadingProvider.dismissLoader();
      })
      .catch(e => {
        this.showError(e);
        this.loadingProvider.dismissLoader();
      });
  }
  private showError(err) {
    this.onGoingProcessProvider.clear();
    this.logger.error('Create: could not create wallet', err);
    const title = this.translate.instant('Error');
    err = this.bwcErrorProvider.msg(err);
    this.errorsProvider.showDefaultError(err, title);
  }

  private endProcess(keyId: string, skipRecoveryPhrase?: boolean) {
    this.onGoingProcessProvider.clear();
    if (!!skipRecoveryPhrase) {
      this.profileProvider.setBackupGroupFlag(keyId);
      const opts = {
        keyId: keyId,
        showHidden: true
      };
      const wallets = this.profileProvider.getWalletsFromGroup(opts);
      wallets.forEach(w => {
        this.profileProvider.setWalletBackup(w.credentials.walletId);
      });
      this.router.navigate(['']).then(() => {
        this.events.publish('Local/FetchWallets');
      });
    } else {
      this.router.navigate(['/recovery-key'], {
        state: {
          keyId,
          isOnboardingFlow: this.params.isOnboardingFlow,
          hideBackButton: true
        }
      });
    }
  }

  private goToLockMethodPage(name: string): void {
    let nextView = {
      name,
      params: this.params
    };
    this.router.navigate(['/lock-method'], {
      state: {
        nextView
      }
    });
  }

  public openLink(url) {
    this.externalLinkProvider.open(url);
  }
}
