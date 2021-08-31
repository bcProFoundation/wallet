import { TestUtils } from '../../test';

// Providers
import { ConfigProvider } from '../config/config';
import { Coin } from '../currency/currency';
import { FilterProvider } from '../filter/filter';
import { PersistenceProvider } from '../persistence/persistence';
import { RateProvider } from '../rate/rate';
import { TxFormatProvider } from './tx-format';

describe('TxFormatProvider', () => {
  let configProvider: ConfigProvider;
  let filterProvider: FilterProvider;
  let rateProvider: RateProvider;
  let txFormatProvider: TxFormatProvider;

  class PersistenceProviderMock {
    constructor() {}
    storeConfig() {
      return Promise.resolve('');
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    txFormatProvider = testBed.get(TxFormatProvider);
    configProvider = testBed.get(ConfigProvider);
    rateProvider = testBed.get(RateProvider);
    filterProvider = testBed.get(FilterProvider);
  });

  describe('toCashAddress', () => {
    it('should get the address in Cash Address format', () => {
      let address = 'qz49wrnh7d9p7ejrg55lqr6zdpu4x2kh7uckpdhth3'; // BCH livenet address
      let cashAddr: string = txFormatProvider.toCashAddress(address);
      expect(cashAddr).toEqual('qz49wrnh7d9p7ejrg55lqr6zdpu4x2kh7uckpdhth3');
    });

    it('should get the address in Cash Address format, with prefix', () => {
      let address = 'qz49wrnh7d9p7ejrg55lqr6zdpu4x2kh7uckpdhth3'; // BCH livenet address
      let cashAddr: string = txFormatProvider.toCashAddress(address, true);
      expect(cashAddr).toEqual(
        'bitcoincash:qz49wrnh7d9p7ejrg55lqr6zdpu4x2kh7uckpdhth3'
      );
    });
  });

  describe('formatAmount', () => {
    const testVectors: any[] = [
      // [coin, amount, fullPrecision, expectedResult]
      ['bit', 12312312, true, '123,123.12'],
      ['sat', 12312312, true, '12312312'],
      ['bch', 0, true, '0.00000000'],
      ['bch', 0, false, '0.00'],
      ['bch', 12312312, true, '0.12312312'],
      ['bch', 1231231223423, true, '12,312.31223423'],
      ['bch', 1231231223423, false, '12,312.312234'],
      ['xec', 12312312, true, '123,123.12'],
      ['xec', 1231231223, true, '12,312,312.23'],
      ['xec', 12312312, false, '123,123.12'],
      ['xpi', 6789987768, true, '6,789.987768'],
      ['xpi', 1231231223423, true, '1,231,231.223423'],
      ['xpi', 678998776, false, '678.998776'],
    ];

    testVectors.forEach(v => {
      it(
        'should get the formatted amount for ' +
          v[1] +
          ' "satoshis" in ' +
          v[0] +
          ' and fullPrecision: ' +
          v[2],
        () => {
          let formattedAmount = txFormatProvider.formatAmount(v[0], v[1], v[2]);
          expect(formattedAmount).toEqual(v[3]);
        }
      );
    });
  });

  describe('formatAmountStr', () => {
    it('should return undefined if satoshis amount are not type of number', () => {
      expect(
        txFormatProvider.formatAmountStr('xpi', undefined)
      ).toBeUndefined();
    });

    it('should return a string with formatted amount', () => {
      let newOpts = {
        wallet: {
          settings: { unitCode: 'xpi' }
        }
      };
      configProvider.set(newOpts);

      expect(txFormatProvider.formatAmountStr('xpi', 12312312)).toEqual(
        '12.312312 XPI'
      );
    });
  });

  describe('toFiat', () => {
    it('should return undefined if satoshis amount are undefined', () => {
      txFormatProvider.toFiat('xpi', undefined, 'USD').then(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should return null', () => {
      txFormatProvider.toFiat('xpi', 12312312, 'USD').then(result => {
        expect(result).toBeNull();
      });
    });

    it('should return a string with formatted amount', () => {
      spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
      txFormatProvider.toFiat('xpi', 12312312, 'USD').then(result => {
        expect(result).toEqual('1000000.00');
      });
    });
  });

  describe('formatToUSD', () => {
    it('should return undefined if satoshis amount are undefined', () => {
      txFormatProvider.formatToUSD('xpi', undefined).then(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should return null', () => {
      txFormatProvider.formatToUSD('xpi', 12312312).then(result => {
        expect(result).toBeNull();
      });
    });

    it('should return a string with formatted amount in USD', () => {
      spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
      txFormatProvider.formatToUSD('bch', 12312312).then(result => {
        expect(result).toEqual('1000000.00');
      });
    });
  });

  describe('processTx', () => {
    let tx: any = {
      action: 'received',
      amount: 447100,
      fee: 19440,
      outputs: [
        {
          alternativeAmountStr: '28.36 USD',
          amount: 447100,
          toAddress: 'lotus_16PSJPYxmBxaJYAd1GGRcVn2nD1vooHJCozd5Dw91'
        }
      ]
    };

    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            unitCode: 'xpi',
            alternativeIsoCode: 'USD'
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return same tx if tx.action is invalid', () => {
      tx.action = 'invalid';
      expect(txFormatProvider.processTx(Coin.XPI, tx)).toEqual(tx);
    });

    it('should return tx with defined values if tx.action is received', () => {
      tx.action = 'received';
      let result = txFormatProvider.processTx(Coin.XPI, tx);

      expect(tx.toAddress).toBeDefined();
      expect(tx.toAddress).toEqual('lotus_16PSJPYxmBxaJYAd1GGRcVn2nD1vooHJCozd5Dw91');
      expect(tx.amountStr).toBeDefined();
      expect(tx.alternativeAmountStr).toBeDefined();
      expect(tx.feeStr).toBeDefined();
      expect(result).toEqual(tx);
    });

    it('should return tx.toAddress in CashAddress format if coin is BCH', () => {
      tx.action = 'received';
      tx.outputs[0].toAddress = 'CWtp9bmTjiwBp89SvnZRbshkEkTY9TRZnt';
      txFormatProvider.processTx(Coin.BCH, tx);
      expect(tx.toAddress).toEqual(
        'qz0ys7q7utlsd7fmcsecxtpp9y8j8xhxtsy35kmzka'
      );
    });

    it('should return tx.addressTo in CashAddress format if coin is BCH', () => {
      tx.action = 'received';
      tx.addressTo = 'CWtp9bmTjiwBp89SvnZRbshkEkTY9TRZnt';
      txFormatProvider.processTx(Coin.BCH, tx);
      expect(tx.addressTo.toString()).toEqual(
        'qz0ys7q7utlsd7fmcsecxtpp9y8j8xhxtsy35kmzka'
      );
    });

    it('should return same tx.amount if only has one output', () => {
      tx.action = 'sent';
      txFormatProvider.processTx(Coin.XPI, tx);
      expect(tx.hasMultiplesOutputs).toBeFalsy();
      expect(tx.amount).toEqual(447100);
    });

    it('should return reduced tx.amount if has multiple outputs', () => {
      tx.action = 'sent';
      tx.outputs = [
        {
          alternativeAmountStr: '28.36 USD',
          amount: 447100,
          toAddress: 'mxMUZvgFR8D3LRscz5GbXERPXNSp1ww8Bb'
        },
        {
          alternativeAmountStr: '38.36 USD',
          amount: 647100,
          toAddress: 'mxMUZvgFR8D3LRscz5GbXERPXNSp1ww8Bb'
        }
      ];
      txFormatProvider.processTx(Coin.BCH, tx);
      expect(tx.hasMultiplesOutputs).toBeTruthy();
      expect(tx.amount).toEqual(1094200);
    });
  });

  describe('parseAmount', () => {
    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            unitCode: 'xpi',
            alternativeIsoCode: 'USD',
            unitToSatoshi: 1000000
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return amount parsed correctly if the currency is XPI', () => {
      let result = txFormatProvider.parseAmount(Coin.XPI, 0.012235, 'XPI', {
        onlyIntegers: false
      });
      expect(result).toEqual({
        amount: '0.012235',
        currency: 'XPI',
        alternativeIsoCode: 'USD',
        amountSat: 12235,
        amountUnitStr: '0.012235 XPI'
      });
    });

    it('should return amount parsed correctly if the currency is USD', () => {
      spyOn(filterProvider, 'formatFiatAmount').and.returnValue('1,505');
      spyOn(rateProvider, 'fromFiat').and.returnValue(24117237);

      let result = txFormatProvider.parseAmount(Coin.XPI, 1505, 'USD', {
        onlyIntegers: false
      });
      expect(result).toEqual({
        amount: 1505,
        currency: 'USD',
        alternativeIsoCode: 'USD',
        amountSat: 24117237,
        amountUnitStr: '1,505 USD'
      });
    });

    it('should return amount parsed correctly if the currency is sat', () => {
      spyOn(filterProvider, 'formatFiatAmount').and.returnValue('1,505');

      let result = txFormatProvider.parseAmount(Coin.XPI, 1505, 'sat', {
        onlyIntegers: false
      });
      expect(result).toEqual({
        amount: '0.001505',
        currency: 'XPI',
        alternativeIsoCode: 'USD',
        amountSat: 1505,
        amountUnitStr: '0.001505 XPI'
      });
    });
  });

  describe('satToUnit', () => {
    beforeEach(() => {
      let newOpts = {
        wallet: {
          settings: {
            alternativeIsoCode: 'USD',
            unitCode: 'xpi',
            unitDecimals: 6,
            unitToSatoshi: 1000000
          }
        }
      };
      configProvider.set(newOpts);
    });

    it('should return amount in unit format', () => {
      let result = txFormatProvider.satToUnit(12312312, Coin.XPI);
      expect(result).toEqual(12.312312);
    });
  });
});
