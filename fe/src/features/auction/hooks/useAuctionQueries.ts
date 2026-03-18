import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAuctions,
  fetchAuctionDetail,
  createAuction,
  updateAuction,
  deleteAuction,
  closeAuction,
} from '@/api/auction';
import type {
  CreateAuctionRequest,
  CloseAuctionRequest,
} from '@/api/auction.types';

const AUCTION_KEYS = {
  all: ['auctions'] as const,
  list: (storeId: number) => [...AUCTION_KEYS.all, 'list', storeId] as const,
  detail: (auctionId: number) =>
    [...AUCTION_KEYS.all, 'detail', auctionId] as const,
};

// 경매 목록 조회
export function useAuctions(storeId: number) {
  return useQuery({
    queryKey: AUCTION_KEYS.list(storeId),
    queryFn: () => fetchAuctions(storeId),
    select: (res) => res.data,
  });
}

// 경매 상세 조회
export function useAuctionDetail(auctionId: number) {
  return useQuery({
    queryKey: AUCTION_KEYS.detail(auctionId),
    queryFn: () => fetchAuctionDetail(auctionId),
    select: (res) => res.data,
    enabled: auctionId > 0,
  });
}

// 경매 등록
export function useCreateAuction(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAuctionRequest) => createAuction(storeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.list(storeId) });
    },
  });
}

// 경매 수정
export function useUpdateAuction(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      auctionId,
      body,
    }: {
      auctionId: number;
      body: CreateAuctionRequest;
    }) => updateAuction(auctionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.list(storeId) });
    },
  });
}

// 경매 중단 (삭제)
export function useDeleteAuction(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: number) => deleteAuction(auctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.list(storeId) });
    },
  });
}

// 경매 낙찰
export function useCloseAuction(storeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      auctionId,
      body,
    }: {
      auctionId: number;
      body: CloseAuctionRequest;
    }) => closeAuction(auctionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.list(storeId) });
    },
  });
}
