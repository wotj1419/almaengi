package com.almaengi.be.domain.auction.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.auction.dto.AuctionRequestDto;
import com.almaengi.be.domain.auction.dto.AuctionResponseDto;
import com.almaengi.be.domain.auction.entity.AuctionBid;
import com.almaengi.be.domain.auction.entity.ShiftAuction;
import com.almaengi.be.domain.auction.repository.AuctionBidRepository;
import com.almaengi.be.domain.auction.repository.AuctionWinnerRepository;
import com.almaengi.be.domain.auction.repository.ShiftAuctionRepository;
import com.almaengi.be.domain.auction.type.AuctionStatus;
import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.notification.type.NotificationType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuctionService 시나리오 테스트")
class AuctionServiceScenarioTest {

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
    @Mock
    private NotificationService notificationService;

    private User owner;
    private User anotherOwner;
    private User employeeUser;
    private Store store;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(auctionService, "legalMinimumWage", 10320);

        owner = User.builder().email("owner@test.com").name("사장님").role(Role.OWNER).build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        anotherOwner = User.builder().email("owner2@test.com").name("다른사장").role(Role.OWNER).build();
        ReflectionTestUtils.setField(anotherOwner, "id", 99L);

        employeeUser = User.builder().email("emp@test.com").name("직원A").role(Role.EMPLOYEE).build();
        ReflectionTestUtils.setField(employeeUser, "id", 2L);

        store = Store.builder().owner(owner).name("알맹이 수완점").build();
        ReflectionTestUtils.setField(store, "id", 10L);
    }

    @Nested
    @DisplayName("등록 검증 시나리오")
    class RegisterValidationScenario {
        @Test
        @DisplayName("실패: deadline 이 현재 이하이면 INVALID_DEADLINE")
        void failWhenDeadlineIsPast() {
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(storeRepository.findByIdAndIsClosedFalse(store.getId())).thenReturn(Optional.of(store));

            AuctionRequestDto.Register req = new AuctionRequestDto.Register();
            ReflectionTestUtils.setField(req, "targetDate", LocalDate.now());
            ReflectionTestUtils.setField(req, "targetStartTime", LocalTime.of(9, 0));
            ReflectionTestUtils.setField(req, "targetEndTime", LocalTime.of(13, 0));
            ReflectionTestUtils.setField(req, "deadline", LocalDateTime.now().minusMinutes(1));
            ReflectionTestUtils.setField(req, "maxWage", 13000);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.registerAuction(owner.getId(), store.getId(), req));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_DEADLINE);
        }

        @Test
        @DisplayName("실패: targetDate 가 오늘 이전이면 INVALID_TARGET_DATE")
        void failWhenTargetDateBeforeToday() {
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(storeRepository.findByIdAndIsClosedFalse(store.getId())).thenReturn(Optional.of(store));

            AuctionRequestDto.Register req = new AuctionRequestDto.Register();
            ReflectionTestUtils.setField(req, "targetDate", LocalDate.now().minusDays(1));
            ReflectionTestUtils.setField(req, "targetStartTime", LocalTime.of(9, 0));
            ReflectionTestUtils.setField(req, "targetEndTime", LocalTime.of(13, 0));
            ReflectionTestUtils.setField(req, "deadline", LocalDateTime.now().plusHours(2));
            ReflectionTestUtils.setField(req, "maxWage", 13000);

            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.registerAuction(owner.getId(), store.getId(), req));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_TARGET_DATE);
        }
    }

    @Nested
    @DisplayName("낙찰/알림 시나리오")
    class CloseAuctionScenario {
        private ShiftAuction auction;
        private AuctionBid bid;
        private StoreEmployee bidder;

        @BeforeEach
        void setUpCloseScenario() {
            auction = ShiftAuction.builder()
                    .store(store)
                    .targetDate(LocalDate.now().plusDays(1))
                    .targetStartTime(LocalTime.of(18, 0))
                    .targetEndTime(LocalTime.of(22, 0))
                    .deadline(LocalDateTime.now().plusHours(2))
                    .minWage(10320)
                    .maxWage(14000)
                    .recruitCount(2)
                    .build();
            ReflectionTestUtils.setField(auction, "id", 100L);
            ReflectionTestUtils.setField(auction, "status", AuctionStatus.IN_PROGRESS);

            bidder = StoreEmployee.builder().store(store).user(employeeUser).build();
            ReflectionTestUtils.setField(bidder, "id", 50L);
            ReflectionTestUtils.setField(bidder, "willWorkingMinutes", 0);

            bid = AuctionBid.builder().shiftAuction(auction).bidder(bidder).bidWage(12500).build();
            ReflectionTestUtils.setField(bid, "id", 501L);
        }

        @Test
        @DisplayName("성공: 부분 낙찰(1명) 시 winners payload 반환 + 출근기록 생성 + 알림 호출")
        void successPartialCloseWithPayloadAndNotification() {
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));
            when(auctionBidRepository.findAllById(any(Iterable.class))).thenReturn(List.of(bid));

            AuctionRequestDto.Close req = new AuctionRequestDto.Close();
            ReflectionTestUtils.setField(req, "selectedBidIds", List.of(501L));

            AuctionResponseDto.CloseResult result = auctionService.closeAuction(auction.getId(), owner.getId(), req);

            assertThat(result.getAuctionId()).isEqualTo(100L);
            assertThat(result.getStatus()).isEqualTo(AuctionStatus.CLOSED);
            assertThat(result.getWinners()).hasSize(1);
            assertThat(result.getWinners().get(0).getBidId()).isEqualTo(501L);
            assertThat(result.getWinners().get(0).getEmployeeId()).isEqualTo(50L);

            verify(auctionWinnerRepository, times(1)).save(any());
            verify(attendanceRepository, times(1)).save(any(Attendance.class));
            verify(notificationService, times(1)).sendNotification(
                    eq(employeeUser), eq(NotificationType.AUCTION), any(), any(), eq(100L));
        }

        @Test
        @DisplayName("성공: 알림 실패가 나도 closeAuction 은 성공(best-effort)")
        void successEvenIfNotificationFails() {
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));
            when(auctionBidRepository.findAllById(any(Iterable.class))).thenReturn(List.of(bid));
            doThrow(new RuntimeException("fcm down"))
                    .when(notificationService).sendNotification(any(), any(), any(), any(), any());

            AuctionRequestDto.Close req = new AuctionRequestDto.Close();
            ReflectionTestUtils.setField(req, "selectedBidIds", List.of(501L));

            AuctionResponseDto.CloseResult result = auctionService.closeAuction(auction.getId(), owner.getId(), req);

            assertThat(result.getStatus()).isEqualTo(AuctionStatus.CLOSED);
            verify(auctionWinnerRepository, times(1)).save(any());
            verify(attendanceRepository, times(1)).save(any(Attendance.class));
        }

        @Test
        @DisplayName("실패: 모집 인원보다 많이 선택하면 INVALID_BID_SELECTION")
        void failWhenSelectedExceedsRecruitCount() {
            ReflectionTestUtils.setField(auction, "recruitCount", 1);
            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));

            AuctionRequestDto.Close req = new AuctionRequestDto.Close();
            ReflectionTestUtils.setField(req, "selectedBidIds", List.of(501L, 502L));

            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.closeAuction(auction.getId(), owner.getId(), req));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_BID_SELECTION);
        }

        @Test
        @DisplayName("실패: 다른 경매의 bid가 섞이면 INVALID_BID_SELECTION")
        void failWhenForeignAuctionBidSelected() {
            ShiftAuction anotherAuction = ShiftAuction.builder().store(store).minWage(10320).maxWage(15000).build();
            ReflectionTestUtils.setField(anotherAuction, "id", 999L);

            AuctionBid foreignBid = AuctionBid.builder().shiftAuction(anotherAuction).bidder(bidder).bidWage(12000).build();
            ReflectionTestUtils.setField(foreignBid, "id", 777L);

            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));
            when(auctionBidRepository.findAllById(any(Iterable.class))).thenReturn(List.of(foreignBid));

            AuctionRequestDto.Close req = new AuctionRequestDto.Close();
            ReflectionTestUtils.setField(req, "selectedBidIds", List.of(777L));

            BusinessException e = assertThrows(BusinessException.class,
                    () -> auctionService.closeAuction(auction.getId(), owner.getId(), req));

            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.INVALID_BID_SELECTION);
        }
    }

    @Nested
    @DisplayName("수정/중단 시나리오")
    class UpdateDeleteScenario {
        @Test
        @DisplayName("성공: updateAuction 은 진행중 경매 정보를 갱신한다")
        void successUpdateAuction() {
            ShiftAuction auction = ShiftAuction.builder()
                    .store(store)
                    .targetDate(LocalDate.now().plusDays(1))
                    .targetStartTime(LocalTime.of(9, 0))
                    .targetEndTime(LocalTime.of(13, 0))
                    .deadline(LocalDateTime.now().plusHours(2))
                    .minWage(10320)
                    .maxWage(13000)
                    .recruitCount(1)
                    .build();
            ReflectionTestUtils.setField(auction, "id", 100L);
            ReflectionTestUtils.setField(auction, "status", AuctionStatus.IN_PROGRESS);

            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));

            AuctionRequestDto.Update req = new AuctionRequestDto.Update();
            ReflectionTestUtils.setField(req, "targetDate", LocalDate.now().plusDays(2));
            ReflectionTestUtils.setField(req, "targetStartTime", LocalTime.of(18, 0));
            ReflectionTestUtils.setField(req, "targetEndTime", LocalTime.of(22, 0));
            ReflectionTestUtils.setField(req, "deadline", LocalDateTime.now().plusHours(6));
            ReflectionTestUtils.setField(req, "minWage", 11000);
            ReflectionTestUtils.setField(req, "maxWage", 15000);
            ReflectionTestUtils.setField(req, "recruitCount", 2);

            auctionService.updateAuction(auction.getId(), owner.getId(), req);

            assertThat(auction.getTargetDate()).isEqualTo(LocalDate.now().plusDays(2));
            assertThat(auction.getTargetStartTime()).isEqualTo(LocalTime.of(18, 0));
            assertThat(auction.getTargetEndTime()).isEqualTo(LocalTime.of(22, 0));
            assertThat(auction.getMinWage()).isEqualTo(11000);
            assertThat(auction.getMaxWage()).isEqualTo(15000);
            assertThat(auction.getRecruitCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("성공: deleteAuction 은 상태를 CANCELLED 로 전이한다")
        void successDeleteAuction() {
            ShiftAuction auction = ShiftAuction.builder()
                    .store(store)
                    .targetDate(LocalDate.now().plusDays(1))
                    .targetStartTime(LocalTime.of(9, 0))
                    .targetEndTime(LocalTime.of(13, 0))
                    .deadline(LocalDateTime.now().plusHours(2))
                    .minWage(10320)
                    .maxWage(13000)
                    .recruitCount(1)
                    .build();
            ReflectionTestUtils.setField(auction, "id", 100L);
            ReflectionTestUtils.setField(auction, "status", AuctionStatus.IN_PROGRESS);

            when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
            when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));

            auctionService.deleteAuction(auction.getId(), owner.getId());

            assertThat(auction.getStatus()).isEqualTo(AuctionStatus.CANCELLED);
        }
    }

    @Test
    @DisplayName("상세 조회: OWNER 이지만 해당 매장 소유주가 아니면 bidders 는 null")
    void ownerNotStoreOwnerSeesNullBidders() {
        ShiftAuction auction = ShiftAuction.builder()
                .store(store)
                .targetDate(LocalDate.now().plusDays(1))
                .targetStartTime(LocalTime.of(9, 0))
                .targetEndTime(LocalTime.of(13, 0))
                .deadline(LocalDateTime.now().plusHours(2))
                .minWage(10320)
                .maxWage(13000)
                .recruitCount(1)
                .build();
        ReflectionTestUtils.setField(auction, "id", 100L);

        when(userRepository.findById(anotherOwner.getId())).thenReturn(Optional.of(anotherOwner));
        when(shiftAuctionRepository.findById(auction.getId())).thenReturn(Optional.of(auction));
        when(auctionWinnerRepository.findAllByShiftAuctionId(auction.getId())).thenReturn(List.of());

        AuctionResponseDto.Detail detail = auctionService.getAuctionDetail(auction.getId(), anotherOwner.getId());

        assertThat(detail.getAuction()).isNotNull();
        assertThat(detail.getBidders()).isNull();
    }
}
