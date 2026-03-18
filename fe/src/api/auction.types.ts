// API 응답 공통 타입
export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// 경매 DTO (목록/상세 조회 응답)
export interface AuctionDto {
  auctionId: number;
  storeId: number;
  targetDate: string;
  targetStartTime: string;
  targetEndTime: string;
  deadline: string;
  minWage: number;
  maxWage: number;
  recruitCount: number;
  status: 'IN_PROGRESS' | 'CLOSED';
  winnerIds: number[];
}

// 입찰자 DTO
export interface BidderDto {
  bidId: number;
  employeeId: number;
  applicantName: string;
  proposedWage: number;
  tags: string[];
  bidTime: string;
}

// 경매 상세 조회 응답
export interface AuctionDetailDto {
  auction: AuctionDto;
  bidders: {
    group1: BidderDto[];
    group2: BidderDto[];
    group3: BidderDto[];
  } | null;
}

// 경매 등록 요청
export interface CreateAuctionRequest {
  targetDate: string;
  targetStartTime: string;
  targetEndTime: string;
  deadline: string;
  minWage: number;
  maxWage: number;
  recruitCount: number;
}

// 경매 낙찰 요청
export interface CloseAuctionRequest {
  selectedBidIds: number[];
}
