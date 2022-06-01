import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Coin, ConfigProvider, CurrencyProvider, EventManagerService, Logger, PlatformProvider, RateProvider } from 'src/app/providers';
import { DateRanges, ExchangeRate } from 'src/app/providers/rate/rate';
import * as _ from 'lodash';
import { PricePage } from '../home/price-page/price-page';
export interface Card {
  unitCode: string;
  historicalRates: any;
  currentPrice: number;
  totalBalanceChange: number;
  totalBalanceChangeAmount: number;
  backgroundColor: string;
  gradientBackgroundColor: string;
  name: string;
  currentTime?: number;
}
@Component({
  selector: 'chart-view',
  templateUrl: './chart-view.html',
  styleUrls: ['./chart-view.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChartViewPage implements OnInit {
  public isFiatIsoCodeSupported: boolean;
  public fiatIsoCode: string;
  public coins = [];
  public selectedCardPrice: Card;

  @ViewChild('pricePage', { static: false }) pricePage: PricePage;

  constructor(
    public platformProvider: PlatformProvider,
    private currencyProvider: CurrencyProvider,
    private events: EventManagerService,
    private rateProvider: RateProvider,
    private logger: Logger,
    private configProvider: ConfigProvider
  ) {
    const availableChains = this.currencyProvider.getAvailableChains();
    for (const coin of availableChains) {
      const {
        backgroundColor,
        gradientBackgroundColor
      } = this.currencyProvider.getTheme(coin as Coin);
      const card = {
        unitCode: coin,
        historicalRates: [],
        currentPrice: 0,
        totalBalanceChange: 0,
        totalBalanceChangeAmount: 0,
        backgroundColor,
        gradientBackgroundColor,
        name: this.currencyProvider.getCoinName(coin as Coin)
      };
      this.coins.push(card);
    }
    this.getPrices();
    this.events.subscribe('Local/PriceUpdate', () => {
      this.getPrices();
    });
  }

  ngOnInit() {
    this.selectedCardPrice = this.coins[0];
  }

  public changePricePage(card) {
    this.selectedCardPrice = card;
  }

  public async getPrices() {
    this.setIsoCode();

    // TODO: Add a new endpoint in BWS that
    // provides JUST  the current prices and the delta.
    this.rateProvider
      .fetchHistoricalRates(this.fiatIsoCode, DateRanges.Day)
      .then(response => {
        _.forEach(this.coins, (coin, index) => {
          if (response[coin.unitCode])
            this.update(index, response[coin.unitCode]);
        });
        err => {
          this.logger.error('Error getting rates:', err);
        };
      });
  }

  private update(i: number, values: ExchangeRate[]) {
    if (!values[0] || !_.last(values)) {
      this.logger.warn('No exchange rate data');
      return;
    }
    const lastRate = _.last(values).rate;
    this.coins[i].currentPrice = values[0].rate;
    this.coins[i].totalBalanceChangeAmount =
      this.coins[i].currentPrice - lastRate;
    this.coins[i].totalBalanceChange =
      (this.coins[i].totalBalanceChangeAmount * 100) / lastRate;
  }

  private setIsoCode() {
    const alternativeIsoCode = this.configProvider.get().wallet.settings
      .alternativeIsoCode;
    this.isFiatIsoCodeSupported = this.rateProvider.isAltCurrencyAvailable(
      alternativeIsoCode
    );
    this.fiatIsoCode = this.isFiatIsoCodeSupported ? alternativeIsoCode : 'USD';
  }

}
