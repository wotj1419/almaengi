package com.almaengi.be.domain.auction.controller;

import com.almaengi.be.domain.auction.controller.docs.AuctionControllerDocs;
import com.almaengi.be.domain.auction.dto.AuctionRequestDto;
import com.almaengi.be.domain.auction.dto.AuctionResponseDto;
import com.almaengi.be.domain.auction.service.AuctionService;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 시간 경매 (대타 구인) 관련 REST API 엔드포인트
 */
@RestController
@RequestMapping("/api/v1/auctions")
@RequiredArgsConstructor
public class AuctionController implements AuctionControllerDocs {
    private final AuctionService auctionService;

    /**
     * [Phase 3-1: 경매 등록]
     * 사장님(OWNER) 전용 API. 지정한 매장에 대타 경매를 올립니다.
     */
    @PostMapping("/store/{storeId}")
    public ApiResponse<Void> registerAuction(
            @AuthUser Long userId,
            @PathVariable Long storeId,
            @RequestBody AuctionRequestDto.Register request) {

        // 2. 서비스 로직 호출 (권한 체크 및 엔티티 조회는 Service 내부에서 수행)
        auctionService.registerAuction(userId, storeId, request);
        return ApiResponse.success();
    }

    /**
     * [Phase 3-2: 경매 지원(입찰)]
     * 알바생(ALBA) 전용 API. 경매에 지원(또는 금액 수정)합니다.
     */
    @PostMapping("/{auctionId}/bids")
    public ApiResponse<Void> bidAuction(
            @AuthUser Long userId,
            @PathVariable Long auctionId,
            @RequestBody AuctionRequestDto.Bid request) {

        // 2. 서비스 로직 호출 (employee 유효성 검증은 service에서 진행됨)
        auctionService.bidAuction(auctionId, userId, request);
        return ApiResponse.success();
    }

    /**
     * [Phase 3-4: 낙찰 확정 및 경매 마감]
     * 사장님(OWNER) 전용 API. 다수의 알바생을 낙찰 확정 짓고 경매를 종료합니다.
     */
    @PostMapping("/{auctionId}/close")
    public ApiResponse<AuctionResponseDto.CloseResult> closeAuction(
            @AuthUser Long userId,
            @PathVariable Long auctionId,
            @RequestBody AuctionRequestDto.Close request) {

        // 2. 서비스 로직 호출
        AuctionResponseDto.CloseResult response = auctionService.closeAuction(auctionId, userId, request);
        return ApiResponse.success(response);
    }

    /**
     * [Phase 3-5: 경매 목록 조회]
     * 사장님(OWNER), 알바생(ALBA) 공용 API. 지정한 매장에 등록된 대타 경매 목록을 조회합니다.
     */
    @GetMapping("/store/{storeId}")
    public ApiResponse<List<AuctionResponseDto.Auction>> getAuctions(@PathVariable Long storeId) {
        List<AuctionResponseDto.Auction> response = auctionService.getAuctions(storeId);
        return ApiResponse.success(response);
    }

    /**
     * [Phase 3-5: 경매 상세 조회]
     * 사장님(OWNER), 알바생(ALBA) 공용 API. 특정 경매의 상세 정보를 조회합니다.
     * 사장님의 경우 지원자 목록(Bidders)이 포함되고, 알바생은 포함되지 않습니다.
     */
    @GetMapping("/{auctionId}")
    public ApiResponse<AuctionResponseDto.Detail> getAuctionDetail(
            @AuthUser Long userId,
            @PathVariable Long auctionId) {

        // 2. 권한(Role)에 따른 상세 조회 로직 분기 (Service 로직에서 처리)
        AuctionResponseDto.Detail response = auctionService.getAuctionDetail(auctionId, userId);
        return ApiResponse.success(response);
    }

    // 경매 수정
    @PutMapping("/{auctionId}")
    public ApiResponse<Void> updateAuction(@AuthUser Long userId, @PathVariable Long auctionId, @RequestBody AuctionRequestDto.Update request) {
        auctionService.updateAuction(auctionId, userId, request);
        return ApiResponse.success();
    }

    // 경매 삭제(취소)
    @DeleteMapping("/{auctionId}")
    public ApiResponse<Void> deleteAuction(@AuthUser Long userId, @PathVariable Long auctionId) {
        auctionService.deleteAuction(auctionId, userId);
        return ApiResponse.success();
    }

}
