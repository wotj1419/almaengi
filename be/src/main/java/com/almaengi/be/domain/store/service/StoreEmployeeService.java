package com.almaengi.be.domain.store.service;

import com.almaengi.be.domain.chat.service.ChatRoomService;
import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.util.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreEmployeeService {
    private final StoreEmployeeRepository storeEmployeeRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    private final ChatRoomService chatRoomService;

    private final RedisUtil redisUtil;

    private static final long INVITE_CODE_EXPIRATION = 3 * 60 * 60;
    private static final String REDIS_INVITE_PREFIX = "STORE_INVITE:";

    // 특정 매장에 대한 구인 코드 생성
    public StoreEmployeeResponseDto.InviteCodeInfo generateInviteCode(Long userId, Long storeId) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
        if(!store.getOwner().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);
        }

        // 6자리 난수 생성
        String inviteCode = createRandomCode();
        // 만료시간: 발급일로부터 3시간
        LocalDateTime expiredDate = LocalDateTime.now().plusSeconds(INVITE_CODE_EXPIRATION);
        String expiredAt = expiredDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));

        String redisKey = REDIS_INVITE_PREFIX + inviteCode;
        redisUtil.setDataExpire(redisKey, String.valueOf(storeId), INVITE_CODE_EXPIRATION, TimeUnit.SECONDS);

        return StoreEmployeeResponseDto.InviteCodeInfo.builder()
                .inviteCode(inviteCode)
                .expiredAt(expiredAt)
                .build();
    }

    // 코드 입력하여 매장에 등록(직원)
    @Transactional
    public StoreEmployeeResponseDto.EmployeeInfo joinStore(Long userId, StoreEmployeeRequestDto.Join request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String inviteCode = request.getInviteCode().toUpperCase();
        String redisKey = REDIS_INVITE_PREFIX + inviteCode;

        String storeIdStr = redisUtil.getAndDelete(redisKey);
        if(storeIdStr == null || storeIdStr.isEmpty())
            throw new BusinessException(ErrorCode.INVALID_INVITE_CODE);

        Long storeId = Long.valueOf(storeIdStr);

        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(storeEmployeeRepository.existsByStoreIdAndUserId(store.getId(), user.getId()))
            throw new BusinessException(ErrorCode.ALREADY_STORE_EMPLOYEE);

        StoreEmployee newEmployee = StoreEmployee.builder()
                .store(store)
                .user(user)
                .hireDate(LocalDate.now())
                .status(StoreEmployeeStatus.WORKING)
                .hourlyWage(0)
                .taxType(TaxType.NONE)
                .workedMinutes(0)
                .willWorkingMinutes(0)
                .dependentsCount(0)
                .includeHolidayPay(false)
                .build();
        StoreEmployee savedEmployee = storeEmployeeRepository.save(newEmployee);

        // 매장 합류 시, Chat-BOT 최초 인사
        try {
            chatRoomService.ensurePersonalBotRoomWithWelcome(userId, storeId);
        } catch(Exception e) {
            // 매장 합류 자체를 깨지 않도록 best-effort
            log.warn("[CHAT-BOT] auto bot room init failed on createStore. storeId={}, userId={}, reason={}", storeId, userId, e.getMessage());
        }

        return StoreEmployeeResponseDto.EmployeeInfo.from(savedEmployee);
    }

    private String createRandomCode() {
        int leftLimit = '0';
        int rightLimit = 'Z';
        int targetStringLength = 6;
        Random random = new Random();

        return random.ints(leftLimit, rightLimit+1)
                .filter(i -> (i <= '9' || i >= 'A'))
                .limit(targetStringLength)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    // 매장에 소속된 전체 직원 목록 조회
    public List<StoreEmployeeResponseDto.EmployeeInfo> getStoreEmployees(Long userId, Long storeId) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(!store.getOwner().getId().equals(userId) && !storeEmployeeRepository.existsByStoreIdAndUserId(storeId, userId))
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);

        List<StoreEmployeeResponseDto.EmployeeInfo> result = new ArrayList<>();
        if(!store.getOwner().getId().equals(userId))
            result.add(StoreEmployeeResponseDto.EmployeeInfo.fromOwner(store.getOwner()));

        List<StoreEmployeeResponseDto.EmployeeInfo> employeeInfos = storeEmployeeRepository.findByStoreId(storeId).stream()
                .filter(employee -> !employee.getUser().getId().equals(userId))
                .map(StoreEmployeeResponseDto.EmployeeInfo::from)
                .toList();

        result.addAll(employeeInfos);
        return result;
    }

    // 직원 기초 정보 변경
    @Transactional
    public StoreEmployeeResponseDto.EmployeeInfo updateEmployeeInfo(Long userId, Long storeId, Long employeeId, StoreEmployeeRequestDto.Update request) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(!store.getOwner().getId().equals(userId))
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);

        StoreEmployee storeEmployee = storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        storeEmployee.updateEmployeeInfo(
                request.getPosition(),
                request.getHourlyWage(),
                request.getTaxType(),
                request.getIncludeHolidayPay()
        );

        return StoreEmployeeResponseDto.EmployeeInfo.from(storeEmployee);
    }

    // 특정 직원 퇴사
    @Transactional
    public void removeEmployee(Long userId, Long storeId, Long employeeId) {
        Store store = storeRepository.findByIdAndIsClosedFalse(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));

        if(!store.getOwner().getId().equals(userId))
            throw new BusinessException(ErrorCode.UNAUTHORIZED_USER);

        StoreEmployee storeEmployee = storeEmployeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_EMPLOYEE_NOT_FOUND));

        storeEmployee.changeStatus(StoreEmployeeStatus.RESIGNED);
    }
}
