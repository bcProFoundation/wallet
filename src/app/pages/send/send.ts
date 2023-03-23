import { Component, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, NavParams, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { ProfileProvider } from 'src/app/providers/profile/profile';
import { TxFormatProvider } from 'src/app/providers/tx-format/tx-format';
import { DecimalFormatBalance } from 'src/providers/decimal-format.ts/decimal-format';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../providers/address/address';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { AppProvider } from '../../providers/app/app';
import { ClipboardProvider } from '../../providers/clipboard/clipboard';
import { Coin, CurrencyProvider } from '../../providers/currency/currency';
import { ErrorsProvider } from '../../providers/errors/errors';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../../providers/platform/platform';

// Pages
import { RecipientModel } from '../../components/recipient/recipient.model';
import { RecipientComponent } from 'src/app/components/recipient/recipient.component';
import { OnGoingProcessProvider } from 'src/app/providers/on-going-process/on-going-process';
import { TransactionProposal, WalletProvider } from 'src/app/providers/wallet/wallet';
import { ReplaceParametersProvider } from 'src/app/providers/replace-parameters/replace-parameters';
import { BwcErrorProvider, ConfigProvider, PopupProvider, TxConfirmNotificationProvider } from 'src/app/providers';
import { PageDto, PageModel } from 'src/app/providers/lixi-lotus/lixi-lotus';
import { EventsService } from 'src/app/providers/events.service';

import { Location } from '@angular/common';
import { DUST_AMOUNT } from 'src/app/constants';


@Component({
  selector: 'page-send',
  templateUrl: 'send.html',
  styleUrls: ['./send.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SendPage {
  @ViewChild('slideButton')
  slideButton;
  public wallet: any;
  public search: string = '';
  public amount: string = '';
  public isCordova: boolean;
  public invalidAddress: boolean;
  public validDataFromClipboard;
  private onResumeSubscription: Subscription;
  public isScroll = false;
  private pageMap = {
    AddressbookAddPage: '/address-book-add',
    AmountPage: '/amount',
    ConfirmPage: '/confirm',
    CopayersPage: '/copayers',
    ImportWalletPage: '/import-wallet',
    JoinWalletPage: '/join-wallet',
    PaperWalletPage: '/paper-wallet',
    WalletDetailsPage: '/wallet-details'
  };
  public currentTheme;
  isDonation: boolean;
  titlePage: string;
  dataDonation: any;
  navPramss: any;
  token;
  listRecipient: RecipientModel[] = [];
  walletId: string;
  isShowSendMax: boolean = true;
  isShowDelete: boolean = false;
  isShowMessage: boolean = true;
  toAddress: string = '';
  formatRemaining: string;
  recipientNotInit: RecipientModel;
  isSendFromHome: boolean = false;
  isOfficialInfo = false;
  hideSlideButton = false;
  tx: any;
  public config;
  public CONFIRM_LIMIT_USD: number = 20;

  @ViewChild(IonContent) content: IonContent;
  @ViewChildren(RecipientComponent) queryListRecipientComponent: QueryList<RecipientComponent>;
  constructor(
    private currencyProvider: CurrencyProvider,
    private router: Router,
    private navParams: NavParams,
    private logger: Logger,
    private incomingDataProvider: IncomingDataProvider,
    private addressProvider: AddressProvider,
    private events: EventManagerService,
    private actionSheetProvider: ActionSheetProvider,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider,
    private plt: Platform,
    private clipboardProvider: ClipboardProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    protected onGoingProcessProvider: OnGoingProcessProvider,
    protected walletProvider: WalletProvider,
    protected replaceParametersProvider: ReplaceParametersProvider,
    protected popupProvider: PopupProvider,
    protected configProvider: ConfigProvider,
    protected txConfirmNotificationProvider: TxConfirmNotificationProvider,
    protected eventsService: EventsService,
    protected bwcErrorProvider: BwcErrorProvider,
    private location: Location
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.config = this.configProvider.get();
    this.isSendFromHome = this.navPramss.isSendFromHome;
    this.toAddress = this.navPramss.toAddress;
    this.listRecipient.push(new RecipientModel({
      toAddress: !_.isEmpty(this.toAddress) ? this.toAddress : '',
      address: 0,
      isValid: false
    }))
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.token = this.navPramss.token;
    this.titlePage = this.translate.instant("Send ") + (this.wallet.coin as String).toUpperCase();
    if (this.token) this.titlePage = this.translate.instant("Send ") + (this.token.tokenInfo.name as String);
    this.isDonation = this.navPramss.isDonation;
    if (this.isDonation) {
      this.titlePage = this.translate.instant("Send Donation");
      this.dataDonation = this.navPramss;
      this.wallet.donationCoin = this.navPramss.donationCoin;
      const coinDonation = _.get(this.dataDonation, 'donationCoin', 'xpi');
      const precision = this.currencyProvider.getPrecision(coinDonation as Coin).unitToSatoshi;
      const remaining = this.dataDonation.remaining;
      this.formatRemaining = `${this.txFormatProvider.formatAmount(coinDonation, precision * remaining)} ${_.upperCase(coinDonation)}`;
    } else {
      this.wallet.donationCoin = undefined;
    }
    this.isCordova = this.platformProvider.isCordova;
    this.events.subscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.subscribe('Desktop/onFocus', () => {
      this.setDataFromClipboard();
    });
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.setDataFromClipboard();
    });
  }

  async handleScrolling(event) {
    if (event.detail.currentY > 0) {
      this.isScroll = true;
    }
    else {
      this.isScroll = false;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: SendPage');
  }

  ngAfterViewInit() {
    if (this.recipientNotInit) {
      this.queryListRecipientComponent.toArray()[0].updateRecipient(this.recipientNotInit);
      this.recipientNotInit = null;
    }
  }

  ngOnDestroy() {
    this.events.unsubscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.unsubscribe('Desktop/onFocus');
    this.onResumeSubscription.unsubscribe();
  }

  private async setDataFromClipboard() {
    this.validDataFromClipboard = await this.clipboardProvider.getValidData(
      this.wallet.coin
    );
    console.log(this.validDataFromClipboard);
  }

  private SendPageRedirEventHandler: any = nextView => {
    nextView.params.fromWalletDetails = true;
    nextView.params.walletId = this.wallet.credentials.walletId;
    if (nextView && nextView.params.amount) {
      if (nextView.params.recipientId) {
        let totalAmountStr = this.txFormatProvider.satToUnit(
          nextView.params.amount,
          this.wallet.coin
        );
        this.queryListRecipientComponent.toArray().find(s => s.recipient.id === nextView.params.recipientId).updateRecipient(new RecipientModel({
          toAddress: nextView.params.toAddress,
          amount: totalAmountStr,
          isSpecificAmount: true
        }))
      }
      else {
        let totalAmountStr;
        if (this.checkPrefixEtokenAddress(nextView.params.toAddress)) {
          totalAmountStr = nextView.params?.amount || 0
        } else {
          totalAmountStr = this.txFormatProvider.satToUnit(
            nextView.params.amount,
            this.wallet.coin
          );
        }
        if (this.queryListRecipientComponent) {
          this.queryListRecipientComponent.toArray()[0].updateRecipient(new RecipientModel({
            toAddress: nextView.params.toAddress,
            amount: totalAmountStr,
            isSpecificAmount: true
          }));
        }
        else {
          this.recipientNotInit = new RecipientModel({
            toAddress: nextView.params.toAddress,
            amount: totalAmountStr,
            isSpecificAmount: true
          })
        }
      }
    }
    // Handle specific amount for eToken
    if (this.checkPrefixEtokenAddress(nextView.params.toAddress) && nextView.name == 'ConfirmPage') {
      return this.goToConfirmToken();
    } 
    this.router.navigate([this.pageMap[nextView.name]], {
      state: nextView.params
    });
  };

  public shouldShowZeroState() {
    return (
      this.wallet &&
      this.wallet.cachedStatus &&
      !this.wallet.cachedStatus.totalBalanceSat
    );
  }

  private checkPrefixEtokenAddress(address) {
    return address.includes('etoken') || false;
  }

  public showOptions(coin: Coin) {
    return (
      (this.currencyProvider.isMultiSend(coin) ||
        this.currencyProvider.isUtxoCoin(coin)) &&
      !this.shouldShowZeroState()
    );
  }

  private showErrorMessage() {
    const msg = this.translate.instant(
      'The wallet you are using does not match the network and/or the currency of the address provided'
    );
    const title = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(msg, title, () => {
      this.search = '';
    });
  }

  public getBalance() {
    const lastKnownBalance = this.wallet.lastKnownBalance;
    if (this.token) {
      return `${this.token.amountToken} ${this.token.tokenInfo.symbol}`
    }
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

  public getAlternativeBalance() {
    if (this.wallet.coin === 'xrp') {
      const availableAlternative =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.availableBalanceAlternative;
      return DecimalFormatBalance(availableAlternative);
    } else {
      const totalBalanceAlternative =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.totalBalanceAlternative;
      return DecimalFormatBalance(totalBalanceAlternative);
    }
  }

  public cleanSearch() {
    this.search = '';
    this.invalidAddress = false;
  }

  public goToSelectInput(): void {
    this.router
      .navigate(['/send-select-inputs'], { // SelectInputsPage
        state: { walletId: this.wallet.id }
      })
      .then(() => {
        this.analyticsProvider.logEvent('select_inputs_clicked', {
          coin: this.wallet.coin
        });
      });
  }

  public addNewRecipient() {
    this.listRecipient.push(new RecipientModel({
      to: '',
      amount: 0
    }))
    this.isShowSendMax = this.listRecipient.length === 1;
    this.isShowDelete = this.listRecipient.length > 1;
    if(this.wallet.coin === 'xpi' && this.wallet.cachedStatus.wallet.singleAddress){
      this.isShowMessage = this.listRecipient.length === 1;
    }
    this.content.scrollToBottom(1000);
  }

  public deleteRecipient(id) {
    this.listRecipient = this.listRecipient.filter(s => s.id !== id);
    this.isShowSendMax = this.listRecipient.length === 1;
    this.isShowDelete = this.listRecipient.length > 1;
    this.isShowMessage = this.listRecipient.length === 1;
  }

  private goToConfirmToken(isSendMax?: boolean) {
    const recipient = this.listRecipient[0];
    this.router.navigate(['/confirm-token'], {
      state: {
        amount: recipient.amount,
        toAddress: recipient.toAddress,
        token: this.token,
        walletId: this.wallet.credentials.walletId,
        useSendMax: !!isSendMax,
        isSendFromHome: this.isSendFromHome
      }
    });
  }

  private goToConfirmDonation() {
    const recipient = this.listRecipient[0];
    this.router.navigate(['/confirm'], {
      state: {
        amount: recipient.amount,
        coin: this.wallet.coin,
        currency: recipient.currency,
        fromWalletDetails: true,
        useSendMax: false,
        network: this.wallet.network,
        recipientType: recipient.recipientType,
        walletId: this.wallet.credentials.walletId,
        toAddress: this.dataDonation.toAddress,
        isDonation: true,
        remaining: this.dataDonation.remaining,
        donationCoin: this.dataDonation.donationCoin,
        receiveLotusAddress: recipient.toAddress,
        nameReceiveLotusAddress: recipient.name
      }
    });
  }

  public goToConfirm(): void {
    let totalAmount = 0;
    if (this.token) return this.goToConfirmToken();
    if (this.isDonation) return this.goToConfirmDonation();
    if (this.listRecipient.length === 1) {
      const recipient = this.listRecipient[0];
      if(!recipient.amount || recipient.amount === 0){
        recipient.amount = DUST_AMOUNT;
      }

      this.router.navigate(['/confirm'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          recipientType: recipient.recipientType,
          amount: recipient.amount,
          currency: recipient.currency,
          coin: this.wallet.coin,
          network: this.wallet.network,
          useSendMax: false,
          toAddress: recipient.toAddress,
          name: recipient.name,
          fromWalletDetails: true,
          isSentXecToEtoken: recipient.isSentXecToEtoken,
          isSendFromHome: this.isSendFromHome,
          messageOnChain: recipient.message
        }
      });
    } else {
      this.listRecipient.forEach(recipient => {
        totalAmount += recipient.amount;
      });
      this.router.navigate(['/confirm'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          fromMultiSend: true,
          totalAmount,
          recipientType: 'multi',
          color: this.wallet.color,
          coin: this.wallet.coin,
          network: this.wallet.network,
          useSendMax: false,
          recipients: this.listRecipient,
          isSendFromHome: this.isSendFromHome
        }
      });
    }
  }

  sendMax(isToken: boolean) {
    const recipient = this.listRecipient[0];
    if (!isToken) {
      this.router.navigate(['/confirm'], {
        state: {
          walletId: this.wallet.credentials.walletId,
          recipientType: recipient.recipientType,
          amount: recipient.amount,
          currency: recipient.currency,
          coin: this.wallet.coin,
          network: this.wallet.network,
          useSendMax: true,
          toAddress: recipient.toAddress,
          name: recipient.name
        }
      });
    } else {
      this.goToConfirmToken(true);
    }
  }

  checkBeforeGoToConfirmPage() {
    return this.listRecipient.findIndex(s => s.isValid === false) !== -1;
  }

  handleOfficialInfo(pageInfo: PageModel){
    if(pageInfo){
      this.isOfficialInfo = true;
      this.listRecipient = [this.listRecipient[pageInfo.index]];
      this.tx = {
        toAddress: pageInfo.addressCrypto,
        spendUnconfirmed: this.config.wallet.spendUnconfirmed,
        // Vanity tx info (not in the real tx)
        recipientType: 'address',
        network: this.wallet.network,
        coin: this.wallet.coin,
        txp: {},
      };
    } else {
      this.isOfficialInfo = false;
    }
  }

  public approve(): Promise<void> {
    const tx = this.tx;
    const wallet = this.wallet;
    const recipient = this.listRecipient[0];
    tx.toAddress = recipient.toAddress;
    tx.amount = recipient.amount;
    if (!tx || (!wallet)) return undefined;
    if (wallet) {
      this.onGoingProcessProvider.set('creatingTx');
      return this.getTxp(_.clone(tx), wallet, false)
        .then(txp => {
          this.logger.debug('Transaction Fee:', txp.fee);
          return this.confirmTx(txp, wallet).then((nok: boolean) => {
            if (nok) {
              if (this.isCordova) this.slideButton.isConfirmed(false);
              this.onGoingProcessProvider.clear();
              return;
            }
            this.publishAndSign(txp, wallet);
          });
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();
          this.showErrorInfoSheet(err);
          this.logger.warn('Error getting transaction proposal', err);
        });
    } else {
      return null;
    }
  }

  protected publishAndSign(txp, wallet) {
    return this.walletProvider
      .publishAndSign(wallet, txp)
      .then(txp => {
        if (
          this.config.confirmedTxsNotifications &&
          this.config.confirmedTxsNotifications.enabled
        ) {
          this.txConfirmNotificationProvider.subscribe(wallet, {
            txid: txp.txid,
            amount: txp.amount
          });
        }
        let redir;

        if (txp.payProUrl && txp.payProUrl.includes('redir=wc')) {
          redir = 'wc';
        }
        // Update balance in card home
        this.events.publish('Local/GetListPrimary', true);
        this.onGoingProcessProvider.clear();
        return this.annouceFinish(false, { redir });
      })
      .catch(err => {
        if (this.isCordova) this.slideButton.isConfirmed(false);
        this.onGoingProcessProvider.clear();
        this.showErrorInfoSheet(err);
        this.logger.warn('Error on publishAndSign: removing payment proposal');
        this.walletProvider.removeTx(wallet, txp).catch(() => {
          this.logger.warn('Could not delete payment proposal');
        });
        if (typeof err == 'string' && err.includes('Broadcasting timeout')) {
          this.navigateBack(
            txp.payProUrl && txp.payProUrl.includes('redir=wc') ? 'wc' : null
          );
        }
      });
  }

  protected async annouceFinish(
    onlyPublish?: boolean,
    redirectionParam?: { redir: string },
    walletId?: string
  ) {
    const { redir } = redirectionParam || { redir: '' };

    let params: {
      finishText: string;
      finishComment?: string;
      autoDismiss?: boolean;
    } = {
      finishText: this.translate.instant('Payment Sent'),
      autoDismiss: !!redir
    };

    this.clipboardProvider.clearClipboardIfValidData([
      'PayPro',
      'BitcoinUri',
      'BitcoinCashUri',
      'EthereumUri',
      'DogecoinUri',
      'LitecoinUri',
      'RippleUri',
      'InvoiceUri',
      'ECashUri',
      'LotusUri'
    ]);
    this.navigateBack(redir, walletId, params);
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
      msg = this.tx.paypro
        ? this.translate.instant(
          'There is a temporary problem with the merchant requesting the payment. Please try later'
        )
        : this.translate.instant(
          'Error 500 - There is a temporary problem, please try again later.'
        );
    }

    const infoSheetTitle = title ? title : this.translate.instant('Error');

    this.errorsProvider.showDefaultError(
      msg || this.bwcErrorProvider.msg(error),
      infoSheetTitle,
      () => {
        if (exit) {
          this.location.back();
        }
      }
    );
  }

  private navigateBack(_redir?: string, walletId?: string, params?) {
    if (this.wallet) {
      this.router.navigate(['/tabs/wallets'], { replaceUrl: true }).then(() => {
        this.router.navigate(['/wallet-details'], {
          state: {
            walletId: walletId ? walletId : this.wallet.credentials.walletId,
            donationSupportCoins: false,
            finishParam: params,
            isSendFromHome: this.isSendFromHome
          },
          replaceUrl: true
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
    }
  }

  private getTxp(tx, wallet, dryRun: boolean): Promise<any> {
    return new Promise((resolve, reject) => {    
      if (
        this.currencyProvider.isUtxoCoin(tx.coin) &&
        tx.amount > Number.MAX_SAFE_INTEGER
      ) {
        const msg = this.translate.instant('Amount too big');
        return reject(msg);
      }

      const txp: Partial<TransactionProposal> = {};
      // set opts.coin to wallet.coin
      txp.coin = wallet.coin;

      txp.outputs = [
        {
          toAddress: tx.toAddress,
          amount: tx.amount,
          data: tx.data,
          message: null,
          gasLimit: tx.gasLimit // wallet connect needs exact gasLimit value
        }
      ];
      txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
      txp.dryRun = dryRun;

      this.walletProvider
        .getAddress(this.wallet, false)
        .then(address => {
          if (tx.toAddress === address) {
            const err = this.translate.instant(
              'Cannot send to the same wallet you are trying to send from. Please check the destination address and try it again.'
            );
            return reject(err);
          }
          txp.from = address;
          this.walletProvider
            .createTx(wallet, txp)
            .then(ctxp => {
              return resolve(ctxp);
            })
            .catch(err => {
              return reject(err);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private confirmTx(txp, wallet) {
    return new Promise<boolean>(resolve => {
      if (wallet.isPrivKeyEncrypted) return resolve(false);
      this.txFormatProvider.formatToUSD(wallet.coin, txp.amount).then(val => {
        const amountUsd = parseFloat(val);
        if (amountUsd <= this.CONFIRM_LIMIT_USD) return resolve(false);
        const unit = txp.coin.toUpperCase();
        const amount = (
          this.tx.amount /
          this.currencyProvider.getPrecision(txp.coin).unitToSatoshi
        ).toFixed(8);
        const name = wallet.name;
        const message = this.replaceParametersProvider.replace(
          this.translate.instant(
            'Sending {{amount}} {{unit}} from your {{name}} wallet'
          ),
          { amount, unit, name }
        );
        const okText = this.translate.instant('Confirm');
        const cancelText = this.translate.instant('Cancel');
        this.popupProvider
          .ionicConfirm(null, message, okText, cancelText)
          .then((ok: boolean) => {
            return resolve(!ok);
          });
      });
    });
  }
}
