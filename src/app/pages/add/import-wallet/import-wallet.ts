import {
  Component,
  ElementRef,
  OnChanges,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

// Pages
import { CoinSelectorPage } from '../../includes/coin-selector/coin-selector';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import {
  WalletOptions,
  WalletProvider
} from '../../../providers/wallet/wallet';
import { ModalController, NavController, NavParams } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import _ from 'lodash';
import { DisclaimerModal } from '../../includes/disclaimer-modal/disclaimer-modal';
import { AppProvider, PersistenceProvider } from 'src/app/providers';
import { EventsService } from 'src/app/providers/events.service';
@Component({
  selector: 'page-import-wallet',
  templateUrl: 'import-wallet.html',
  styleUrls: ['import-wallet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ImportWalletPage {
  private reader: FileReader;
  private defaults;
  private processedInfo;
  private keyId: string;
  public availableCoins: string[];
  public importForm: UntypedFormGroup;
  public prettyFileName: string;
  public formFile;
  public selectedTab: string;
  public isCordova: boolean;
  public isSafari: boolean;
  public isIOS: boolean;
  public file: File;
  public code;
  public okText: string;
  public cancelText: string;
  public showAdvOpts: boolean;
  public title: string;
  public isOnboardingFlow: boolean;
  public isShoweTokenPath: boolean;
  public isSlpToken = false;
  public prevCoin: string;
  public currentTheme: string;
  public isSimpleFlow = false;
  public isFirstImport = false;

  navParamsData;

  @ViewChild('textarea', { static: false }) textarea: ElementRef;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private form: UntypedFormBuilder,
    private bwcProvider: BwcProvider,
    private walletProvider: WalletProvider,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private platformProvider: PlatformProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private events: EventManagerService,
    private pushNotificationsProvider: PushNotificationsProvider,
    private actionSheetProvider: ActionSheetProvider,
    public derivationPathHelperProvider: DerivationPathHelperProvider,
    private modalCtrl: ModalController,
    private bwcErrorProvider: BwcErrorProvider,
    private errorsProvider: ErrorsProvider,
    private router: Router,
    private appProvider: AppProvider,
    private persistenceProvider: PersistenceProvider,
    private eventsService: EventsService
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state
        ? this.router.getCurrentNavigation().extras.state
        : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');
    this.reader = new FileReader();
    this.defaults = this.configProvider.getDefaults();
    this.isCordova = this.platformProvider.isCordova;
    this.isSafari = this.platformProvider.isSafari;
    this.isIOS = this.platformProvider.isIOS;
    this.selectedTab = 'words';
    this.showAdvOpts = false;
    this.availableCoins = this.currencyProvider.getAvailableChains();

    this.code = this.navParamsData?.code;
    this.processedInfo = this.processWalletInfo(this.code);
    this.isOnboardingFlow = this.navParamsData?.isOnboardingFlow;

    this.keyId = this.navParamsData?.keyId; // re-import option
    if (this.navParamsData && this.navParamsData.isSimpleFlow) {
      this.isSimpleFlow = this.navParamsData.isSimpleFlow;
    }
    if (this.navParamsData && this.navParamsData.isFirstImport) {
      this.isFirstImport = this.navParamsData.isFirstImport;
    }
    this.title = !this.keyId
      ? this.translate.instant('Import Key')
      : this.translate.instant('Re-Import Keys');
    this.formFile = null;

    this.importForm = this.form.group({
      words: [null, Validators.required],
      backupText: [null],
      passphrase: [null],
      file: [null],
      filePassword: [null],
      derivationPathEnabled: [false],
      coin: ['btc'],
      derivationPath: [this.derivationPathHelperProvider.defaultBTC],
      bwsURL: [this.defaults.bws.url],
      isMultisig: [false],
      isSlpToken: [false]
    });
    this.events.subscribe('Local/BackupScan', this.updateWordsHandler);
    this.setForm();
  }

  ionViewWillEnter() {
    this.importForm.controls['words'].reset();
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/BackupScan', this.updateWordsHandler);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.textarea.nativeElement.focus();
    }, 300);
  }

  private setForm(): void {
    if (this.processedInfo) {
      this.importForm.controls['words'].setValue(this.processedInfo.data);
    }
  }

  private updateWordsHandler: any = data => {
    this.processedInfo = this.processWalletInfo(data.value);
    this.setForm();
  };

  public getCoinName(coin: Coin | any) {
    return this.currencyProvider.getCoinName(coin);
  }

  public handleClickAdvanceOption() {
    this.showAdvOpts = !this.showAdvOpts;
  }

  public selectTab(tab: string): void {
    this.selectedTab = tab;

    switch (tab) {
      case 'words':
        this.file = null;
        this.formFile = null;
        this.importForm.get('words').setValidators([Validators.required]);
        this.importForm.get('filePassword').clearValidators();
        if (this.isCordova || this.isSafari)
          this.importForm.get('backupText').clearValidators();
        else this.importForm.get('file').clearValidators();
        break;
      case 'file':
        if (this.isCordova || this.isSafari)
          this.importForm
            .get('backupText')
            .setValidators([Validators.required]);
        else this.importForm.get('file').setValidators([Validators.required]);
        this.importForm
          .get('filePassword')
          .setValidators([Validators.required]);
        this.importForm.get('words').clearValidators();
        break;

      default:
        this.importForm.get('words').clearValidators();
        this.importForm.get('file').clearValidators();
        this.importForm.get('filePassword').clearValidators();
        break;
    }
    this.importForm.get('words').updateValueAndValidity();
    this.importForm.get('file').updateValueAndValidity();
    this.importForm.get('filePassword').updateValueAndValidity();
    this.importForm.get('backupText').updateValueAndValidity();
  }

  private processWalletInfo(code: string) {
    if (!code) return undefined;

    const parsedCode = code.split('|');

    const info = {
      type: parsedCode[0],
      data: parsedCode[1],
      network: parsedCode[2],
      derivationPath: parsedCode[3], // deprecated
      hasPassphrase: parsedCode[4] == 'true' ? true : false,
      coin: parsedCode[5] // deprecated
    };
    if (!info.data) {
      this.showErrorInfoSheet(
        this.translate.instant('Error'),
        this.translate.instant('Invalid data')
      );
      return undefined;
    }
    if (info.type == '1' && info.hasPassphrase) {
      const title = this.translate.instant('Warning');
      const subtitle = this.translate.instant(
        'Password required. Make sure to enter your password in advanced options'
      );
      this.showErrorInfoSheet(title, subtitle);
    }
    return info;
  }

  private importBlob(str: string, opts): void {
    let str2: string;
    let err = null;
    try {
      str2 = this.bwcProvider
        .getSJCL()
        .decrypt(this.importForm.value.filePassword, str);
    } catch (e) {
      err = this.translate.instant(
        'Could not decrypt file, check your password'
      );
      this.logger.error('Import: could not decrypt file', e);
    }

    if (err) {
      const title = this.translate.instant('Error');
      this.showErrorInfoSheet(title, err);
      return;
    }

    this.onGoingProcessProvider.set('importingWallet');
    opts.compressed = null;
    opts.password = null;

    opts.keyId = this.keyId;

    this.profileProvider
      .importFile(str2, opts)
      .then((wallet: any[]) => {
        this.onGoingProcessProvider.clear();
        if (wallet) this.finish([].concat(wallet));
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        const title = this.translate.instant('Error');
        this.showErrorInfoSheet(title, err);
        return;
      });
  }

  private async finish(wallets: any[]) {
    this.onGoingProcessProvider.clear();
    wallets.forEach(wallet => {
      this.walletProvider.updateRemotePreferences(wallet);
      this.pushNotificationsProvider.updateSubscription(wallet);
      this.profileProvider.setWalletBackup(wallet.credentials.walletId);
    });
    if (wallets && wallets[0]) {
      this.profileProvider.setBackupGroupFlag(wallets[0].credentials.keyId);
      this.persistenceProvider.setKeyOnboardingFlag();
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.profileProvider.setNewWalletGroupOrder(wallets[0].credentials.keyId);
    }
    this.profileProvider.isDisclaimerAccepted().then(async onboardingState => {
      if (
        onboardingState === 'UNFINISHEDONBOARDING' ||
        onboardingState === 'SIMPLEFLOW'
      ) {
        const modal = await this.modalCtrl.create({
          component: DisclaimerModal,
          backdropDismiss: false,
          cssClass: 'fixscreen-modal'
        });
        await modal.present();
        modal.onDidDismiss().then(({ data }) => {
          if (data.isConfirm) {
            this.goToWalletsPage(wallets[0].credentials.keyId);
          }
        });
      } else if (this.keyId) {
        this.goToKeySettingPage(wallets[0].credentials.keyId);
      } else {
        this.goToWalletsPage(wallets[0].credentials.keyId);
      }
    });
  }

  private goToWalletsPage(keyId) {
    this.router
      .navigate(['/tabs/wallets'], {
        state: {
          isFirstInstall: true
        },
        replaceUrl: true
      })
      .then(() => {
        // TODO: Test handle key not update
        // this.eventsService.publishRefresh({
        //   keyId
        // });
        this.events.publish('Local/GetData', true);
        this.events.publish('Local/FetchWallets');
      });
  }

  private goToKeySettingPage(keyId) {
    this.router.navigate(['']).then(() => {
      this.router
        .navigate(['/key-settings'], {
          state: {
            keyId: keyId
          },
          replaceUrl: true
        })
        .then(() => {
          this.events.publish('Local/FetchWallets');
        });
    });
  }

  private importExtendedPrivateKey(xPrivKey, opts) {
    this.onGoingProcessProvider.set('importingWallet');
    this.profileProvider
      .importExtendedPrivateKey(xPrivKey, opts)
      .then((wallets: any[]) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallets);
      })
      .catch(err => {
        this.processError(err);
      });
  }

  private importWithDerivationPath(opts): void {
    const isFromRaipay =
      this.importForm.value.derivationPath === "m/44'/145'/0'";
    opts.isSlpToken = this.isSlpToken || isFromRaipay;
    opts.isFromRaipay = isFromRaipay;
    this.onGoingProcessProvider.set('importingWallet');
    this.profileProvider
      .importWithDerivationPath(opts)
      .then(wallet => {
        this.onGoingProcessProvider.clear();
        if (wallet) this.finish([].concat(wallet));
      })
      .catch(err => {
        this.processError(err);
      });
  }

  private importMnemonic(words: string, opts): void {
    this.onGoingProcessProvider.set('importingWallet');
    this.profileProvider
      .importMnemonic(words, opts)
      .then((wallets: any[]) => {
        this.onGoingProcessProvider.clear();
        this.finish(wallets);
      })
      .catch(err => {
        this.processError(err);
      });
  }

  private processError(err?) {
    if (err == 'WALLET_DOES_NOT_EXIST') {
      const noWalletWarningInfoSheet = this.actionSheetProvider.createInfoSheet(
        'import-no-wallet-warning'
      );

      noWalletWarningInfoSheet.present();
      noWalletWarningInfoSheet.onDidDismiss(async option => {
        if (option || typeof option === 'undefined') {
          // Go back
          this.logger.debug('Go back clicked');
          this.onGoingProcessProvider.clear();
        } else {
          // Continue anyway
          this.logger.debug('Continue anyway clicked');

          if (this.importForm.value.derivationPathEnabled) {
            this.setOptsAndCreate(
              this.importForm.value.coin,
              this.importForm.value.isSlpToken
            );
          } else {
            if (this.isFirstImport) {
              if (this.isSimpleFlow) {
                this.setOptsAndCreate(Coin.XPI, true, true);
              } else {
                this.setOptsAndCreate(Coin.XPI, true, true);
              }
            } else {
              const modal = await this.modalCtrl.create({
                component: CoinSelectorPage,
                componentProps: {
                  description: this.translate.instant(
                    'Please select the coin of the account to import:'
                  )
                },

                backdropDismiss: false,
                cssClass: 'fullscreen-modal'
              });
              await modal.present();
              modal.onDidDismiss().then(({ data }) => {
                if (data.selectedCoin) {
                  this.setOptsAndCreate(
                    data.selectedCoin,
                    this.importForm.value.isSlpToken
                  );
                }
              });
            }
          }
        }
      });
    } else {
      const title = this.translate.instant('Error');
      this.showErrorInfoSheet(title, this.bwcErrorProvider.msg(err));
      this.onGoingProcessProvider.clear();
    }
    return;
  }
  private getDefaultWalletOpts(coin): Partial<WalletOptions> {
    const defaults = this.configProvider.getDefaults();
    const opts: Partial<WalletOptions> = {
      name: this.currencyProvider.getCoinName(coin),
      m: 1,
      n: 1,
      myName: null,
      networkName: 'livenet',
      bwsurl: defaults.bws.url,
      singleAddress: this.currencyProvider.isSingleAddress(coin) || false,
      coin
    };
    if (coin === 'btc' || coin === 'ltc') opts.useNativeSegwit = true;
    return opts;
  }

  public setOptsAndCreate(
    coin: Coin,
    isSlpToken: boolean,
    isSimpleFlow?: boolean
  ): void {
    const isFromRaipay =
      this.importForm.value.derivationPath === "m/44'/145'/0'";
    let opts: Partial<WalletOptions> = {};
    if (!!isSimpleFlow) {
      opts = this.getDefaultWalletOpts(Coin.XPI);
      opts.name = `${opts.name} - 1899`;
      opts.isSlpToken = true;
      opts.singleAddress = false;
      coin = Coin.XPI;
    } else {
      if (isFromRaipay) {
        opts = this.getDefaultWalletOpts(Coin.XEC);
        opts.name = `${opts.name} - 145`;
        opts.isSlpToken = true;
        opts.isFromRaipay = true;
        opts.singleAddress = true;
        opts.isFromRaipay = isFromRaipay;
        coin = Coin.XEC;
      } else {
        opts = {
          keyId: undefined,
          name: this.currencyProvider.getCoinName(coin),
          m: 1,
          n: 1,
          myName: null,
          networkName: 'livenet',
          bwsurl: this.importForm.value.bwsURL,
          singleAddress: isSlpToken
            ? true
            : this.currencyProvider.isSingleAddress(coin),
          coin: Coin[coin.toUpperCase()],
          isSlpToken: isSlpToken || isFromRaipay,
          isFromRaipay: isFromRaipay
        };
      }
    }

    const words = this.importForm.value.words;
    if (
      words.indexOf(' ') == -1 &&
      words.indexOf('prv') == 1 &&
      words.length > 108
    ) {
      opts.extendedPrivateKey = words;
    } else {
      opts.mnemonic = words;
    }

    let derivationPath;
    if (!!isSimpleFlow) {
      derivationPath = this.derivationPathHelperProvider['defaultSlpToken'];
    } else if (this.importForm.value.derivationPathEnabled) {
      derivationPath = this.importForm.value.derivationPath;
    } else {
      if (this.derivationPathHelperProvider[`default${coin.toUpperCase()}`]) {
        derivationPath =
          this.derivationPathHelperProvider[`default${coin.toUpperCase()}`];
      } else {
        const title = this.translate.instant('Error');
        const subtitle = `No derivation path for: default${coin.toUpperCase()}`;
        this.showErrorInfoSheet(title, subtitle);
        return;
      }
    }
    opts.networkName =
      this.derivationPathHelperProvider.getNetworkName(derivationPath);
    opts.derivationStrategy =
      this.derivationPathHelperProvider.getDerivationStrategy(derivationPath);
    opts.account = this.derivationPathHelperProvider.getAccount(derivationPath);

    // set opts.useLegacyPurpose
    if (
      this.derivationPathHelperProvider.parsePath(derivationPath).purpose ==
        "44'" &&
      opts.n > 1
    ) {
      opts.useLegacyPurpose = true;
      this.logger.debug('Using 44 for Multisig');
    }

    // set opts.useLegacyCoinType
    if (
      coin == 'bch' &&
      this.derivationPathHelperProvider.parsePath(derivationPath).coinCode ==
        "0'"
    ) {
      opts.useLegacyCoinType = true;
      this.logger.debug('Using 0 for BCH creation');
    }

    if (
      !opts.networkName ||
      !opts.derivationStrategy ||
      !Number.isInteger(opts.account)
    ) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('Invalid derivation path');
      this.showErrorInfoSheet(title, subtitle);
      return;
    }

    if (!opts.mnemonic && !opts.extendedPrivateKey) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the account recovery phrase'
      );
      this.showErrorInfoSheet(title, subtitle);
      return;
    }

    if (
      !this.derivationPathHelperProvider.isValidDerivationPathCoin(
        derivationPath,
        coin
      )
    ) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Invalid derivation path for selected coin'
      );
      this.showErrorInfoSheet(title, subtitle);
      return;
    }
    if (
      (coin == 'xec' || coin == 'xpi') &&
      !this.importForm.value.derivationPathEnabled
    ) {
      this.createWalletTokensSpecifyingWords(opts, !!isSimpleFlow);
    } else {
      this.createSpecifyingWords(opts);
    }
  }

  private createWalletTokensSpecifyingWords(
    opts,
    isSimpleFlow?: boolean
  ): void {
    this.logger.debug('Creating from import');
    opts.isImport = true;
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createTokenWallets(opts, !!isSimpleFlow)
      .then(wallet => {
        if (wallet) this.finish([].concat(wallet));
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error('Create: could not create wallet', err);
        const title = this.translate.instant('Error');
        err = this.bwcErrorProvider.msg(err);
        this.showErrorInfoSheet(title, err);
      });
  }

  private createSpecifyingWords(opts): void {
    this.logger.debug('Creating from import');
    opts.isImport = true;
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createWallet(opts)
      .then(wallet => {
        if (wallet) this.finish([].concat(wallet));
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error('Create: could not create wallet', err);
        const title = this.translate.instant('Error');
        err = this.bwcErrorProvider.msg(err);
        this.showErrorInfoSheet(title, err);
      });
  }

  public import(): void {
    if (this.selectedTab === 'file') {
      this.importFromFile();
    } else {
      this.importFromMnemonic();
    }
  }

  public importFromFile(): void {
    if (!this.importForm.valid) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('There is an error in the form');
      this.showErrorInfoSheet(title, subtitle);
      return;
    }

    const backupFile = this.file;
    const backupText = this.importForm.value.backupText;

    if (!backupFile && !backupText) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please, select your backup file'
      );
      this.showErrorInfoSheet(title, subtitle);
      return;
    }

    if (backupFile) {
      this.reader.readAsBinaryString(backupFile);
    } else {
      const opts: Partial<WalletOptions> = {};
      opts.bwsurl = this.importForm.value.bwsURL;
      this.importBlob(backupText, opts);
    }
  }

  public importFromMnemonic(): void {
    if (!this.importForm.valid) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('There is an error in the form');
      this.showErrorInfoSheet(title, subtitle);
      return;
    }

    const opts: Partial<WalletOptions> = {};

    if (this.importForm.value.bwsURL)
      opts.bwsurl = this.importForm.value.bwsURL;

    if (this.importForm.value.derivationPathEnabled) {
      const derivationPath = this.importForm.value.derivationPath;

      opts.networkName =
        this.derivationPathHelperProvider.getNetworkName(derivationPath);
      opts.derivationStrategy =
        this.derivationPathHelperProvider.getDerivationStrategy(derivationPath);
      opts.account =
        this.derivationPathHelperProvider.getAccount(derivationPath);

      /* TODO: opts.n is just used to determinate if the wallet is multisig (m/48'/xx) or single sig (m/44') 
        we should change the name to 'isMultisig'. 
        isMultisig is used to allow import old multisig wallets with derivation strategy = 'BIP44'
      */
      opts.n = this.importForm.value.isMultisig
        ? 2
        : opts.derivationStrategy == 'BIP48'
        ? 2
        : 1;

      opts.coin = this.importForm.value.coin;

      // set opts.useLegacyPurpose
      if (
        this.derivationPathHelperProvider.parsePath(derivationPath).purpose ==
          "44'" &&
        opts.n > 1
      ) {
        opts.useLegacyPurpose = true;
        this.logger.debug('Using 44 for Multisig');
      }

      // set opts.useLegacyCoinType
      if (
        opts.coin == 'bch' &&
        this.derivationPathHelperProvider.parsePath(derivationPath).coinCode ==
          "0'"
      ) {
        opts.useLegacyCoinType = true;
        this.logger.debug('Using 0 for BCH creation');
      }

      if (
        !opts.networkName ||
        !opts.derivationStrategy ||
        !Number.isInteger(opts.account)
      ) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant('Invalid derivation path');
        this.showErrorInfoSheet(title, subtitle);
        return;
      }

      if (
        !this.derivationPathHelperProvider.isValidDerivationPathCoin(
          this.importForm.value.derivationPath,
          this.importForm.value.coin
        )
      ) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant(
          'Invalid derivation path for selected coin'
        );
        this.showErrorInfoSheet(title, subtitle);
        return;
      }
    }

    opts.passphrase = this.importForm.value.passphrase || null;
    opts.keyId = this.keyId;

    const words: string = this.importForm.value.words || null;

    if (!words) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the recovery phrase'
      );
      this.showErrorInfoSheet(title, subtitle);
      return;
    } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
      opts.extendedPrivateKey = words;
      return this.importForm.value.derivationPathEnabled
        ? this.importWithDerivationPath(opts)
        : this.importExtendedPrivateKey(words, opts);
    } else {
      const wordList = words.trim().split(/[\u3000\s]+/);

      if (wordList.length % 3 != 0) {
        this.logger.warn('Incorrect words length');
        const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
          'recovery-phrase-length',
          {
            wordListLength: wordList.length
          }
        );
        errorInfoSheet.present();
        return;
      }
    }
    opts.mnemonic = words;

    this.importForm.value.derivationPathEnabled
      ? this.importWithDerivationPath(opts)
      : this.importMnemonic(words, opts);
  }

  public fileChangeEvent($event) {
    this.file = $event.target
      ? $event.target.files[0]
      : $event.srcElement.files[0];
    this.formFile = $event.target.value;
    // Most browsers return `C:\fakepath\FILENAME`
    this.prettyFileName = this.formFile.split('\\').pop();
    this.getFile();
  }

  private getFile() {
    // If we use onloadend, we need to check the readyState.
    this.reader.onloadend = () => {
      if (this.reader.readyState === 2) {
        // DONE === 2
        const opts: Partial<WalletOptions> = {};
        opts.bwsurl = this.importForm.value.bwsURL;
        const reader: string = this.reader.result.toString();
        this.importBlob(reader, opts);
      }
    };
  }

  public setDerivationPath(event) {
    const coin = event ? event.detail.value : this.prevCoin;
    this.prevCoin = coin;
    this.isShoweTokenPath =
      coin.toUpperCase() === 'XPI' || coin.toUpperCase() === 'XEC';
    const defaultCoin = `default${coin.toUpperCase()}`;
    const derivationPath = this.derivationPathHelperProvider[defaultCoin];
    this.importForm.controls['derivationPath'].setValue(derivationPath);
  }

  public setDerivationPathForXpiSlpToken(event) {
    this.isSlpToken = event.detail.checked;
    const defaultCoin = this.isSlpToken
      ? 'defaultSlpToken'
      : `default${this.prevCoin.toUpperCase()}`;
    const derivationPath = this.derivationPathHelperProvider[defaultCoin];
    this.importForm.controls['derivationPath'].setValue(derivationPath);
    if (this.isSlpToken) {
      this.importForm.controls['isSlpToken'].setValue(true);
    }
  }

  public changeDerivationPathValidators() {
    if (this.importForm.value.derivationPathEnabled) {
      this.importForm
        .get('derivationPath')
        .setValidators([Validators.required]);

      this.setDerivationPath(this.importForm.value.coin);
    } else {
      this.importForm.get('derivationPath').clearValidators();
    }
    this.importForm.get('derivationPath').updateValueAndValidity();
  }

  public openScanner(): void {
    this.router.navigate(['/scan'], { state: { fromImport: true } });
  }

  private showErrorInfoSheet(title: string, msg: string): void {
    this.errorsProvider.showDefaultError(msg, title);
  }
}
