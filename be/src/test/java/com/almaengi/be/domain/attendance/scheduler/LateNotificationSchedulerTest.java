package com.almaengi.be.domain.attendance.scheduler;

import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.notification.service.NotificationService;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;

@ExtendWith(MockitoExtension.class)
@DisplayName("LateNotificationScheduler 단위 테스트")
class LateNotificationSchedulerTest {

    @InjectMocks
    private LateNotificationScheduler lateNotificationScheduler;

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreEmployeeRepository storeEmployeeRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private SetOperations<String, String> setOperations;

    private User owner;
    private Store store;
    private User employeeUser;
    private StoreEmployee employee;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .loginType(LoginType.LOCAL)
                .name("김사장")
                .email("owner@test.com")
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        store = Store.builder()
                .owner(owner)
                .name("알맹이카페")
                .address("서울시 강남구")
                .qrCode("qr_test")
                .build();
        ReflectionTestUtils.setField(store, "id", 10L);
        ReflectionTestUtils.setField(store, "isClosed", false);

        employeeUser = User.builder()
                .loginType(LoginType.LOCAL)
                .name("김알바")
                .email("alba@test.com")
                .build();
        ReflectionTestUtils.setField(employeeUser, "id", 100L);

        employee = StoreEmployee.builder()
                .store(store)
                .user(employeeUser)
                .build();
        ReflectionTestUtils.setField(employee, "id", 50L);
    }

    @Nested
    @DisplayName("checkAndNotifyLate()")
    class CheckAndNotifyLateTest {

        @Test
        @DisplayName("Redis late SET에 지각자가 있으면 알림을 전송한다")
        void notifyWhenLateExists() {
            // given
            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(Set.of("50"));
            when(storeEmployeeRepository.findByIdWithUser(50L)).thenReturn(Optional.of(employee));

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 50L, "김알바", "알맹이카페");
        }

        @Test
        @DisplayName("Redis late SET이 비어있으면 알림을 전송하지 않는다")
        void skipWhenLateSetEmpty() {
            // given
            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(Set.of());

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then
            verify(notificationService, never()).sendLateNotification(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Redis late SET이 null이면 알림을 전송하지 않는다")
        void skipWhenLateSetNull() {
            // given
            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(null);

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then
            verify(notificationService, never()).sendLateNotification(any(), any(), any(), any());
        }

        @Test
        @DisplayName("운영 중인 매장이 없으면 아무것도 하지 않는다")
        void skipWhenNoOpenStores() {
            // given
            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of());

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then
            verify(redisTemplate, never()).opsForSet();
            verify(notificationService, never()).sendLateNotification(any(), any(), any(), any());
        }

        @Test
        @DisplayName("지각자가 여러 명이면 각각 알림을 전송한다")
        void notifyMultipleLateEmployees() {
            // given
            User employeeUser2 = User.builder()
                    .loginType(LoginType.LOCAL)
                    .name("이알바")
                    .email("alba2@test.com")
                    .build();
            ReflectionTestUtils.setField(employeeUser2, "id", 101L);

            StoreEmployee employee2 = StoreEmployee.builder()
                    .store(store)
                    .user(employeeUser2)
                    .build();
            ReflectionTestUtils.setField(employee2, "id", 51L);

            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(Set.of("50", "51"));
            when(storeEmployeeRepository.findByIdWithUser(50L)).thenReturn(Optional.of(employee));
            when(storeEmployeeRepository.findByIdWithUser(51L)).thenReturn(Optional.of(employee2));

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 50L, "김알바", "알맹이카페");
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 51L, "이알바", "알맹이카페");
        }

        @Test
        @DisplayName("사장님이 매장을 여러 개 운영하면 각 매장별로 알림을 전송한다")
        void notifyAcrossMultipleStores() {
            // given
            Store store2 = Store.builder()
                    .owner(owner)
                    .name("알맹이베이커리")
                    .address("서울시 서초구")
                    .qrCode("qr_test2")
                    .build();
            ReflectionTestUtils.setField(store2, "id", 20L);
            ReflectionTestUtils.setField(store2, "isClosed", false);

            User employeeUser2 = User.builder()
                    .loginType(LoginType.LOCAL)
                    .name("박알바")
                    .email("alba3@test.com")
                    .build();
            ReflectionTestUtils.setField(employeeUser2, "id", 102L);

            StoreEmployee employee2 = StoreEmployee.builder()
                    .store(store2)
                    .user(employeeUser2)
                    .build();
            ReflectionTestUtils.setField(employee2, "id", 60L);

            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store, store2));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(Set.of("50"));
            when(setOperations.members("store:20:late")).thenReturn(Set.of("60"));
            when(storeEmployeeRepository.findByIdWithUser(50L)).thenReturn(Optional.of(employee));
            when(storeEmployeeRepository.findByIdWithUser(60L)).thenReturn(Optional.of(employee2));

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then — 같은 사장님에게 매장별 알림이 각각 전송됨
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 50L, "김알바", "알맹이카페");
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 60L, "박알바", "알맹이베이커리");
        }

        @Test
        @DisplayName("사장님이 매장 여러 개 중 한 매장에만 지각자가 있으면 해당 매장만 알림 전송한다")
        void notifyOnlyStoreWithLate() {
            // given
            Store store2 = Store.builder()
                    .owner(owner)
                    .name("알맹이베이커리")
                    .address("서울시 서초구")
                    .qrCode("qr_test2")
                    .build();
            ReflectionTestUtils.setField(store2, "id", 20L);
            ReflectionTestUtils.setField(store2, "isClosed", false);

            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store, store2));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(Set.of());
            when(setOperations.members("store:20:late")).thenReturn(Set.of("50"));
            when(storeEmployeeRepository.findByIdWithUser(50L)).thenReturn(Optional.of(employee));

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then — 지각자 없는 매장은 알림 안 보냄, 지각자 있는 매장만 1회 호출
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 50L, "김알바", "알맹이베이커리");
        }

        @Test
        @DisplayName("직원이 삭제된 경우 이름을 '직원'으로 대체하여 알림을 전송한다")
        void fallbackNameWhenEmployeeDeleted() {
            // given
            when(storeRepository.findOpenStoresWithOwner()).thenReturn(List.of(store));
            when(redisTemplate.opsForSet()).thenReturn(setOperations);
            when(setOperations.members("store:10:late")).thenReturn(Set.of("999"));
            when(storeEmployeeRepository.findByIdWithUser(999L)).thenReturn(Optional.empty());

            // when
            lateNotificationScheduler.checkAndNotifyLate();

            // then
            verify(notificationService, times(1))
                    .sendLateNotification(owner, 999L, "직원", "알맹이카페");
        }
    }
}
