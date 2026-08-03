export type SearchEntityType =
  | 'WALLET'
  | 'TRANSACTION'
  | 'TOKEN'
  | 'EXCHANGE'
  | 'HYPERLIQUID_TRADER';

export interface SearchResultItem {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  chain?: string;
  badge: string;
  score?: number;
  metadata?: any;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  categories: {
    wallets: SearchResultItem[];
    transactions: SearchResultItem[];
    tokens: SearchResultItem[];
    exchanges: SearchResultItem[];
    hyperliquidTraders: SearchResultItem[];
  };
}
