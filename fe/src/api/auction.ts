import instance from './instance';
import type {
  ApiResponse,
  AuctionDto,
  AuctionDetailDto,
  BidAuctionRequest,
  CloseAuctionRequest,
  CloseAuctionResponse,
  CreateAuctionRequest,
} from './auction.types';

export const fetchAuctions = async (storeId: number) => {
  const { data } = await instance.get<ApiResponse<AuctionDto[]>>(
    `/api/v1/auctions/store/${storeId}`
  );

  return data.data;
};

export const fetchAuctionDetail = async (auctionId: number) => {
  const { data } = await instance.get<ApiResponse<AuctionDetailDto>>(
    `/api/v1/auctions/${auctionId}`
  );

  return data.data;
};

export const bidAuction = async (auctionId: number, body: BidAuctionRequest) => {
  const { data } = await instance.post<ApiResponse<null>>(
    `/api/v1/auctions/${auctionId}/bids`,
    body
  );

  return data.data;
};

export const createAuction = async (
  storeId: number,
  body: CreateAuctionRequest
) => {
  const { data } = await instance.post<ApiResponse<null>>(
    `/api/v1/auctions/store/${storeId}`,
    body
  );

  return data.data;
};

export const updateAuction = async (
  auctionId: number,
  body: CreateAuctionRequest
) => {
  const { data } = await instance.put<ApiResponse<null>>(
    `/api/v1/auctions/${auctionId}`,
    body
  );

  return data.data;
};

export const deleteAuction = async (auctionId: number) => {
  const { data } = await instance.delete<ApiResponse<null>>(
    `/api/v1/auctions/${auctionId}`
  );

  return data.data;
};

export const closeAuction = async (
  auctionId: number,
  body: CloseAuctionRequest
) => {
  const { data } = await instance.post<ApiResponse<CloseAuctionResponse>>(
    `/api/v1/auctions/${auctionId}/close`,
    body
  );

  return data.data;
};
