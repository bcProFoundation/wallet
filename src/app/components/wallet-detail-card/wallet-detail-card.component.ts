import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AppProvider, CurrencyProvider, EventManagerService, ProfileProvider } from 'src/app/providers';
import { DecimalFormatBalance } from 'src/app/providers/decimal-format.ts/decimal-format';
import * as _ from 'lodash';

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

  constructor(
    private appProvider: AppProvider,
    private currencyProvider: CurrencyProvider,
    private events: EventManagerService,
    private profileProvider: ProfileProvider,
    private router: Router
  ) {
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
  }

  ngOnInit() {
    this.hiddenBalance = this.wallet.balanceHidden;
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

}
