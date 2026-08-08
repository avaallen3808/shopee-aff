/** GraphQL query strings for Shopee Affiliate Open API. */

export const PRODUCT_OFFER_V2_QUERY = `
  query productOfferV2(
    $keyword: String
    $shopId: String
    $itemId: String
    $productCatId: String
    $listType: Int
    $sortType: Int
    $page: Int
    $isAMSOffer: Boolean
    $isKeySeller: Boolean
    $limit: Int
  ) {
    productOfferV2(
      keyword: $keyword
      shopId: $shopId
      itemId: $itemId
      productCatId: $productCatId
      listType: $listType
      sortType: $sortType
      page: $page
      isAMSOffer: $isAMSOffer
      isKeySeller: $isKeySeller
      limit: $limit
    ) {
      nodes {
        itemId
        productName
        productLink
        offerLink
        imageUrl
        priceMin
        priceMax
        sales
        ratingStar
        commissionRate
        sellerCommissionRate
        shopeeCommissionRate
        commission
        shopId
        shopName
        shopType
      }
      pageInfo {
        hasNextPage
        nextPage
      }
    }
  }
`;

export const SHOP_OFFER_V2_QUERY = `
  query shopOfferV2(
    $shopId: String
    $keyword: String
    $shopType: Int
    $isKeySeller: Boolean
    $sortType: Int
    $sellerCommCoveRatio: Float
    $page: Int
    $limit: Int
  ) {
    shopOfferV2(
      shopId: $shopId
      keyword: $keyword
      shopType: $shopType
      isKeySeller: $isKeySeller
      sortType: $sortType
      sellerCommCoveRatio: $sellerCommCoveRatio
      page: $page
      limit: $limit
    ) {
      nodes {
        shopId
        shopName
        commissionRate
        ratingStar
        shopType
        imageUrl
        offerLink
        remainingBudget
        periodStartTime
        periodEndTime
      }
      pageInfo {
        hasNextPage
        nextPage
      }
    }
  }
`;

export const SHOPEE_OFFER_V2_QUERY = `
  query shopeeOfferV2(
    $keyword: String
    $sortType: Int
    $page: Int
    $limit: Int
  ) {
    shopeeOfferV2(
      keyword: $keyword
      sortType: $sortType
      page: $page
      limit: $limit
    ) {
      nodes {
        commissionRate
        imageUrl
        offerLink
        originalLink
        offerName
        offerType
        periodStartTime
        periodEndTime
      }
      pageInfo {
        hasNextPage
        nextPage
      }
    }
  }
`;

export const GENERATE_SHORT_LINK_MUTATION = `
  mutation generateShortLink($input: GenerateShortLinkInput!) {
    generateShortLink(input: $input) {
      shortLink
    }
  }
`;

export const CONVERSION_REPORT_QUERY = `
  query conversionReport(
    $purchaseTimeStart: Int
    $purchaseTimeEnd: Int
    $orderStatus: String
    $buyerType: String
    $device: String
    $limit: Int
    $scrollId: String
  ) {
    conversionReport(
      purchaseTimeStart: $purchaseTimeStart
      purchaseTimeEnd: $purchaseTimeEnd
      orderStatus: $orderStatus
      buyerType: $buyerType
      device: $device
      limit: $limit
      scrollId: $scrollId
    ) {
      nodes {
        purchaseTime
        clickTime
        conversionId
        totalCommission
        sellerCommission
        shopeeCommissionCapped
        netCommission
        buyerType
        utmContent
        device
        campaignType
        orders {
          orderId
          items {
            itemName
            itemPrice
            quantity
            itemTotalCommission
            shopId
            shopName
            attributionType
          }
        }
      }
      pageInfo {
        hasNextPage
        scrollId
      }
    }
  }
`;

export const VALIDATED_REPORT_QUERY = `
  query validatedReport(
    $validationId: String!
    $limit: Int
    $scrollId: String
  ) {
    validatedReport(
      validationId: $validationId
      limit: $limit
      scrollId: $scrollId
    ) {
      nodes {
        purchaseTime
        conversionId
        totalCommission
        netCommission
        orders {
          orderId
          items {
            itemName
            itemPrice
            quantity
            itemTotalCommission
            shopId
            shopName
            attributionType
          }
        }
      }
      pageInfo {
        hasNextPage
        scrollId
      }
    }
  }
`;
