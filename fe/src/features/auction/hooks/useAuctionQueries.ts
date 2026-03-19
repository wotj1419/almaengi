import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closeAuction,
  createAuction,
  deleteAuction,
  fetchAuctionDetail,
  fetchAuctions,
  updateAuction,
} from '@/api/auction';
import type {
  CloseAuctionRequest,
  CreateAuctionRequest,
} from '@/api/auction.types';

const AUCTION_KEYS = {
  all: ['auctions'] as const,
  list: (storeId: number) => [...AUCTION_KEYS.all, 'list', storeId] as const,
  detail: (auctionId: number) =>
    [...AUCTION_KEYS.all, 'detail', auctionId] as const,
};

export function useAuctions(storeId: number) {
  return useQuery({
    queryKey: AUCTION_KEYS.list(storeId),
    queryFn: () => fetchAuctions(storeId),
  });
}

export function useAuctionDetail(auctionId: number) {
  return useQuery({
    queryKey: AUCTION_KEYS.detail(auctionId),
    queryFn: () => fetchAuctionDetail(auctionId),
    enabled: auctionId > 0,
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      body,
    }: {
      storeId: number;
      body: CreateAuctionRequest;
    }) => createAuction(storeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.all });
    },
  });
}

export function useUpdateAuction() {
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
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.all });
    },
  });
}

export function useDeleteAuction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auctionId: number) => deleteAuction(auctionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.all });
    },
  });
}

export function useCloseAuction() {
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
      queryClient.invalidateQueries({ queryKey: AUCTION_KEYS.all });
    },
  });
}
