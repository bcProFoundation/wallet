export interface TokenInfo {
  coin: string;
  blockCreated?: number;
  circulatingSupply?: number;
  containsBaton: true;
  decimals: number;
  documentHash?: string;
  documentUri: string;
  id: string;
  initialTokenQty: number;
  name: string;
  symbol: string;
  timestamp: string;
  timestamp_unix?: number;
  totalBurned: number;
  totalMinted: number;
  versionType: number;
}

export interface TokenItem{
  tokenId : string;
  tokenInfo: TokenInfo,
  amountToken: number,
  utxoToken: any;
}


export class ConfigSwap {
  coinSwap: CoinConfig[];
  coinReceive: CoinConfig[];
  static create(opts){
    const x = new ConfigSwap();
    x.coinReceive = opts.coinReceive;
    x.coinSwap = opts.coinSwap;
    return x;
  }
  static fromObj(opts){
    const x = new ConfigSwap();
    x.coinReceive = opts.coinReceive;
    x.coinSwap = opts.coinSwap;

    return x;
  }
}

export class CoinConfig{
  code: string;
  isToken: boolean;
  networkFee?: number;
  rate?: any;
  min?: number;
  minConvertToSat?: number;
  max?: number;
  maxConvertToSat?: number;
  tokenInfo?: TokenInfo;
  isEnable?: boolean;
  network: string;

  static create(opts){
    const x = new CoinConfig();
    x.code = opts.code;
    x.isToken = opts.isToken;
    x.networkFee = opts.networkFee || 0;
    x.rate = null;
    x.min = opts.min || 0;
    x.minConvertToSat = opts.minConvertToSat || 0;
    x.max = opts.max || 0;
    x.maxConvertToSat = opts.maxConvertToSat || 0;
    x.tokenInfo = opts.tokenInfo || null;
    x.isEnable = opts.isEnable || true;
    x.network = opts.network;
    return x;
  }

  static fromObj(opts){
    const x = new CoinConfig();
    x.code = opts.code;
    x.isToken = opts.isToken;
    x.networkFee = opts.networkFee;
    x.rate = opts.rate;
    x.min = opts.min;
    x.minConvertToSat = opts.minConvertToSat;
    x.max = opts.max;
    x.maxConvertToSat = opts.maxConvertToSat;
    x.tokenInfo = opts.tokenInfo;
    x.isEnable = opts.isEnable;
    x.network = opts.network;
    return x;
  }
}
