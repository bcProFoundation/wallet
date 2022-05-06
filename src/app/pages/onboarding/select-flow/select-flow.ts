import { Component, ViewEncapsulation } from '@angular/core';
import { getMatIconFailedToSanitizeLiteralError } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ModalController, NavController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetProvider, BwcErrorProvider, ConfigProvider, ErrorsProvider, EventManagerService, ExternalLinkProvider, LoadingProvider, Logger, OnGoingProcessProvider, PersistenceProvider, PlatformProvider, ProfileProvider, PushNotificationsProvider, WalletProvider } from 'src/app/providers';
import { ThemeProvider } from 'src/app/providers/theme/theme';
import { TouchIdProvider } from 'src/app/providers/touchid/touchid';

// Providers

@Component({
  selector: 'page-select-flow',
  templateUrl: 'select-flow.html',
  styleUrls: ['select-flow.scss'],
  encapsulation: ViewEncapsulation.None

})
export class SelectFlowPage {
  public unregister;
  public currentTheme: string;
  public flowOptions = [
    {
      isSimpleFlow: false,
      content: this.translate.instant('Most secure way to store cryptocurrency (Highly Recommended).')
    },
    {
      isSimpleFlow: true,
      content: this.translate.instant('I’m just playing around. Skip all the security steps and show me the wallet.')
    }
  ]
  constructor(
    public navCtrl: NavController,
    private logger: Logger,
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
    private loadingProvider: LoadingProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    // this.checkFingerprint();
    // Get Theme
    this.currentTheme = this.themeProvider.currentAppTheme;
  }
  public navigateNextView(isSimpleFlow) {
    if (isSimpleFlow) {
      this.createSimpleFlow();
    }
    else {
      this.router.navigate(['/feature-education'], {
        replaceUrl: true,
        state: { isSimpleFlow: isSimpleFlow }
      });
    }
  }

  private createSimpleFlow() {
    this.loadingProvider.simpleLoader();
    this.profileProvider.createDefaultWalletsForSimpleFlow(true).then(async wallets => {
      this.walletProvider.updateRemotePreferences(wallets);
      this.pushNotificationsProvider.updateSubscription(wallets);
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.profileProvider.setNewWalletGroupOrder(
        wallets[0].credentials.keyId
      );
      // if case full flow do not skip recover phrase
      this.endProcess(wallets[0].credentials.keyId);
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

  private endProcess(keyId: string) {
    this.onGoingProcessProvider.clear();
    this.profileProvider.setBackupGroupFlag(keyId);
    this.persistenceProvider.setKeyOnboardingFlag();
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
  }
}
