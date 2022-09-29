
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
  
  export interface OrderOpts {
    fromCoinCode: string;
    amountFrom: number;
    isFromToken: boolean;
    fromTokenId?: string;
    toCoinCode: string;
    isToToken: boolean;
    toTokenId?: string;
    createdRate: number;
    addressUserReceive: string;
    fromSatUnit?: number;
    toSatUnit?: number;
    toTokenInfo? : TokenInfo;
    fromTokenInfo?: TokenInfo;
  }
  export interface IOrder {
    id: string | number;
    version: number;
    priority: number;
    fromCoinCode: string;
    fromTokenId?: string;
    amountFrom: number;
    fromSatUnit: number;
    isFromToken: boolean;
    toCoinCode: string;
    isToToken: boolean;
    toSatUnit: number;
    amountSentToUser: number;
    amountUserDeposit: number;
    createdRate: number;
    updatedRate: number;
    addressUserReceive: string;
    adddressUserDeposit: string;
    toTokenId?: string;
    listTxIdUserDeposit?: string[];
    listTxIdUserReceive?: string[];
    status?: string;
    isSentToFund?: boolean;
    isSentToUser?: boolean;
    endedOn?: number;
    createdOn?: number;
    error?: string;
    coinConfig?: CoinConfig;
    toTokenInfo?: TokenInfo;
    fromTokenInfo?: TokenInfo;
    note?: string;
    pendingReason?: string;
    lastModified?: number;
    isResolve?: boolean;
  }
  export interface CoinConfig {
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
  }