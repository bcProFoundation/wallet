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

export interface UtxoToken {
  addressInfo: IAddress;
  txid: string;
  outIdx: number;
  value: number;
  isNonSLP?: boolean;
  slpMeta?: any;
  tokenId?: string;
  amountToken?: number;
  tokenQty?: number;
  decimals?: number;
}

export interface IAddress {
  version: string;
  createdOn: number;
  address: string;
  walletId: string;
  isChange: boolean;
  path: string;
  publicKeys: string[];
  coin: string;
  network: string;
  type: string;
  hasActivity: any;
  beRegistered: boolean;
}

export interface Token {
  amountToken?: number;
  tokenId: string;
  tokenInfo?: TokenInfo;
  utxoToken?: UtxoToken[];
  alternativeBalance?: number;
}
