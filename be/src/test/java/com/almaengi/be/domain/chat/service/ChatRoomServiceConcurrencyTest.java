package com.almaengi.be.domain.chat.service;

import com.almaengi.be.domain.auth.type.LoginType;
import com.almaengi.be.domain.chat.dto.ChatRoomRequestDto;
import com.almaengi.be.domain.chat.dto.ChatRoomResponseDto;
import com.almaengi.be.domain.chat.entity.ChatDirectPair;
import com.almaengi.be.domain.chat.entity.ChatRoomMember;
import com.almaengi.be.domain.chat.repository.ChatDirectPairRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomMemberRepository;
import com.almaengi.be.domain.chat.repository.ChatRoomRepository;
import com.almaengi.be.domain.chat.type.ChatRoomType;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.entity.StoreEmployee;
import com.almaengi.be.domain.store.repository.StoreEmployeeRepository;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.domain.store.type.TaxType;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("ChatRoomService 동시성 테스트")
class ChatRoomServiceConcurrencyTest {

    @MockBean
    private RedissonClient redissonClient;

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreEmployeeRepository storeEmployeeRepository;

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private ChatDirectPairRepository chatDirectPairRepository;

    @Autowired
    private ChatRoomMemberRepository chatRoomMemberRepository;

    @Test
    @DisplayName("동시 요청으로 같은 DM 생성 시도 시 최종적으로 DM 방/페어는 1개만 유지")
    void createOrGetDirectRoom_concurrentRequest_preventsDuplicateDm() throws Exception {
        User owner = userRepository.save(User.builder()
                .loginType(LoginType.LOCAL)
                .password("password")
                .role(Role.OWNER)
                .name("사장")
                .email("owner-dm-concurrency@test.com")
                .build());

        User employee = userRepository.save(User.builder()
                .loginType(LoginType.LOCAL)
                .password("password")
                .role(Role.EMPLOYEE)
                .name("직원")
                .email("employee-dm-concurrency@test.com")
                .build());

        Store store = storeRepository.save(Store.builder()
                .owner(owner)
                .name("동시성검증매장")
                .address("서울시 강남구")
                .phone("010-1234-5678")
                .isOver5Employees(false)
                .qrCode("qr-concurrency")
                .build());

        storeEmployeeRepository.save(StoreEmployee.builder()
                .store(store)
                .user(employee)
                .status(StoreEmployeeStatus.WORKING)
                .position("매장직원")
                .hourlyWage(11000)
                .taxType(TaxType.INCOME_3_3)
                .workedMinutes(0)
                .willWorkingMinutes(0)
                .hireDate(LocalDate.now())
                .dependentsCount(0)
                .includeHolidayPay(false)
                .build());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Callable<ChatRoomResponseDto.RoomDetail> task = () -> {
                ChatRoomRequestDto.CreateDirect req = new ChatRoomRequestDto.CreateDirect();
                org.springframework.test.util.ReflectionTestUtils.setField(req, "targetUserId", employee.getId());
                return chatRoomService.createOrGetDirectRoom(owner.getId(), store.getId(), req);
            };

            List<Future<ChatRoomResponseDto.RoomDetail>> futures = executor.invokeAll(List.of(task, task));

            List<Long> successRoomIds = new ArrayList<>();
            List<Throwable> failures = new ArrayList<>();

            for (Future<ChatRoomResponseDto.RoomDetail> future : futures) {
                try {
                    ChatRoomResponseDto.RoomDetail result = future.get();
                    successRoomIds.add(result.getRoomId());
                } catch (ExecutionException e) {
                    failures.add(e.getCause());
                }
            }

            // 최소 1건은 성공해야 함
            assertThat(successRoomIds).isNotEmpty();

            // 성공 결과가 2건이면 같은 roomId여야 함
            if (successRoomIds.size() == 2) {
                assertThat(successRoomIds.get(0)).isEqualTo(successRoomIds.get(1));
            }

            // 실패가 있다면 주로 동시성 유니크 제약 위반 계열 예외여야 함
            for (Throwable failure : failures) {
                assertThat(failure)
                        .isInstanceOfAny(DataIntegrityViolationException.class, RuntimeException.class);
            }

            Optional<ChatDirectPair> directPair = chatDirectPairRepository
                    .findByStoreIdAndUser1IdAndUser2Id(store.getId(), Math.min(owner.getId(), employee.getId()), Math.max(owner.getId(), employee.getId()));

            assertThat(directPair).isPresent();

            Long roomId = directPair.get().getRoom().getId();
            List<ChatRoomMember> activeMembers = chatRoomMemberRepository.findByRoomIdAndLeftAtIsNull(roomId);
            assertThat(activeMembers).hasSize(2);
            assertThat(chatRoomRepository.findByStoreIdAndRoomTypeAndIsArchivedFalse(store.getId(), ChatRoomType.DM)).isPresent();
        } finally {
            executor.shutdown();
        }
    }
}
