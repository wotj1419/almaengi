package com.almaengi.be.domain.auction.service;

import com.almaengi.be.domain.attendance.entity.Attendance;
import com.almaengi.be.domain.attendance.repository.AttendanceRepository;
import com.almaengi.be.domain.attendance.type.AttendanceStatus;
import com.almaengi.be.domain.auction.dto.AuctionResponseDto;
import com.almaengi.be.domain.auction.dto.AuctionRequestDto;
import com.almaengi.be.domain.auction.entity.AuctionBid;
import com.almaengi.be.domain.auction.entity.AuctionWinner;
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
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

/**
 * 대타 스케줄 경매의 핵심 비즈니스 로직을 담당하는 서비스입니다.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class AuctionService {

    private final ShiftAuctionRepository shiftAuctionRepository;
    private final AuctionBidRepository auctionBidRepository;
    private final AttendanceRepository attendanceRepository;
    private final AuctionWinnerRepository auctionWinnerRepository;
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    private final NotificationService notificationService;

    // 법정 최저시급
    @Value("${app.auction.legal-minimum-wage}")
    private int legalMinimumWage;

    /**
     * [Phase 3-1: 경매 생성]
     * 사장님이 새로운 구인 공고(경매)를 등록합니다.
     */
    @Transactional
    public Long registerAuction(Long ownerId, Long storeId, AuctionRequestDto.Register request) {

        // 1. 임시 계정 확인 및 권한 체크 (추후 Security Auth 객체로 대체)
        User owner = getUserOrThrow(ownerId);
        if (owner.getRole() != Role.OWNER) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);
        }
        Store store = getStoreOrThrow(storeId);

        validateAuctionDateConstraints(request.getTargetDate(), request.getDeadline());

        // 1. 하한가(minWage) 처리: 미입력 시 법정 최저시급 적용, 입력 시 법정 최저시급 이상인지 검증
        int minWage = (request.getMinWage() != null) ? request.getMinWage() : legalMinimumWage;
        if (minWage < legalMinimumWage) {
            throw new BusinessException(ErrorCode.INVALID_MIN_WAGE); // 하한가는 법정 최저시급보다 낮을 수 없음
        }

        // 2. 상한가(maxWage) 처리: 필수 입력, 하한가보다 크거나 같아야 함
        int maxWage = request.getMaxWage();
        if (maxWage < minWage) {
            throw new BusinessException(ErrorCode.INVALID_MAX_WAGE);
        }

        // 4. 모집 인원(recruitCount): 없으면 기본값 1
        int recruitCount = (request.getRecruitCount() != null && request.getRecruitCount() > 0)
                ? request.getRecruitCount()
                : 1;

        ShiftAuction auction = ShiftAuction.builder()
                .store(store)
                .targetDate(request.getTargetDate())
                .targetStartTime(request.getTargetStartTime())
                .targetEndTime(request.getTargetEndTime())
                .deadline(request.getDeadline())
                .minWage(minWage)
                .maxWage(maxWage)
                .recruitCount(recruitCount)
                .build();

        return shiftAuctionRepository.save(auction).getId();
    }

    /**
     * [Phase 3-2: 경매 지원(입찰/수정)]
     * 알바생이 경매에 희망 시급을 적어 지원합니다. (수정 가능)
     * 역경매 제약 없음: 상/하한가 범위 내이면 자유롭게 제출 가능.
     */
    @Transactional
    public void bidAuction(Long auctionId, Long employeeId, AuctionRequestDto.Bid request) {

        // 1. 임시 계정 확인 및 권한 체크 (추후 Security Auth 객체로 대체)
        User employee = getUserOrThrow(employeeId);
        if (employee.getRole() != Role.EMPLOYEE) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);
        }

        // 1. 해당 알바생(User)이 해당 공고(Store)의 직원인지 검증 및 객체 조회
        ShiftAuction auction = getShiftAuctionOrThrow(auctionId);
        StoreEmployee bidder = storeEmployeeRepository.findByStoreIdAndUserId(auction.getStore().getId(), employee.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        // 승인된 직원들만 입찰 가능
        if(bidder.getStatus() == StoreEmployeeStatus.WAITING || bidder.getStatus() == StoreEmployeeStatus.INVITED)
            throw new BusinessException(ErrorCode.INVALID_EMPLOYEE_STATUS);

        if (auction.getStatus() != AuctionStatus.IN_PROGRESS) {
            // 이미 마감되었거나 취소된 경우
            throw new BusinessException(ErrorCode.AUCTION_NOT_IN_PROGRESS);
        }

        Integer newBidWage = request.getBidWage();

        // 2. 사장님이 설정한 범위(하한가 ~ 상한가) 내인지 검증
        if (newBidWage < auction.getMinWage() || newBidWage > auction.getMaxWage()) {
            throw new BusinessException(ErrorCode.INVALID_BID_WAGE);
        }

        // 3. 내가 이미 지원한 내역이 있는지 확인 (Update vs Insert)
        auctionBidRepository.findByShiftAuctionIdAndBidderId(auctionId, bidder.getId())
                .ifPresentOrElse(
                        existingBid -> {
                            // 이미 지원했다면, 새로운 희망 시급으로 업데이트
                            existingBid.updateBidWage(newBidWage);
                            // 참고: JPA 더티 체킹에 의해 트랜잭션 종료 시 자동 반영됨
                            log.info("지원금액 수정 성공 - AuctionID: {}, BidderID: {}, Wage: {}", auctionId, bidder.getId(),
                                    newBidWage);
                        },
                        () -> {
                            // 첫 지원이라면 새로 등록
                            AuctionBid newBid = AuctionBid.builder()
                                    .shiftAuction(auction)
                                    .bidder(bidder)
                                    .bidWage(newBidWage)
                                    .build();
                            auctionBidRepository.save(newBid);
                            log.info("첫 지원 성공 - AuctionID: {}, BidderID: {}, Wage: {}", auctionId, bidder.getId(),
                                    newBidWage);
                        });
    }

    /**
     * [Phase 3-4: 낙찰 확정 및 경매 마감]
     * 사장님이 해당 경매를 통하여 특정 지원자(들)를 선택했을 때의 동작.
     */
    @Transactional
    public AuctionResponseDto.CloseResult closeAuction(Long auctionId, Long ownerId, AuctionRequestDto.Close request) {
        // 1. 임시 계정 확인 및 권한 체크 (추후 Security Auth 객체로 대체)
        User owner = getUserOrThrow(ownerId);
        if (owner.getRole() != Role.OWNER) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);
        }

        ShiftAuction auction = getShiftAuctionOrThrow(auctionId);
        if (auction.getStatus() != AuctionStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.AUCTION_NOT_IN_PROGRESS);
        }

        List<Long> selectedBidIds = request.getSelectedBidIds();
        if (selectedBidIds == null || selectedBidIds.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_SELECTED_BIDDER); // 선택된 지원자가 없으면 에러
        }

        Set<Long> uniqueBidIds = new LinkedHashSet<>(selectedBidIds);
        if(uniqueBidIds.size() != selectedBidIds.size()
        || uniqueBidIds.size() > auction.getRecruitCount())
            throw new BusinessException(ErrorCode.INVALID_BID_SELECTION);

        List<AuctionBid> winningBids = auctionBidRepository.findAllById(uniqueBidIds);
        if(winningBids.size() != uniqueBidIds.size())
            throw new BusinessException(ErrorCode.INVALID_BID_SELECTION);

        boolean hasForeignBid = winningBids.stream()
                .anyMatch(bid -> !bid.getShiftAuction().getId().equals(auctionId));
        if(hasForeignBid)
            throw new BusinessException(ErrorCode.INVALID_BID_SELECTION);

        // 해당 경매의 근무 시간(분) 계산
        int auctionMinutes = calculateAuctionMinutes(auction.getTargetStartTime(), auction.getTargetEndTime());

        // 다수 낙찰자 데이터 저장, 예정 출근 기록 생성 및 예정 시간 업데이트
        for (AuctionBid bid : winningBids) {
            StoreEmployee winnerEmployee = bid.getBidder();

            // 1. 낙찰 매핑 데이터 저장
            AuctionWinner winner = AuctionWinner.builder()
                    .shiftAuction(auction)
                    .storeEmployee(winnerEmployee)
                    .build();
            auctionWinnerRepository.save(winner);

            // 2. 확정된 알바생의 '예정 출근 기록' 생성 (Attendances)
            Attendance newAttendance = Attendance.builder()
                    .employee(winnerEmployee)
                    .targetDate(auction.getTargetDate())
                    .scheduledStartTime(auction.getTargetStartTime())
                    .scheduledEndTime(auction.getTargetEndTime())
                    .status(AttendanceStatus.WAITING) // 기본값은 "WAITING"
                    .build();
            attendanceRepository.save(newAttendance);

            // 3. 낙찰자의 예정 근무 시간 증가
            winnerEmployee.addWillWorkingMinutes(auctionMinutes);
        }

        // 상태를 'CLOSED'로 변경
        auction.closeAuction();

        Map<Long, AuctionBid> bidMap = winningBids.stream()
                        .collect(Collectors.toMap(AuctionBid::getId, b->b));

        List<AuctionResponseDto.ClosedWinner> winners = uniqueBidIds.stream()
                        .map(bidId -> {
                            AuctionBid bid = bidMap.get(bidId);
                            return AuctionResponseDto.ClosedWinner.builder()
                                    .bidId(bid.getId())
                                    .employeeId(bid.getBidder().getId())
                                    .employeeName(bid.getBidder().getUser().getName())
                                    .bidWage(bid.getBidWage())
                                    .build();
                        }).toList();

        notifyAuctionWinners(auction, winningBids); // 푸시 알림 + 알림함 저장
        log.info("경매 마감 - AuctionID: {}, 선택된 인원 수: {}", auctionId, winningBids.size());

        return AuctionResponseDto.CloseResult.builder()
                .auctionId(auctionId)
                .status(auction.getStatus())
                .winners(winners)
                .build();
    }

    /**
     * [Phase 3-5: 경매 추가 로직 구현 (목록/상세 조회)]
     * 사장님 자신의 매장에 등록된 경매(대타 구인) 전체 목록을 조회합니다.
     */
    public List<AuctionResponseDto.Auction> getAuctions(Long storeId) {
        // 매장에 등록된 모든 공고 조회
        List<ShiftAuction> auctions = shiftAuctionRepository.findAllByStoreId(storeId);

        List<AuctionResponseDto.Auction> response = new ArrayList<>();
        for (ShiftAuction auction : auctions) {
            // 각 공고에 대한 낙찰자(Winner) ID 목록 조회
            List<Long> winnerIds = auctionWinnerRepository.findAllByShiftAuctionId(auction.getId()).stream()
                    .map(winner -> winner.getStoreEmployee().getId())
                    .toList();

            response.add(AuctionResponseDto.Auction.from(auction, winnerIds));
        }

        return response;
    }

    /**
     * [Phase 3-5: 경매 추가 로직 구현 (목록/상세 조회)]
     * 특정 경매(구인 공고)의 상세 정보를 조회합니다.
     * 사장님(OWNER)인 경우 지원자 목록(Bidders)까지 추가로 조회하여 반환하고,
     * 알바생(employee)인 경우 공고 기본 정보만 반환합니다.
     */
    public AuctionResponseDto.Detail getAuctionDetail(Long auctionId, Long userId) {
        // 1. 임시 계정 확인 및 역할 분기
        User user = getUserOrThrow(userId);
        Role role = user.getRole();

        ShiftAuction auction = getShiftAuctionOrThrow(auctionId);

        // 해당 공고의 낙찰자(Winner) ID 목록 조회
        List<Long> winnerIds = auctionWinnerRepository.findAllByShiftAuctionId(auctionId).stream()
                .map(winner -> winner.getStoreEmployee().getId())
                .toList();

        AuctionResponseDto.Auction auctionInfo = AuctionResponseDto.Auction.from(auction, winnerIds);
        AuctionResponseDto.Bidders biddersInfo = null;

        // 권한 분기: 사장님(OWNER)일 때만 지원자 목록도 조회하여 담기
        if (role == Role.OWNER && auction.getStore().getOwner().getId().equals(userId)) {
            biddersInfo = getAuctionBidders(auctionId);
        }

        return AuctionResponseDto.Detail.builder()
                .auction(auctionInfo)
                .bidders(biddersInfo)
                .build();
    }

    @Transactional
    public void updateAuction(Long auctionId, Long ownerId, AuctionRequestDto.Update request) {
        User owner = getUserOrThrow(ownerId);
        if(owner.getRole() != Role.OWNER)
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);

        ShiftAuction auction = getShiftAuctionOrThrow(auctionId);
        if(auction.getStatus() != AuctionStatus.IN_PROGRESS)
            throw new BusinessException(ErrorCode.AUCTION_NOT_IN_PROGRESS);

        validateAuctionDateConstraints(request.getTargetDate(), request.getDeadline());

        int minWage = (request.getMinWage() != null) ? request.getMinWage() : legalMinimumWage;
        if(minWage < legalMinimumWage)
            throw new BusinessException(ErrorCode.INVALID_MIN_WAGE);
        int maxWage = request.getMaxWage();
        if(maxWage < minWage) throw new BusinessException(ErrorCode.INVALID_MAX_WAGE);

        int recruitCount = (request.getRecruitCount() != null && request.getRecruitCount() > 0)
                        ? request.getRecruitCount() : 1;

        auction.updateAuctionInfo(
                request.getTargetDate(),
                request.getTargetStartTime(),
                request.getTargetEndTime(),
                request.getDeadline(),
                minWage, maxWage, recruitCount
        );
    }

    @Transactional
    public void deleteAuction(Long auctionId, Long ownerId) {
        User owner = getUserOrThrow(ownerId);
        if(owner.getRole() != Role.OWNER)
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);

        ShiftAuction auction = getShiftAuctionOrThrow(auctionId);
        if(auction.getStatus() != AuctionStatus.IN_PROGRESS)
            throw new BusinessException(ErrorCode.AUCTION_NOT_IN_PROGRESS);

        auction.cancelAuction();
    }

    public AuctionResponseDto.InsightsReport getInsightsReport(Long userId, Long storeId, AuctionRequestDto.AuctionInsightsQuery request) {
        User user = getUserOrThrow(userId);
        if(user.getRole() != Role.OWNER) throw new BusinessException(ErrorCode.UNAUTHORIZED_ROLE);

        Store store = getStoreOrThrow(storeId);
        if(!store.getOwner().getId().equals(userId))
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);

        YearMonth targetYm;
        try {
            targetYm = YearMonth.parse(request.getYearMonth());
        }  catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }

        // 이번 달 / 미래 달은 조회 불가
        if(!targetYm.isBefore(YearMonth.now()))
            throw new BusinessException(ErrorCode.INVALID_REPORT_MONTH);

        LocalDateTime monthStart = targetYm.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = targetYm.atEndOfMonth().atTime(23, 59, 59);

        long totalAuctionCount = shiftAuctionRepository.countByStoreIdAndCreatedAtBetween(storeId, monthStart, monthEnd);
        long closedAuctionCount = shiftAuctionRepository.countByStoreIdAndStatusAndCreatedAtBetween(storeId, AuctionStatus.CLOSED, monthStart, monthEnd);

        BigDecimal successRate = BigDecimal.ZERO;
        if(totalAuctionCount > 0) {
            successRate = BigDecimal.valueOf(closedAuctionCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalAuctionCount), 1, RoundingMode.HALF_UP);
        }

        Double avgWageRaw = auctionWinnerRepository.findAverageWinningWage(storeId, monthStart, monthEnd);
        int averageWinningWage = (avgWageRaw == null) ? 0 : (int) Math.round(avgWageRaw);

        Pageable pageable = PageRequest.of(Math.max(request.normalizedPage(), 0), Math.max(request.normalizedSize(), 1));
        Page<ShiftAuctionRepository.TimelineProjection> timelinePageRaw = shiftAuctionRepository.findTimelineReport(storeId, monthStart, monthEnd, pageable);

        List<AuctionResponseDto.TimelineItem> content = timelinePageRaw.getContent().stream()
                .map(row -> AuctionResponseDto.TimelineItem.builder()
                        .dayOfWeek(toDayOfWeekLabel(row.getDayOfWeekValue()))
                        .startTime(row.getStartTime())
                        .endTime(row.getEndTime())
                        .auctionCount(row.getAuctionCount())
                        .build())
                .toList();

        AuctionResponseDto.TimelinePage timelinePage = AuctionResponseDto.TimelinePage.builder()
                .content(content)
                .page(timelinePageRaw.getNumber())
                .size(timelinePageRaw.getSize())
                .totalElements(timelinePageRaw.getTotalElements())
                .totalPages(timelinePageRaw.getTotalPages())
                .hasNext(timelinePageRaw.hasNext())
                .build();

        return AuctionResponseDto.InsightsReport.builder()
                .yearMonth(targetYm.toString())
                .totalAuctionCount(totalAuctionCount)
                .closedAuctionCount(closedAuctionCount)
                .successRate(successRate)
                .averageWinningWage(averageWinningWage)
                .timelinePage(timelinePage)
                .build();
    }


    private Store getStoreOrThrow(Long storeId) {
        return storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
    }
    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
    private ShiftAuction getShiftAuctionOrThrow(Long auctionId) {
        return shiftAuctionRepository.findById(auctionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUCTION_NOT_FOUND));
    }
    private void validateAuctionDateConstraints(LocalDate targetDate, LocalDateTime deadline) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        if (targetDate == null || targetDate.isBefore(today)) {
            throw new BusinessException(ErrorCode.INVALID_TARGET_DATE);
        }
        if(deadline == null || !deadline.isAfter(now)) {
            throw new BusinessException(ErrorCode.INVALID_DEADLINE);
        }
    }

    /**
     * [Phase 3-3: 지원자 목록 조회]
     * 사장님이 특정 경매(구인 공고)에 지원한 알바생 목록을 조회합니다.
     * 주휴수당 발생 여부에 따라 3가지 그룹으로 분류하여 반환합니다.
     */
    private AuctionResponseDto.Bidders getAuctionBidders(Long auctionId) {
        // 1. 공고 확인
        ShiftAuction auction = getShiftAuctionOrThrow(auctionId);

        // 2. 공고 시간(분 단위) 계산
        int auctionMinutes = calculateAuctionMinutes(auction.getTargetStartTime(), auction.getTargetEndTime());

        // 3. 해당 공고에 입찰한 모든 지원 내역 조회
        List<AuctionBid> bids = auctionBidRepository.findAllByShiftAuctionId(auctionId);

        List<AuctionResponseDto.BidderInfo> group1 = new ArrayList<>();
        List<AuctionResponseDto.BidderInfo> group2 = new ArrayList<>();
        List<AuctionResponseDto.BidderInfo> group3 = new ArrayList<>();

        final int HOLIDAY_PAY_MINUTES = 15 * 60; // 주 15시간 = 900분

        for (AuctionBid bid : bids) {
            StoreEmployee employee = bid.getBidder();
            User user = employee.getUser();

            int baseMinutes = (employee.getWillWorkingMinutes() != null) ? employee.getWillWorkingMinutes() : 0;
            int totalMinutesIfSelected = baseMinutes + auctionMinutes;

            // 태그 생성 로직
            List<String> tags = generateEmployeeTags(employee);

            AuctionResponseDto.BidderInfo info = AuctionResponseDto.BidderInfo.builder()
                    .bidId(bid.getId())
                    .employeeId(employee.getId())
                    .applicantName(user.getName())
                    .proposedWage(bid.getBidWage())
                    .tags(tags)
                    .bidTime(bid.getBidTime())
                    .build();

            // 주휴수당 판별 (기존 근무시간 + 이번 대타 시간)
            if (baseMinutes >= HOLIDAY_PAY_MINUTES) {
                // 이미 주휴수당 대상 (새로 추가 발생 X)
                group1.add(info);
            } else if (totalMinutesIfSelected >= HOLIDAY_PAY_MINUTES) {
                // 낙찰되면 주휴수당 커트라인(15시간)을 넘기는 대상
                group2.add(info);
            } else {
                // 대타 뛰어도 15시간 미만 (주휴수당 무관)
                group3.add(info);
            }
        }

        return AuctionResponseDto.Bidders.builder()
                .group1(group1)
                .group2(group2)
                .group3(group3)
                .build();
    }

    private int calculateAuctionMinutes(LocalTime start, LocalTime end) {
        try {
            int minutes = (int) Duration.between(start, end).toMinutes();
            if (minutes < 0) {
                minutes += 24 * 60; // 야간~익일 케이스
            }
            return minutes;
        } catch (Exception e) {
            log.error("시간 범위 파싱 실패: start={}, end={}", start, end, e);
            throw new BusinessException(ErrorCode.INVALID_TIME_FORMAT);
        }
    }

    private List<String> generateEmployeeTags(StoreEmployee employee) {
        List<String> tags = new ArrayList<>();

        // 1. 근속 기간
        if (employee.getHireDate() != null) {
            long months = ChronoUnit.MONTHS.between(employee.getHireDate(), LocalDate.now());
            if (months >= 12) {
                tags.add("근속 " + (months / 12) + "년");
            } else if (months > 0) {
                tags.add("근속 " + months + "개월");
            }
        }

        // 2. 근태/지각 횟수 (AttendanceRepository 조회)
        int lateCount = attendanceRepository.countByEmployeeIdAndStatus(employee.getId(), AttendanceStatus.LATE);
        int absentCount = attendanceRepository.countByEmployeeIdAndStatus(employee.getId(), AttendanceStatus.ABSENT);

        if (lateCount == 0 && absentCount == 0) {
            tags.add("결근/지각 0회");
        } else {
            if (lateCount > 0)
                tags.add("지각 " + lateCount + "회");
            if (absentCount > 0)
                tags.add("결근 " + absentCount + "회");
        }

        // 3. 직급/상태 태그 (우수 알바 등)
        if (employee.getStatus() == StoreEmployeeStatus.BEST) {
            tags.add("우수");
        }

        return tags;
    }

    private void notifyAuctionWinners(ShiftAuction auction, List<AuctionBid> winningBids) {
        String title = "경매 낙찰 안내";
        String timeRange = formatTimeRange(auction.getTargetStartTime(), auction.getTargetEndTime());

        for(AuctionBid bid : winningBids) {
           User receiver = bid.getBidder().getUser();

           String body = String.format(
                   "%s 근무(%s)가 시급 %,d원으로 낙찰 확정 되었습니다.",
                   auction.getTargetDate(),
                   timeRange,
                   bid.getBidWage()
           );
           try {
               notificationService.sendNotification(receiver, NotificationType.AUCTION, title, body, auction.getId());
           } catch(Exception e) {
               log.warn("낙찰 알림 발송 실패 - auctionId: {}, bidId: {}, receiverId: {}, reason: {}",
                       auction.getId(), bid.getId(), bid.getBidder().getUser().getId(), e.getMessage(), e);
           }
        }
    }
    private String formatTimeRange(LocalTime start, LocalTime end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        return start.format(formatter) + " - " + end.format(formatter);
    }

    private String toDayOfWeekLabel(Integer dayOfWeekValue) {
        if (dayOfWeekValue == null) return "UNKNOWN";
        return switch (dayOfWeekValue) {
            case 0 -> "SUN";
            case 1 -> "MON";
            case 2 -> "TUE";
            case 3 -> "WED";
            case 4 -> "THU";
            case 5 -> "FRI";
            case 6 -> "SAT";
            default -> "UNKNOWN";
        };
    }
}
