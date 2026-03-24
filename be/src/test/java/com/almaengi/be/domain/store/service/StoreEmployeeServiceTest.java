package com.almaengi.be.domain.store.service;

import com.almaengi.be.domain.chat.service.ChatRoomService;
import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
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
}
