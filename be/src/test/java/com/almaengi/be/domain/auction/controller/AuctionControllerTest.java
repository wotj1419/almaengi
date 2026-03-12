package com.almaengi.be.domain.auction.controller;

import com.almaengi.be.domain.auction.dto.AuctionRequestDto;
import com.almaengi.be.domain.auction.dto.AuctionResponseDto;
import com.almaengi.be.domain.auction.service.AuctionService;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;

@WebMvcTest(controllers = AuctionController.class, excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class
})
@DisplayName("AuctionController 단위 테스트")
class AuctionControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockitoBean
        private AuctionService auctionService;

        @MockitoBean
        private JwtProvider jwtProvider;

        @MockitoBean
        private RedisTokenRepository redisTokenRepository;

        // 임시 토큰/사용자 ID 값 (실제 컨트롤러 내부에 있는 하드코딩된 값과 일치해야 함)
        private final Long TEMP_OWNER_ID = 1L;
        private final Long TEMP_ALBA_ID = 2L;

        @Nested
        @DisplayName("경매 등록 API 테스트")
        class RegisterAuctionTest {
                @Test
                @DisplayName("성공: 유효한 요청 데이터로 경매를 등록한다")
                void registerAuctionSuccess() throws Exception {
                        // given
                        Long storeId = 1L;
                        AuctionRequestDto.Register req = new AuctionRequestDto.Register();
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "minWage", 10320);
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "maxWage", 15000);
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "recruitCount", 1);
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "deadline",
                                        LocalDateTime.now().plusDays(1).withNano(0));
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "targetDate",
                                        LocalDate.now().plusDays(2));
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "targetStartTime",
                                        LocalTime.of(14, 0));
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "targetEndTime",
                                        LocalTime.of(18, 0));

                        // when & then
                        mockMvc.perform(post("/api/v1/auctions/store/{storeId}", storeId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(req)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.status").value("SUCCESS"));

                        Mockito.verify(auctionService, Mockito.times(1))
                                        .registerAuction(eq(TEMP_OWNER_ID), eq(storeId),
                                                        any(AuctionRequestDto.Register.class));
                }
        }

        @Nested
        @DisplayName("경매 지원(입찰) API 테스트")
        class BidAuctionTest {
                @Test
                @DisplayName("성공: 올바른 금액으로 경매에 입찰(지원)한다")
                void bidAuctionSuccess() throws Exception {
                        // given
                        Long auctionId = 100L;
                        AuctionRequestDto.Bid req = new AuctionRequestDto.Bid();
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "bidWage", 12000);

                        // when & then
                        mockMvc.perform(post("/api/v1/auctions/{auctionId}/bids", auctionId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(req)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.status").value("SUCCESS"));

                        Mockito.verify(auctionService, Mockito.times(1))
                                        .bidAuction(eq(auctionId), eq(TEMP_ALBA_ID), any(AuctionRequestDto.Bid.class));
                }
        }

        @Nested
        @DisplayName("경매 낙찰 확정(Close) API 테스트")
        class CloseAuctionTest {
                @Test
                @DisplayName("성공: 선택된 지원자들로 경매를 마감한다")
                void closeAuctionSuccess() throws Exception {
                        // given
                        Long auctionId = 100L;
                        AuctionRequestDto.Close req = new AuctionRequestDto.Close();
                        org.springframework.test.util.ReflectionTestUtils.setField(req, "selectedBidIds",
                                        Arrays.asList(1L, 2L));

                        // when & then
                        mockMvc.perform(post("/api/v1/auctions/{auctionId}/close", auctionId)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(req)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.status").value("SUCCESS"));

                        Mockito.verify(auctionService, Mockito.times(1))
                                        .closeAuction(eq(auctionId), eq(TEMP_OWNER_ID),
                                                        any(AuctionRequestDto.Close.class));
                }
        }

        @Nested
        @DisplayName("경매 목록 조회 API 테스트")
        class GetAuctionsTest {
                @Test
                @DisplayName("성공: 매장의 경매 목록을 반환한다")
                void getAuctionsSuccess() throws Exception {
                        // given
                        Long storeId = 1L;
                        AuctionResponseDto.Auction auctionMock = AuctionResponseDto.Auction.builder()
                                        .auctionId(100L)
                                        .status(com.almaengi.be.domain.auction.type.AuctionStatus.IN_PROGRESS)
                                        .build();

                        List<AuctionResponseDto.Auction> responseList = Arrays.asList(auctionMock);
                        Mockito.when(auctionService.getAuctions(storeId)).thenReturn(responseList);

                        // when & then
                        mockMvc.perform(get("/api/v1/auctions/store/{storeId}", storeId))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.status").value("SUCCESS"))
                                        .andExpect(jsonPath("$.data[0].auctionId").value(100));

                        Mockito.verify(auctionService, Mockito.times(1)).getAuctions(storeId);
                }
        }

        @Nested
        @DisplayName("경매 상세 내역 조회 API 테스트")
        class GetAuctionDetailTest {
                @Test
                @DisplayName("성공: 특정 경매의 상세 내역을 반환한다")
                void getAuctionDetailSuccess() throws Exception {
                        // given
                        Long auctionId = 100L;
                        AuctionResponseDto.Auction auctionMock = AuctionResponseDto.Auction.builder()
                                        .auctionId(auctionId)
                                        .status(com.almaengi.be.domain.auction.type.AuctionStatus.IN_PROGRESS)
                                        .build();
                        AuctionResponseDto.Detail detailMock = AuctionResponseDto.Detail.builder()
                                        .auction(auctionMock)
                                        .bidders(null) // Mock since ALBA token shouldn't return bidders, but doesn't
                                                       // matter for this
                                                       // basic assertion
                                        .build();

                        Mockito.when(auctionService.getAuctionDetail(auctionId, TEMP_OWNER_ID)).thenReturn(detailMock);

                        // when & then
                        mockMvc.perform(get("/api/v1/auctions/{auctionId}", auctionId))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.status").value("SUCCESS"))
                                        .andExpect(jsonPath("$.data.auction.auctionId").value(100));

                        Mockito.verify(auctionService, Mockito.times(1)).getAuctionDetail(auctionId, TEMP_OWNER_ID);
                }
        }
}
