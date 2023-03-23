export const CARD_IAB_CONFIG =
  'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,hidden=yes,clearcache=yes,hidespinner=yes,disallowoverscroll=yes,zoom=no,transitionstyle=crossdissolve';
export const DUST_AMOUNT = 546;
export const currency = {
  name: 'Lotus',
  ticker: 'XPI',
  legacyPrefix: 'bitcoincash',
  prefixes: ['lotus'],
  coingeckoId: 'bitcoin-cash-abc-2',
  defaultFee: 1.01,
  dustSats: 550,
  etokenSats: 546,
  cashDecimals: 6,
  blockExplorerUrl: 'https://explorer.givelotus.org',
  tokenExplorerUrl: 'https://explorer.be.cash',
  blockExplorerUrlTestnet: 'https://texplorer.bitcoinabc.org',
  tokenName: 'eToken',
  tokenTicker: 'eToken',
  tokenPrefixes: ['etoken'],
  tokenIconsUrl: '', // https://tokens.bitcoin.com/32 for BCH SLP
  txHistoryCount: 10,
  hydrateUtxoBatchSize: 20,
  defaultSettings: { fiatCurrency: 'usd' },
  opReturn: {
    opReturnPrefixHex: '6a',
    opReturnAppPrefixLengthHex: '04',
    opPushDataOne: '4c',
    appPrefixesHex: {
      eToken: '534c5000',
      lotusChat: '02020202',
      lotusChatEncrypted: '03030303'
    },
    encryptedMsgByteLimit: 206,
    unencryptedMsgByteLimit: 215
  }
};