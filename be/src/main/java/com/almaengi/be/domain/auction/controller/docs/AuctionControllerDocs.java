package com.almaengi.be.domain.auction.controller.docs;
import com.almaengi.be.domain.auction.dto.AuctionRequestDto;
import com.almaengi.be.domain.auction.dto.AuctionResponseDto;
import com.almaengi.be.global.annotation.AuthUser;
import com.almaengi.be.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;
@Tag(name = "대타 경매 API", description = "대타 구인(경매) 관련 등록, 조회, 입찰, 마감 API")
public interface AuctionControllerDocs {
        @Operation(summary = "경매 등록", description = "사장님이 지정한 매장에 새로운 대타 경매를 올립니다.")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "성공"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(
                        responseCode = "400",
                        description = "A003: 하한가는 법정 최저시급 이상이어야 합니다.<br>" +
                                "A004: 상한가는 하한가 이상이어야 합니다.<br>" +
                                "A011: 마감 시간은 현재 시각 이후여야 합니다.<br>" +
                                "A012: 근무일은 오늘 이후(오늘 포함)여야 합니다."
                ),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U003: 접근 권한이 없는 역할입니다. (알바생 접근 시)"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.<br>S001: 해당 매장을 찾을 수 없습니다.")
        })
        ApiResponse<Void> registerAuction(
                @AuthUser Long userId,
                @Parameter(description = "등록할 매장 ID") @PathVariable Long storeId,
                @RequestBody AuctionRequestDto.Register request);
        @Operation(summary = "경매 지원(입찰)", description = "알바생이 경매에 희망 시급을 적어 지원(또는 기존 시급 수정)합니다.")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "지원 성공"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A002: 현재 진행 중인 경매가 아닙니다.<br>A005: 희망 시급은 상한가와 하한가 사이여야 합니다."),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U003: 접근 권한이 없는 역할입니다. (사장님 접근 시)"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.<br>S002: 해당 매장의 직원을 찾을 수 없습니다.<br>A001: 해당 구인 경매를 찾을 수 없습니다.")
        })
        ApiResponse<Void> bidAuction(
                @AuthUser Long userId,
                @Parameter(description = "지원할 경매 ID") @PathVariable Long auctionId,
                @RequestBody AuctionRequestDto.Bid request);
        @Operation(summary = "경매 낙찰", description = "사장님이 지원자 중 한 명 이상을 낙찰 확정하고 경매를 마감합니다.")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(
                        responseCode = "200",
                        description = "낙찰 성공",
                        content = @Content(schema = @Schema(implementation = AuctionResponseDto.CloseResult.class))
                ),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A002: 현재 진행 중인 경매가 아닙니다.<br>A006: 선택된 지원자가 없습니다.<br>A007: 유효하지 않은 입찰 정보가 포함되어 있습니다."),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U003: 접근 권한이 없는 역할입니다."),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.<br>A001: 해당 구인 경매를 찾을 수 없습니다.")
        })
        ApiResponse<AuctionResponseDto.CloseResult> closeAuction(
                @AuthUser Long userId,
                @Parameter(description = "마감할 경매 ID") @PathVariable Long auctionId,
                @RequestBody AuctionRequestDto.Close request);
        @Operation(summary = "매장별 경매 목록 조회", description = "특정 매장에 개설된 모든 대타 경매 목록을 조회합니다. (createdAt 포함)")
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "조회 성공",
                content = @Content(schema = @Schema(implementation = AuctionResponseDto.Auction.class))
        )
        ApiResponse<List<AuctionResponseDto.Auction>> getAuctions(
                @Parameter(description = "조회할 매장 ID") @PathVariable Long storeId);
        @Operation(summary = "단일 경매 상세 조회", description = "특정 경매의 상세 정보와 지원자 정보(사장님 권한일 경우)를 조회합니다. (auction.createdAt 포함)")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "조회 성공", content = @Content(schema = @Schema(implementation = AuctionResponseDto.Detail.class))),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A010: 잘못된 시간 형식입니다. (경매 소요 시간 계산 실패 시)"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.<br>A001: 해당 구인 경매를 찾을 수 없습니다.")
        })
        ApiResponse<AuctionResponseDto.Detail> getAuctionDetail(
                @AuthUser Long userId,
                @Parameter(description = "상세 조회할 경매 ID") @PathVariable Long auctionId);
        @Operation(summary = "경매 수정", description = "진행 중(IN_PROGRESS)인 경매 정보를 수정합니다.")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "수정 성공"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(
                        responseCode = "400",
                        description = "A002: 현재 진행 중인 경매가 아닙니다.<br>" +
                                "A003: 하한가는 법정 최저시급 이상이어야 합니다.<br>" +
                                "A004: 상한가는 하한가 이상이어야 합니다.<br>" +
                                "A011: 마감 시간은 현재 시각 이후여야 합니다.<br>" +
                                "A012: 근무일은 오늘 이후(오늘 포함)여야 합니다."
                ),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U003: 접근 권한이 없는 역할입니다."),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.<br>A001: 해당 구인 경매를 찾을 수 없습니다.")
        })
        ApiResponse<Void> updateAuction(
                @AuthUser Long userId,
                @Parameter(description = "수정할 경매 ID") @PathVariable Long auctionId,
                @RequestBody AuctionRequestDto.Update request);
        @Operation(summary = "경매 삭제(중단)", description = "진행 중(IN_PROGRESS)인 경매를 중단합니다. (soft cancel)")
        @ApiResponses(value = {
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "중단 성공"),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "A002: 현재 진행 중인 경매가 아닙니다."),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "U003: 접근 권한이 없는 역할입니다."),
                @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "U001: 해당 사용자를 찾을 수 없습니다.<br>A001: 해당 구인 경매를 찾을 수 없습니다.")
        })
        ApiResponse<Void> deleteAuction(
                @AuthUser Long userId,
                @Parameter(description = "중단할 경매 ID") @PathVariable Long auctionId);
}