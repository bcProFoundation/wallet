import { AfterViewInit, Component, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, NavParams, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription, timer } from 'rxjs';
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
import { CopayersPage } from '../add/copayers/copayers';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { JoinWalletPage } from '../add/join-wallet/join-wallet';
import { PaperWalletPage } from '../paper-wallet/paper-wallet';
import { ScanPage } from '../scan/scan';
import { AmountPage } from '../send/amount/amount';
import { ConfirmPage } from '../send/confirm/confirm';
import { SelectInputsPage } from '../send/select-inputs/select-inputs';
import { AddressbookAddPage } from '../settings/addressbook/add/add';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { MultiSendPage } from './multi-send/multi-send';
import { RecipientComponent } from './recipient/recipient.component';
import { RecipientModel } from './recipient/recipient.model';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html',
  styleUrls: ['./send.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SendPage implements AfterViewInit {
  public wallet: any;
  public search: string = '';
  public amount: string = '';
  public isCordova: boolean;
  public invalidAddress: boolean;
  public validDataFromClipboard;
  private onResumeSubscription: Subscription;
  private validDataTypeMap: string[] = [
    'BitcoinAddress',
    'BitcoinCashAddress',
    'ECashAddress',
    'LotusAddress',
    'EthereumAddress',
    'EthereumUri',
    'RippleAddress',
    'DogecoinAddress',
    'LitecoinAddress',
    'RippleUri',
    'BitcoinUri',
    'BitcoinCashUri',
    'DogecoinUri',
    'LitecoinUri',
    'BitPayUri',
    'ECashUri',
    'LotusUri'
  ];
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

  isDonation: boolean;
  titlePage: string = "Send to";
  dataDonation: any;
  navPramss: any;
  listRecipient: RecipientModel[] = [];

  @ViewChildren(RecipientComponent) listFinalRecipient: QueryList<RecipientComponent>;
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
    private txFormatProvider: TxFormatProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.listRecipient.push(new RecipientModel({
      toAddress: '',
      address: 0,
      isValid: false
    }))
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.isDonation = this.navPramss.isDonation;
    if (this.isDonation) {
      this.titlePage = "Receiving Wallet";
      this.dataDonation = this.navPramss;
      this.wallet.donationCoin = this.navPramss.donationCoin;
    } else {
      this.wallet.donationCoin = undefined;
    }
    this.isCordova = this.platformProvider.isCordova;
    this.events.subscribe('Local/AddressScan', this.updateAddressHandler);
    this.events.subscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.subscribe('Desktop/onFocus', () => {
      this.setDataFromClipboard();
    });
    this.events.subscribe('addRecipient', newRecipient => {
      this.addRecipient(newRecipient);
    });
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.setDataFromClipboard();
    });
  }
  ngAfterViewInit(): void {
    // console.log(this.listFinalRecipient);
    this.listFinalRecipient.changes.subscribe(s => console.log(s));
  }

  @ViewChild('transferTo')
  transferTo;

  ngOnInit() {
    this.logger.info('Loaded: SendPage');
  }

  ionViewDidEnter() {
    this.setDataFromClipboard();
    // if (this.router.getCurrentNavigation()) {
    //   this.navPramss = this.router.getCurrentNavigation().extras.state;
    // } else {
    //   this.navPramss = history ? history.state : {};
    // }
    // if (this.navPramss.toAddress) {
    //   const contact = this.navPramss.name || this.navPramss.toAddress;
    //   this.listRecipient.find(s => s.id === this.navPramss.recipientId).toAddress = contact;
    // }
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/AddressScan', this.updateAddressHandler);
    this.events.unsubscribe('SendPageRedir', this.SendPageRedirEventHandler);
    this.events.unsubscribe('Desktop/onFocus');
    this.onResumeSubscription.unsubscribe();
  }

  private async setDataFromClipboard() {
    this.validDataFromClipboard = await this.clipboardProvider.getValidData(
      this.wallet.coin
    );
  }

  private SendPageRedirEventHandler: any = nextView => {
    // toto ionic 4 : Remove view ???? Handle in ionic 4 - 5 ???
    // const currentIndex = this.navCtrl.getActive().index;
    // const currentView = this.navCtrl.getViews();
    nextView.params.fromWalletDetails = true;
    nextView.params.walletId = this.wallet.credentials.walletId;
    // this.navCtrl
    //   .push(this.pageMap[nextView.name], nextView.params, { animate: false })
    //   .then(() => {
    //     if (currentView[currentIndex].name == 'ScanPage')
    //       this.navCtrl.remove(currentIndex);
    //   });
    this.router.navigate([this.pageMap[nextView.name]], {
      state: nextView.params
    });
  };

  private updateAddressHandler: any = data => {
    this.search = data.value;
    this.processInput();
  };

  public shouldShowZeroState() {
    return (
      this.wallet &&
      this.wallet.cachedStatus &&
      !this.wallet.cachedStatus.totalBalanceSat
    );
  }

  public openScanner(): void {
    this.router.navigate(['/scan'], { state: { fromSend: true } });
  }

  public showOptions(coin: Coin) {
    return (
      (this.currencyProvider.isMultiSend(coin) ||
        this.currencyProvider.isUtxoCoin(coin)) &&
      !this.shouldShowZeroState()
    );
  }

  private checkCoinAndNetwork(data, isPayPro?): boolean {
    let isValid, addrData;
    if (isPayPro) {
      isValid =
        data &&
        data.chain == this.currencyProvider.getChain(this.wallet.coin) &&
        data.network == this.wallet.network;
    } else {
      addrData = this.addressProvider.getCoinAndNetwork(
        data,
        this.wallet.network
      );
      isValid =
        this.currencyProvider.getChain(this.wallet.coin).toLowerCase() ==
        addrData.coin && addrData.network == this.wallet.network;
    }

    if (isValid) {
      this.invalidAddress = false;
      return true;
    } else {
      this.invalidAddress = true;
      let network = isPayPro ? data.network : addrData.network;

      if (this.wallet.coin === 'bch' && this.wallet.network === network) {
        const isLegacy = this.checkIfLegacy();
        isLegacy ? this.showLegacyAddrMessage() : this.showErrorMessage();
      } else {
        this.showErrorMessage();
      }
    }

    return false;
  }

  private redir() {
    this.incomingDataProvider.redir(this.search, {
      activePage: 'SendPage',
      amount: this.navPramss.amount,
      coin: this.navPramss.coin // TODO ???? what is this for ?
    });
    this.search = '';
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

  private showLegacyAddrMessage() {
    const appName = this.appProvider.info.nameCase;
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'legacy-address-info',
      { appName }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        const legacyAddr = this.search;
        const cashAddr = this.addressProvider.translateToCashAddress(
          legacyAddr
        );
        this.search = cashAddr;
        this.processInput();
      }
    });
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

  public async processInput() {
    if (this.search == '') this.invalidAddress = false;
    // const hasContacts = await this.checkIfContact();
    // if (!hasContacts) {

    // } else {
    //   this.invalidAddress = false;
    // }
    const parsedData = this.incomingDataProvider.parseData(this.search);
    if (
      parsedData &&
      _.indexOf(this.validDataTypeMap, parsedData.type) != -1
    ) {
      const isValid = this.checkCoinAndNetwork(this.search);
      if (isValid) this.redir();
    } else if (parsedData && parsedData.type == 'BitPayCard') {
      // this.close();
      this.incomingDataProvider.redir(this.search, {
        activePage: 'SendPage'
      });
    } else if (parsedData && parsedData.type == 'PrivateKey') {
      this.incomingDataProvider.redir(this.search, {
        activePage: 'SendPage'
      });
    } else {
      this.invalidAddress = true;
    }
  }

  // public async checkIfContact() {
  //   await timer(50).toPromise();
  //   return this.transferTo.hasContactsOrWallets;
  // }

  private checkIfLegacy(): boolean {
    return (
      this.incomingDataProvider.isValidBitcoinCashLegacyAddress(this.search) ||
      this.incomingDataProvider.isValidBitcoinCashUriWithLegacyAddress(
        this.search
      )
    );
  }

  public showMoreOptions(): void {
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
      'send-options',
      {
        isUtxoCoin: this.currencyProvider.isUtxoCoin(this.wallet.coin),
        isMultiSend: this.currencyProvider.isMultiSend(this.wallet.coin)
      }
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      if (option == 'multi-send')
        this.router
          .navigate(['/multi-send'], { // MultiSendPage
            state: { walletId: this.wallet.id }
          })
          .then(() => {
            this.analyticsProvider.logEvent('multi_send_clicked', {
              coin: this.wallet.coin
            });
          });
      if (option == 'select-inputs')
        this.router
          .navigate(['/select-inputs'], { // SelectInputsPage
            state: { walletId: this.wallet.id }
          })
          .then(() => {
            this.analyticsProvider.logEvent('select_inputs_clicked', {
              coin: this.wallet.coin
            });
          });
    });
  }

  public pasteFromClipboard() {
    this.search = this.validDataFromClipboard || '';
    this.validDataFromClipboard = null;
    this.clipboardProvider.clear();
    this.processInput();
  }

  public addNewRecipient() {
    this.listRecipient.push(new RecipientModel({
      to: '',
      amount: '',
      isValid: false
    }))
  }
  public continue() {
    const listFinal = this.listFinalRecipient.map(s => s.recipient);
    console.log(listFinal);
    this.goToConfirm();
  }
  public deleteRecipient(id) {
    this.listRecipient = this.listRecipient.filter(s => s.id !== id);
  }

  public goToConfirm(): void {
    let totalAmount = 0;
    if(this.listRecipient.length === 1){
      const recipient = this.listRecipient[0];
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
        fromWalletDetails: true
      }
    });
    } else{
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
          useSendMax: true,
          recipients: this.listRecipient
        }
      });
    }
  }

  sendMax(){
    const recipient = this.listRecipient[0];
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
        name: recipient.name,
        fromWalletDetails: true
      }
    });
  }

  public addRecipient(recipient): void {
    let recipientSelected = this.listRecipient.find(s => s.id === recipient.id);
    if (recipientSelected) {
      // let amountToShow: string = +recipientSelected.amount
      //   ? this.txFormatProvider.formatAmount(this.wallet.coin, +recipientSelected.amount)
      //   : null;

      // let altAmountStr = this.txFormatProvider.formatAlternativeStr(
      //   this.wallet.coin,
      //   ++recipientSelected.amount
      // );
      
      // recipientSelected.amount = +recipientSelected.amount ? +recipientSelected.amount : null;
      // recipientSelected.amountToShow = amountToShow;
      // recipientSelected.altAmountStr = altAmountStr;
      recipientSelected.toAddress = recipient.toAddress;
      recipientSelected.name = recipient.name;
      recipientSelected.recipientType = recipient.recipientType;
      // recipientSelected = new RecipientModel({
      //   amount: 
      //   amountToShow,
      //   altAmountStr: altAmountStr ? altAmountStr : null,
      //   toAddress: recipient.toAddress,
      //   recipientType: recipient.recipientType,
      //   recipient
      // })
    }
  }
}
