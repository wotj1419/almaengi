export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export type AuctionStatus = 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

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
  status: AuctionStatus;
  winnerIds: number[];
  createdAt?: string;
}

export interface BidderDto {
  bidId: number;
  employeeId: number;
  applicantName: string;
  proposedWage: number;
  tags: string[];
  bidTime: string;
}

export interface AuctionBiddersDto {
  group1: BidderDto[];
  group2: BidderDto[];
  group3: BidderDto[];
}

export interface AuctionDetailDto {
  auction: AuctionDto;
  bidders: AuctionBiddersDto | null;
}

export interface CreateAuctionRequest {
  targetDate: string;
  targetStartTime: string;
  targetEndTime: string;
  deadline: string;
  minWage: number;
  maxWage: number;
  recruitCount: number;
}

export interface BidAuctionRequest {
  bidWage: number;
}

export interface CloseAuctionRequest {
  selectedBidIds: number[];
}

export interface CloseAuctionWinnerDto {
  bidId: number;
  employeeId: number;
  employeeName: string;
  bidWage: number;
}

export interface CloseAuctionResponse {
  auctionId: number;
  status: AuctionStatus;
  winners: CloseAuctionWinnerDto[];
}
