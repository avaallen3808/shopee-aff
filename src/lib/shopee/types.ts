/** Shopee Affiliate API TypeScript types. */

export interface PageInfo {
  hasNextPage: boolean;
  scrollId?: string;
  nextPage?: number;
}

export interface ProductOffer {
  itemId: string;
  productName: string;
  productLink: string;
  offerLink: string;
  imageUrl: string;
  priceMin: number;
  priceMax: number;
  sales: number;
  ratingStar: number;
  commissionRate: number;
  sellerCommissionRate: number;
  shopeeCommissionRate: number;
  commission: number;
  shopId: string;
  shopName: string;
  shopType: number;
}

export interface ProductOfferResponse {
  nodes: ProductOffer[];
  pageInfo: PageInfo;
}

export interface ShopOffer {
  shopId: string;
  shopName: string;
  commissionRate: number;
  ratingStar: number;
  shopType: number;
  imageUrl: string;
  offerLink: string;
  remainingBudget: number;
  periodStartTime: number;
  periodEndTime: number;
}

export interface ShopOfferResponse {
  nodes: ShopOffer[];
  pageInfo: PageInfo;
}

export interface ShopeeOffer {
  commissionRate: number;
  imageUrl: string;
  offerLink: string;
  originalLink: string;
  offerName: string;
  offerType: string;
  periodStartTime: number;
  periodEndTime: number;
}

export interface ShopeeOfferResponse {
  nodes: ShopeeOffer[];
  pageInfo: PageInfo;
}

export interface ShortLinkResult {
  shortLink: string;
}

export interface ConversionOrderItem {
  itemName: string;
  itemPrice: number;
  quantity: number;
  itemTotalCommission: number;
  shopId: string;
  shopName: string;
  attributionType: string;
}

export interface ConversionOrder {
  orderId: string;
  items: ConversionOrderItem[];
}

export interface ConversionReportNode {
  purchaseTime: number;
  clickTime: number;
  conversionId: string;
  totalCommission: number;
  sellerCommission: number;
  shopeeCommissionCapped: number;
  netCommission: number;
  buyerType: string;
  utmContent: string;
  device: string;
  campaignType: string;
  orders: ConversionOrder[];
}

export interface ConversionReportResponse {
  nodes: ConversionReportNode[];
  pageInfo: PageInfo;
}

export interface ValidatedReportNode {
  purchaseTime: number;
  conversionId: string;
  totalCommission: number;
  netCommission: number;
  orders: ConversionOrder[];
}

export interface ValidatedReportResponse {
  nodes: ValidatedReportNode[];
  pageInfo: PageInfo;
}

export interface ShopeeGraphQLError {
  code: number;
  message: string;
}

export interface ShopeeGraphQLResponse<T> {
  data?: T;
  errors?: ShopeeGraphQLError[];
}
