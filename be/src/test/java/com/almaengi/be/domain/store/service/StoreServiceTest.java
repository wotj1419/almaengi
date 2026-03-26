package com.almaengi.be.domain.store.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import com.almaengi.be.domain.chat.service.ChatRoomService;
import com.almaengi.be.global.util.KakaoGeocodingClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.almaengi.be.domain.store.dto.StoreRequestDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.domain.store.entity.Store;
import com.almaengi.be.domain.store.repository.StoreRepository;
import com.almaengi.be.domain.user.entity.User;
import com.almaengi.be.domain.user.repository.UserRepository;
import com.almaengi.be.domain.user.type.Role;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;

@ExtendWith(MockitoExtension.class)
@DisplayName("StoreService 단위 테스트")
class StoreServiceTest {

    @InjectMocks
    private StoreService storeService;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ChatRoomService chatRoomService;

    @Mock
    private KakaoGeocodingClient kakaoGeocodingClient;

    private User owner;
    private User otherUser;
    private Store store;

    // 매직넘버 상수로 분리
    private final Long OWNER_ID = 1L;
    private final Long OTHER_USER_ID = 2L;
    private final Long STORE_ID = 10L;

    @BeforeEach
    void setUp() {
        owner = User.builder().email("owner@test.com").name("사장님").role(Role.OWNER).build();
        ReflectionTestUtils.setField(owner, "id", OWNER_ID);

        otherUser = User.builder().email("other@test.com").name("다른사장님").role(Role.OWNER).build();
        ReflectionTestUtils.setField(otherUser, "id", OTHER_USER_ID);

        store = Store.builder().owner(owner).name("알맹이 카페").address("강남구").phone("010-1234").isOver5Employees(true).qrCode("test-qr").build();
        ReflectionTestUtils.setField(store, "id", STORE_ID);
        ReflectionTestUtils.setField(store, "isClosed", false);
    }

    @Nested
    @DisplayName("매장 생성 (createStore) 테스트")
    class CreateStoreTest {

        private StoreRequestDto.Create createRequest(String storeName, String address, String phone, boolean isOver5Employees) {
            StoreRequestDto.Create req = new StoreRequestDto.Create();
            ReflectionTestUtils.setField(req, "storeName", storeName);
            ReflectionTestUtils.setField(req, "address", address);
            ReflectionTestUtils.setField(req, "phone", phone);
            ReflectionTestUtils.setField(req, "isOver5Employees", isOver5Employees);
            return req;
        }

        @Test
        @DisplayName("성공: 주소 지오코딩 후 위경도를 저장하고 매장을 생성한다")
        void successWithGeocoding() {
            // given
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
            when(storeRepository.save(any(Store.class))).thenReturn(store);
            when(kakaoGeocodingClient.geocode("강남구"))
                    .thenReturn(new KakaoGeocodingClient.GeocodedPoint(37.4979, 127.0276));

            StoreRequestDto.Create req = createRequest("알맹이 카페", "강남구", "010-1234", true);

            // when
            StoreResponseDto.StoreInfo response = storeService.createStore(OWNER_ID, req);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getStoreName()).isEqualTo("알맹이 카페");

            // 저장 직전 엔티티에 지오코딩 좌표가 제대로 들어갔는지 검증
            ArgumentCaptor<Store> storeCaptor = ArgumentCaptor.forClass(Store.class);
            verify(storeRepository, times(1)).save(storeCaptor.capture());
            Store savedArg = storeCaptor.getValue();

            assertThat(savedArg.getLatitude()).isEqualTo(37.4979);
            assertThat(savedArg.getLongitude()).isEqualTo(127.0276);
            assertThat(savedArg.getAddress()).isEqualTo("강남구");

            verify(kakaoGeocodingClient, times(1)).geocode("강남구");
            verify(chatRoomService, times(1)).ensurePersonalBotRoomWithWelcome(OWNER_ID, STORE_ID);
        }

        @Test
        @DisplayName("실패: 존재하지 않는 회원(사장)이면 USER_NOT_FOUND 예외 발생")
        void failWhenUserNotFound() {
            // given
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.empty());

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> storeService.createStore(OWNER_ID, new StoreRequestDto.Create()));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_FOUND);

            // 유저 조회에서 실패하면 지오코딩/저장 로직은 실행되면 안 됨
            verify(kakaoGeocodingClient, never()).geocode(any());
            verify(storeRepository, never()).save(any(Store.class));
            verify(chatRoomService, never()).ensurePersonalBotRoomWithWelcome(any(), any());
        }

        @Test
        @DisplayName("실패: 지오코딩 결과가 없으면 STORE_GEOCODING_NOT_FOUND 예외가 발생하고 저장되지 않는다")
        void failWhenGeocodingNotFound() {
            // given
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
            when(kakaoGeocodingClient.geocode("없는 주소"))
                    .thenThrow(new BusinessException(ErrorCode.STORE_GEOCODING_NOT_FOUND));

            StoreRequestDto.Create req = createRequest("알맹이 카페", "없는 주소", "010-1234", true);

            // when
            BusinessException e = assertThrows(BusinessException.class,
                    () -> storeService.createStore(OWNER_ID, req));

            // then
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STORE_GEOCODING_NOT_FOUND);
            verify(storeRepository, never()).save(any(Store.class));
            verify(chatRoomService, never()).ensurePersonalBotRoomWithWelcome(any(), any());
        }

        @Test
        @DisplayName("실패: 외부 API 장애면 STORE_GEOCODING_UPSTREAM_FAILED 예외가 발생하고 저장되지 않는다")
        void failWhenGeocodingUpstreamFailed() {
            // given
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
            when(kakaoGeocodingClient.geocode("강남구"))
                    .thenThrow(new BusinessException(ErrorCode.STORE_GEOCODING_UPSTREAM_FAILED));

            StoreRequestDto.Create req = createRequest("알맹이 카페", "강남구", "010-1234", true);

            // when
            BusinessException e = assertThrows(BusinessException.class,
                    () -> storeService.createStore(OWNER_ID, req));

            // then
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.STORE_GEOCODING_UPSTREAM_FAILED);
            verify(storeRepository, never()).save(any(Store.class));
            verify(chatRoomService, never()).ensurePersonalBotRoomWithWelcome(any(), any());
        }

        @Test
        @DisplayName("성공: 채팅방 생성 실패는 무시되고 매장 생성은 성공한다(best-effort)")
        void successEvenWhenChatBotInitFails() {
            // given
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
            when(storeRepository.save(any(Store.class))).thenReturn(store);
            when(kakaoGeocodingClient.geocode("강남구"))
                    .thenReturn(new KakaoGeocodingClient.GeocodedPoint(37.4979, 127.0276));
            doThrow(new RuntimeException("chat init failed"))
                    .when(chatRoomService).ensurePersonalBotRoomWithWelcome(OWNER_ID, STORE_ID);

            StoreRequestDto.Create req = createRequest("알맹이 카페", "강남구", "010-1234", true);

            // when
            StoreResponseDto.StoreInfo response = storeService.createStore(OWNER_ID, req);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getStoreId()).isEqualTo(STORE_ID);
            verify(storeRepository, times(1)).save(any(Store.class));
            verify(chatRoomService, times(1)).ensurePersonalBotRoomWithWelcome(OWNER_ID, STORE_ID);
        }
    }

    @Nested
    @DisplayName("매장 조회 (Read) 테스트")
    class ReadStoreTest {
        @Test
        @DisplayName("성공: 내가 소유하고 폐업하지 않은 매장 목록을 조회한다")
        void getMyStoresSuccess() {
            // given
            when(storeRepository.findByOwnerIdAndIsClosedFalse(OWNER_ID)).thenReturn(List.of(store));

            // when
            List<StoreResponseDto.StoreInfo> response = storeService.getMyStores(OWNER_ID);

            // then
            assertThat(response).hasSize(1);
            assertThat(response.get(0).getStoreId()).isEqualTo(STORE_ID);
        }

        @Test
        @DisplayName("성공: 사장님 본인의 특정 매장 단건을 조회한다")
        void getStoreSuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));

            // when
            StoreResponseDto.StoreInfo response = storeService.getStore(OWNER_ID, STORE_ID);

            // then
            assertThat(response.getStoreId()).isEqualTo(STORE_ID);
            assertThat(response.getStoreName()).isEqualTo("알맹이 카페");
        }

        @Test
        @DisplayName("실패: 매장 조회 시 내 매장이 아니면 권한 에러 발생")
        void getStoreFailWhenNotOwner() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class, () -> storeService.getStore(OTHER_USER_ID, STORE_ID));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_USER);
        }
    }

    @Nested
    @DisplayName("매장 수정 및 삭제 테스트")
    class UpdateAndDeleteTest {
        @Test
        @DisplayName("성공: 매장 정보를 성공적으로 수정한다")
        void updateStoreSuccess() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));

            StoreRequestDto.Update req = new StoreRequestDto.Update();
            ReflectionTestUtils.setField(req, "storeName", "수정된 카페명");
            ReflectionTestUtils.setField(req, "address", "서초구");

            // when
            StoreResponseDto.StoreInfo response = storeService.updateStore(OWNER_ID, STORE_ID, req);

            // then
            assertThat(response.getStoreName()).isEqualTo("수정된 카페명");
            assertThat(response.getAddress()).isEqualTo("서초구");
            assertThat(store.getName()).isEqualTo("수정된 카페명"); // 엔티티 더티 체킹 확인
        }

        @Test
        @DisplayName("성공: 매장 삭제 시 isClosed 필드가 true로(논리 삭제) 변경된다")
        void deleteStoreSuccess() {
            // given
            when(storeRepository.findById(STORE_ID)).thenReturn(Optional.of(store));

            // when
            storeService.deleteStore(OWNER_ID, STORE_ID);

            // then
            // isClosed 필드가 true로 세팅되는지 리플렉션으로 확인
            Boolean isClosed = (Boolean) ReflectionTestUtils.getField(store, "isClosed");
            assertThat(isClosed).isTrue();
            // 실제로 storeRepository.delete가 호출되지 않았는지 검증
            verify(storeRepository, never()).delete(any(Store.class));
        }

        @Test
        @DisplayName("실패: 매장 수정/삭제 시 권한이 없으면 UNAUTHORIZED_USER 발생")
        void failWhenUnauthorizedAction() {
            // given
            when(storeRepository.findByIdAndIsClosedFalse(STORE_ID)).thenReturn(Optional.of(store));

            // when & then
            BusinessException e = assertThrows(BusinessException.class,
                    () -> storeService.updateStore(OTHER_USER_ID, STORE_ID, new StoreRequestDto.Update()));
            assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED_USER);
        }
    }
}
