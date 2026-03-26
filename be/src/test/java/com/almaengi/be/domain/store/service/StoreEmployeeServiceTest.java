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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StoreEmployeeServiceTest {

    @InjectMocks
    private StoreEmployeeService storeEmployeeService;

    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatRoomService chatRoomService;

    @Mock
    private RedisUtil redisUtil;

    @Test
    @DisplayName("초대 코드 발급 성공 - 사장님 정상 요청")
    void generateInviteCode_Success() {
        // given
        Long ownerId = 1L;
        Long storeId = 1L;

        User owner = User.builder().build();
        ReflectionTestUtils.setField(owner, "id", ownerId);
        Store store = Store.builder().owner(owner).build();
        ReflectionTestUtils.setField(store, "id", storeId);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));

        // when
        StoreEmployeeResponseDto.InviteCodeInfo response = storeEmployeeService.generateInviteCode(ownerId, storeId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getInviteCode()).isNotNull().hasSize(6);
        // 정책으로 정했던 10800초 (3시간) 파라미터가 정상적으로 RedisUtil에 넘어갔는지 검증
        verify(redisUtil).setDataExpire(any(String.class), eq(String.valueOf(storeId)), eq(10800L),
                eq(TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("초대 코드 발급 실패 - 매장의 사장님이 아님")
    void generateInviteCode_Fail_Unauthorized() {
        // given
        Long userId = 2L; // 사장님(1L)이 아닌 다른 유저
        Long ownerId = 1L;
        Long storeId = 1L;

        User owner = User.builder().build();
        ReflectionTestUtils.setField(owner, "id", ownerId);
        Store store = Store.builder().owner(owner).build();
        ReflectionTestUtils.setField(store, "id", storeId);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));

        // when & then
        assertThatThrownBy(() -> storeEmployeeService.generateInviteCode(userId, storeId))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.UNAUTHORIZED_USER.getMessage());
    }

    @Test
    @DisplayName("직원 매장 합류 성공 - 정상적인 1회용 코드 사용")
    void joinStore_Success() {
        // given
        Long employeeId = 2L;
        Long storeId = 1L;
        String inviteCode = "A1B2C3";
        String redisKey = "STORE_INVITE:" + inviteCode;

        User user = User.builder().name("김알바").build();
        ReflectionTestUtils.setField(user, "id", employeeId);
        User owner = User.builder().build();
        ReflectionTestUtils.setField(owner, "id", 1L);
        Store store = Store.builder().owner(owner).build();
        ReflectionTestUtils.setField(store, "id", storeId);

        StoreEmployeeRequestDto.Join request = new StoreEmployeeRequestDto.Join();
        ReflectionTestUtils.setField(request, "inviteCode", inviteCode);

        given(userRepository.findById(employeeId)).willReturn(Optional.of(user));
        // Redis에서 매장 ID가 정상적으로 꺼내졌고 파기되었다고 가정 (1회용 정책)
        given(redisUtil.getAndDelete(redisKey)).willReturn(String.valueOf(storeId));
        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.existsByStoreIdAndUserId(storeId, employeeId)).willReturn(false); // 가입 이력 없음

        StoreEmployee savedEmployee = StoreEmployee.builder().store(store).user(user).hireDate(LocalDate.now()).build();
        ReflectionTestUtils.setField(savedEmployee, "id", 100L); // DB 저장 후 채번된 ID라고 가정
        given(storeEmployeeRepository.save(any(StoreEmployee.class))).willReturn(savedEmployee);

        // when
        StoreEmployeeResponseDto.EmployeeInfo response = storeEmployeeService.joinStore(employeeId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getEmployeeId()).isEqualTo(100L);
        assertThat(response.getUserId()).isEqualTo(employeeId);
        verify(chatRoomService).ensurePersonalBotRoomWithWelcome(employeeId, storeId);
    }

    @Test
    @DisplayName("직원 매장 합류 실패 - 잘못되거나 만료된 초대 코드 (null 반환 시)")
    void joinStore_Fail_InvalidInviteCode() {
        // given
        Long employeeId = 2L;
        String inviteCode = "XXXXXX";
        String redisKey = "STORE_INVITE:" + inviteCode;

        User user = User.builder().build();
        ReflectionTestUtils.setField(user, "id", employeeId);
        StoreEmployeeRequestDto.Join request = new StoreEmployeeRequestDto.Join();
        ReflectionTestUtils.setField(request, "inviteCode", inviteCode);

        given(userRepository.findById(employeeId)).willReturn(Optional.of(user));
        // Redis에서 코드를 찾을 수 없거나 이미 파기됨 (null 반환)
        given(redisUtil.getAndDelete(redisKey)).willReturn(null);

        // when & then
        assertThatThrownBy(() -> storeEmployeeService.joinStore(employeeId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.INVALID_INVITE_CODE.getMessage());
    }

    @Test
    @DisplayName("직원 목록 조회 성공 - 사장님 요청 시 사장 제외, 직원 전체 반환")
    void getStoreEmployees_Success_ByOwner() {
        // given
        Long ownerId = 1L;
        Long storeId = 10L;

        User owner = User.builder().name("사장님").build();
        ReflectionTestUtils.setField(owner, "id", ownerId);

        User employeeUser1 = User.builder().name("직원1").build();
        ReflectionTestUtils.setField(employeeUser1, "id", 101L);
        User employeeUser2 = User.builder().name("직원2").build();
        ReflectionTestUtils.setField(employeeUser2, "id", 102L);

        Store store = Store.builder().owner(owner).build();
        ReflectionTestUtils.setField(store, "id", storeId);

        StoreEmployee employee1 = createWorkingEmployee(1001L, store, employeeUser1);
        StoreEmployee employee2 = createWorkingEmployee(1002L, store, employeeUser2);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.findByStoreId(storeId)).willReturn(List.of(employee1, employee2));

        // when
        List<StoreEmployeeResponseDto.EmployeeInfo> result = storeEmployeeService.getStoreEmployees(ownerId, storeId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result).extracting(StoreEmployeeResponseDto.EmployeeInfo::getUserId)
                .containsExactlyInAnyOrder(101L, 102L);
        // 사장 본인은 제외되어야 함
        assertThat(result).noneMatch(info -> info.getUserId().equals(ownerId));
    }

    @Test
    @DisplayName("직원 목록 조회 성공 - 직원 요청 시 사장 포함 + 본인 제외")
    void getStoreEmployees_Success_ByEmployee() {
        // given
        Long ownerId = 1L;
        Long requesterEmployeeId = 101L;
        Long anotherEmployeeId = 102L;
        Long storeId = 10L;

        User owner = User.builder().name("사장님").build();
        ReflectionTestUtils.setField(owner, "id", ownerId);

        User requesterEmployeeUser = User.builder().name("요청직원").build();
        ReflectionTestUtils.setField(requesterEmployeeUser, "id", requesterEmployeeId);
        User anotherEmployeeUser = User.builder().name("다른직원").build();
        ReflectionTestUtils.setField(anotherEmployeeUser, "id", anotherEmployeeId);

        Store store = Store.builder().owner(owner).build();
        ReflectionTestUtils.setField(store, "id", storeId);

        StoreEmployee requesterEmployee = createWorkingEmployee(1001L, store, requesterEmployeeUser);
        StoreEmployee anotherEmployee = createWorkingEmployee(1002L, store, anotherEmployeeUser);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.existsByStoreIdAndUserId(storeId, requesterEmployeeId)).willReturn(true);
        given(storeEmployeeRepository.findByStoreId(storeId)).willReturn(List.of(requesterEmployee, anotherEmployee));

        // when
        List<StoreEmployeeResponseDto.EmployeeInfo> result = storeEmployeeService.getStoreEmployees(requesterEmployeeId, storeId);

        // then
        // 사장 + 다른 직원(요청자 본인은 제외)
        assertThat(result).hasSize(2);
        assertThat(result).extracting(StoreEmployeeResponseDto.EmployeeInfo::getUserId)
                .containsExactlyInAnyOrder(ownerId, anotherEmployeeId);
        assertThat(result).noneMatch(info -> info.getUserId().equals(requesterEmployeeId));

        // 사장님 항목은 owner 매핑 규칙(employeeId null, position "사장님")을 따라야 함
        StoreEmployeeResponseDto.EmployeeInfo ownerInfo = result.stream()
                .filter(info -> info.getUserId().equals(ownerId))
                .findFirst()
                .orElseThrow();
        assertThat(ownerInfo.getEmployeeId()).isNull();
        assertThat(ownerInfo.getPosition()).isEqualTo("사장님");
    }

    @Test
    @DisplayName("직원 목록 조회 실패 - 매장과 무관한 사용자는 UNAUTHORIZED_USER")
    void getStoreEmployees_Fail_Unauthorized() {
        // given
        Long ownerId = 1L;
        Long strangerUserId = 999L;
        Long storeId = 10L;

        User owner = User.builder().name("사장님").build();
        ReflectionTestUtils.setField(owner, "id", ownerId);

        Store store = Store.builder().owner(owner).build();
        ReflectionTestUtils.setField(store, "id", storeId);

        given(storeRepository.findByIdAndIsClosedFalse(storeId)).willReturn(Optional.of(store));
        given(storeEmployeeRepository.existsByStoreIdAndUserId(storeId, strangerUserId)).willReturn(false);

        // when & then
        assertThatThrownBy(() -> storeEmployeeService.getStoreEmployees(strangerUserId, storeId))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.UNAUTHORIZED_USER.getMessage());
    }

    private StoreEmployee createWorkingEmployee(Long employeeId, Store store, User user) {
        StoreEmployee employee = StoreEmployee.builder()
                .store(store)
                .user(user)
                .status(StoreEmployeeStatus.WORKING)
                .position("직원")
                .hourlyWage(10000)
                .taxType(TaxType.NONE)
                .workedMinutes(0)
                .willWorkingMinutes(0)
                .hireDate(LocalDate.now())
                .dependentsCount(0)
                .includeHolidayPay(false)
                .build();
        ReflectionTestUtils.setField(employee, "id", employeeId);
        return employee;
    }
}
