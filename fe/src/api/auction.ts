import instance from './instance';
import type {
  ApiResponse,
  AuctionDto,
  AuctionDetailDto,
  CreateAuctionRequest,
  CloseAuctionRequest,
} from './auction.types';

// 경매 목록 조회
export const fetchAuctions = async (storeId: number) => {
  const { data } = await instance.get<ApiResponse<AuctionDto[]>>(
    `/api/v1/auctions/store/${storeId}`
  );
  return data;
};

// 경매 상세 조회
export const fetchAuctionDetail = async (auctionId: number) => {
  const { data } = await instance.get<ApiResponse<AuctionDetailDto>>(
    `/api/v1/auctions/${auctionId}`
  );
  return data;
};

// 경매 등록
export const createAuction = async (
  storeId: number,
  body: CreateAuctionRequest
) => {
  const { data } = await instance.post<ApiResponse<null>>(
    `/api/v1/auctions/store/${storeId}`,
    body
  );
  return data;
};

// 경매 수정
export const updateAuction = async (
  auctionId: number,
  body: CreateAuctionRequest
) => {
  const { data } = await instance.put<ApiResponse<null>>(
    `/api/v1/auctions/${auctionId}`,
    body
  );
  return data;
};

// 경매 중단 (삭제)
export const deleteAuction = async (auctionId: number) => {
  const { data } = await instance.delete<ApiResponse<null>>(
    `/api/v1/auctions/${auctionId}`
  );
  return data;
};

// 경매 낙찰
export const closeAuction = async (
  auctionId: number,
  body: CloseAuctionRequest
) => {
  const { data } = await instance.post<ApiResponse<null>>(
    `/api/v1/auctions/${auctionId}/close`,
    body
  );
  return data;
};
