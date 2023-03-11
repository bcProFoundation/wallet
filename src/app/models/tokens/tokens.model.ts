export interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  coin: string;
  decimals: number;
  documentHash?: string;
  documentUri: string;
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
