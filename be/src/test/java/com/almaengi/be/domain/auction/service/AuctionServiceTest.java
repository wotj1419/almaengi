package com.almaengi.be.domain.auction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.auction.dto.AuctionRequestDto;
import com.almaengi.be.domain.auction.entity.ShiftAuction;
import com.almaengi.be.domain.auction.repository.AuctionBidRepository;
import com.almaengi.be.domain.auction.repository.AuctionWinnerRepository;
import com.almaengi.be.domain.auction.repository.ShiftAuctionRepository;
import com.almaengi.be.domain.auction.type.AuctionStatus;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.UserRole;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;

@ExtendWith(MockitoExtension.class)
class AuctionServiceTest {

    @InjectMocks
    private AuctionService auctionService;

    @Mock
    private ShiftAuctionRepository shiftAuctionRepository;
    @Mock
    private AuctionBidRepository auctionBidRepository;
    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private AuctionWinnerRepository auctionWinnerRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private UserRepository userRepository;

    private User owner;
    private User alba;
    private Store store;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(auctionService, "legalMinimumWage", 10320);

        owner = User.builder().email("owner@test.com").name("사장님").role(UserRole.OWNER).build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        alba = User.builder().email("alba@test.com").name("알바생").role(UserRole.ALBA).build();
        ReflectionTestUtils.setField(alba, "id", 2L);

        store = Store.builder().name("알맹이 편의점").build();
        ReflectionTestUtils.setField(store, "id", 1L);
    }

    @Nested
    @DisplayName("경매 등록 (registerAuction) 테스트")
    class RegisterAuctionTest {
        @Test
        @DisplayName("성공: 올바른 요건으로 경매를 등록한다")
        void success() {
            // given
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));

            AuctionRequestDto.Register req = new AuctionRequestDto.Register();
            ReflectionTestUtils.setField(req, "targetDate", LocalDate.now());
            ReflectionTestUtils.setField(req, "targetStartTime", LocalTime.of(14, 0));
            ReflectionTestUtils.setField(req, "targetEndTime", LocalTime.of(18, 0));
            ReflectionTestUtils.setField(req, "deadline", LocalDateTime.now().plusDays(1));
            ReflectionTestUtils.setField(req, "minWage", 10500);
            ReflectionTestUtils.setField(req, "maxWage", 15000);
            ReflectionTestUtils.setField(req, "recruitCount", 1);

            ShiftAuction mockedAuction = ShiftAuction.builder().store(store).minWage(10500).build();
            ReflectionTestUtils.setField(mockedAuction, "id", 99L);
            when(shiftAuctionRepository.save(any(ShiftAuction.class))).thenReturn(mockedAuction);

            // when
            Long auctionId = auctionService.registerAuction(owner.getId(), store.getId(), req);

            // then
            assertThat(auctionId).isEqualTo(99L);
            verify(shiftAuctionRepository, times(1)).save(any(ShiftAuction.class));
        }

        @Test
        @DisplayName("실패: 요청자가 OWNER가 아니면 UNAUTHORIZED_ROLE 발생")
        void failWhenUserIsNotOwner() {
            // given
            when(userRepository.findById(alba.getId())).thenReturn(Optional.of(alba));
            AuctionRequestDto.Register req = new AuctionRequestDto.Register();

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.registerAuction(alba.getId(), store.getId(), req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_ROLE);
        }

        @Test
        @DisplayName("실패: 설정된 minWage가 최저시급(10320)보다 낮으면 INVALID_MIN_WAGE 발생")
        void failWhenMinWageUnderLimit() {
            // given
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));

            AuctionRequestDto.Register req = new AuctionRequestDto.Register();
            ReflectionTestUtils.setField(req, "minWage", 9000); // 10320 미만

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.registerAuction(owner.getId(), store.getId(), req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_MIN_WAGE);
        }

        @Test
        @DisplayName("실패: 설정된 maxWage가 minWage보다 낮으면 INVALID_MAX_WAGE 발생")
        void failWhenMaxWageUnderMinWage() {
            // given
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));

            AuctionRequestDto.Register req = new AuctionRequestDto.Register();
            ReflectionTestUtils.setField(req, "minWage", 12000);
            ReflectionTestUtils.setField(req, "maxWage", 11000); // 오류!

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.registerAuction(owner.getId(), store.getId(), req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_MAX_WAGE);
        }
    }

    @Nested
    @DisplayName("경매 지원 (bidAuction) 테스트")
    class BidAuctionTest {
        private ShiftAuction activeAuction;
        private StoreEmployee bidder;

        @BeforeEach
        void setUpBid() {
            activeAuction = ShiftAuction.builder().store(store).minWage(10320).maxWage(15000).build();
            ReflectionTestUtils.setField(activeAuction, "id", 100L);
            ReflectionTestUtils.setField(activeAuction, "status",
                    com.almaengi.be.domain.auction.type.AuctionStatus.IN_PROGRESS);

            bidder = StoreEmployee.builder().store(store).user(alba).build();
            ReflectionTestUtils.setField(bidder, "id", 10L);
        }

        @Test
        @DisplayName("성공: 최초 지원 시 새로운 입찰(AuctionBid)을 저장한다")
        void successFirstBid() {
            // given
            when(userRepository.findById(alba.getId())).thenReturn(Optional.of(alba));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));
            when(storeEmployeeRepository.findByStoreIdAndUserId(store.getId(), alba.getId()))
                    .thenReturn(Optional.of(bidder));
            when(auctionBidRepository.findByShiftAuctionIdAndBidderId(activeAuction.getId(), bidder.getId()))
                    .thenReturn(Optional.empty());

            AuctionRequestDto.Bid req = new AuctionRequestDto.Bid();
            ReflectionTestUtils.setField(req, "bidWage", 12000);

            // when
            auctionService.bidAuction(activeAuction.getId(), alba.getId(), req);

            // then
            verify(auctionBidRepository, times(1)).save(any(com.almaengi.be.domain.auction.entity.AuctionBid.class));
        }

        @Test
        @DisplayName("성공: 재지원 시 기존 입찰 금액을 업데이트한다")
        void successUpdateBid() {
            // given
            when(userRepository.findById(alba.getId())).thenReturn(Optional.of(alba));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));
            when(storeEmployeeRepository.findByStoreIdAndUserId(store.getId(), alba.getId()))
                    .thenReturn(Optional.of(bidder));

            com.almaengi.be.domain.auction.entity.AuctionBid existingBid = com.almaengi.be.domain.auction.entity.AuctionBid
                    .builder()
                    .shiftAuction(activeAuction)
                    .bidder(bidder)
                    .bidWage(13000)
                    .build();
            when(auctionBidRepository.findByShiftAuctionIdAndBidderId(activeAuction.getId(), bidder.getId()))
                    .thenReturn(Optional.of(existingBid));

            AuctionRequestDto.Bid req = new AuctionRequestDto.Bid();
            ReflectionTestUtils.setField(req, "bidWage", 11000);

            // when
            auctionService.bidAuction(activeAuction.getId(), alba.getId(), req);

            // then
            assertThat(existingBid.getBidWage()).isEqualTo(11000);
            verify(auctionBidRepository, never()).save(any(com.almaengi.be.domain.auction.entity.AuctionBid.class));
        }

        @Test
        @DisplayName("실패: 경매가 IN_PROGRESS 상태가 아니면 AUCTION_NOT_IN_PROGRESS 발생")
        void failWhenAuctionNotInProgress() {
            // given
            ReflectionTestUtils.setField(activeAuction, "status",
                    com.almaengi.be.domain.auction.type.AuctionStatus.CLOSED);

            when(userRepository.findById(alba.getId())).thenReturn(Optional.of(alba));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));
            when(storeEmployeeRepository.findByStoreIdAndUserId(store.getId(), alba.getId()))
                    .thenReturn(Optional.of(bidder));

            AuctionRequestDto.Bid req = new AuctionRequestDto.Bid();

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.bidAuction(activeAuction.getId(), alba.getId(), req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUCTION_NOT_IN_PROGRESS);
        }

        @Test
        @DisplayName("실패: 입찰 금액이 범위를 벗어나면 INVALID_BID_WAGE 발생")
        void failWhenBidWageOutOfRange() {
            // given
            when(userRepository.findById(alba.getId())).thenReturn(Optional.of(alba));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));
            when(storeEmployeeRepository.findByStoreIdAndUserId(store.getId(), alba.getId()))
                    .thenReturn(Optional.of(bidder));

            AuctionRequestDto.Bid req = new AuctionRequestDto.Bid();
            ReflectionTestUtils.setField(req, "bidWage", 16000); // 15000 초과

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.bidAuction(activeAuction.getId(), alba.getId(), req));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_BID_WAGE);
        }
    }

    @Nested
    @DisplayName("경매 지원자 목록 조회 (getAuctionBidders) 테스트")
    class GetAuctionBiddersTest {
        private ShiftAuction activeAuction;

        @BeforeEach
        void setUpBidders() {
            activeAuction = ShiftAuction.builder()
                    .store(store).minWage(10320).maxWage(15000)
                    .targetDate(LocalDate.now())
                    .targetStartTime(LocalTime.of(14, 0))
                    .targetEndTime(LocalTime.of(18, 0))
                    .build();
            ReflectionTestUtils.setField(activeAuction, "id", 100L);
            ReflectionTestUtils.setField(activeAuction, "status",
                    com.almaengi.be.domain.auction.type.AuctionStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("성공: 사장님이 요청할 경우 지원자를 그룹별로 나누어 반환한다")
        void successForOwner() {
            // given
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));

            StoreEmployee emp1 = StoreEmployee.builder().store(store).user(alba).build();
            ReflectionTestUtils.setField(emp1, "id", 10L);
            ReflectionTestUtils.setField(emp1, "willWorkingMinutes", 14 * 60); // 1그룹에 못미침. 4시간 대타 뛰면 18시간이 됨

            com.almaengi.be.domain.auction.entity.AuctionBid bid1 = com.almaengi.be.domain.auction.entity.AuctionBid
                    .builder()
                    .shiftAuction(activeAuction).bidder(emp1).bidWage(12000).build();
            ReflectionTestUtils.setField(bid1, "id", 1000L);

            when(auctionBidRepository.findAllByShiftAuctionId(activeAuction.getId()))
                    .thenReturn(java.util.Arrays.asList(bid1));
            when(attendanceRepository.countByEmployeeIdAndStatus(eq(emp1.getId()), any()))
                    .thenReturn(0);

            // when
            com.almaengi.be.domain.auction.dto.AuctionResponseDto.Detail res = auctionService
                    .getAuctionDetail(activeAuction.getId(), owner.getId());

            // then
            assertThat(res).isNotNull();
            assertThat(res.getBidders()).isNotNull();
            // 그룹 2에 포함되어야 함
            assertThat(res.getBidders().getGroup2()).hasSize(1);
            assertThat(res.getBidders().getGroup2().get(0).getProposedWage()).isEqualTo(12000);
        }

        @Test
        @DisplayName("성공: 알바생이 요청할 경우 bidders 정보는 null 이다")
        void successForAlba() {
            // given
            when(userRepository.findById(alba.getId())).thenReturn(Optional.of(alba));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));

            // when
            com.almaengi.be.domain.auction.dto.AuctionResponseDto.Detail res = auctionService
                    .getAuctionDetail(activeAuction.getId(), alba.getId());

            // then
            assertThat(res).isNotNull();
            assertThat(res.getBidders()).isNull();
        }
    }

    @Nested
    @DisplayName("경매 낙찰 확정 (closeAuction) 테스트")
    class CloseAuctionTest {
        private ShiftAuction activeAuction;
        private StoreEmployee bidder;

        @BeforeEach
        void setUpClose() {
            activeAuction = ShiftAuction.builder()
                    .store(store).minWage(10320).maxWage(15000)
                    .targetDate(LocalDate.now())
                    .targetStartTime(LocalTime.of(14, 0))
                    .targetEndTime(LocalTime.of(18, 0))
                    .build();
            ReflectionTestUtils.setField(activeAuction, "id", 100L);
            ReflectionTestUtils.setField(activeAuction, "status",
                    com.almaengi.be.domain.auction.type.AuctionStatus.IN_PROGRESS);
            ReflectionTestUtils.setField(activeAuction, "recruitCount", 1);

            bidder = StoreEmployee.builder().store(store).user(alba)
                    .status(com.almaengi.be.domain.store.type.StoreEmployeeStatus.WORKING).build();
            ReflectionTestUtils.setField(bidder, "id", 10L);
            ReflectionTestUtils.setField(bidder, "willWorkingMinutes", 0);
        }

        @Test
        @DisplayName("성공: 사장님이 지원자를 낙찰하고 경매를 마감(CLOSED) 상태로 만든다")
        void successCloseAuction() {
            // given
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(activeAuction.getId())).thenReturn(Optional.of(activeAuction));

            com.almaengi.be.domain.auction.entity.AuctionBid bid1 = com.almaengi.be.domain.auction.entity.AuctionBid
                    .builder()
                    .shiftAuction(activeAuction).bidder(bidder).bidWage(12000).build();
            ReflectionTestUtils.setField(bid1, "id", 1000L);

            AuctionRequestDto.Close req = new AuctionRequestDto.Close();
            ReflectionTestUtils.setField(req, "selectedBidIds", java.util.Arrays.asList(1000L));

            when(auctionBidRepository.findAllById(req.getSelectedBidIds()))
                    .thenReturn(java.util.Arrays.asList(bid1));

            // when
            auctionService.closeAuction(activeAuction.getId(), owner.getId(), req);

            // then
            assertThat(activeAuction.getStatus()).isEqualTo(com.almaengi.be.domain.auction.type.AuctionStatus.CLOSED);
            verify(auctionWinnerRepository, times(1))
                    .save(any(com.almaengi.be.domain.auction.entity.AuctionWinner.class));
            verify(attendanceRepository, times(1)).save(any(com.almaengi.be.domain.attendance.entity.Attendance.class));
            assertThat(bidder.getWillWorkingMinutes()).isEqualTo(240); // 4시간 합산
        }
    }
}
