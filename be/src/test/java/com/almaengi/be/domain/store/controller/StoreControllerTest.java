package com.almaengi.be.domain.store.controller;

import com.almaengi.be.domain.store.dto.StoreRequestDto;
import com.almaengi.be.domain.store.dto.StoreResponseDto;
import com.almaengi.be.domain.store.service.StoreService;
import com.almaengi.be.global.security.jwt.JwtProvider;
import com.almaengi.be.global.security.redis.RedisTokenRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StoreController.class, excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
})
@DisplayName("StoreController 단위 테스트")
class StoreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private StoreService storeService;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RedisTokenRepository redisTokenRepository;

    private final Long TEMP_USER_ID = 1L;
    private final Long TEMP_STORE_ID = 10L;

    @Nested
    @DisplayName("매장 생성 API 테스트")
    class CreateStoreTest {
        @Test
        @DisplayName("성공: 올바른 정보로 매장을 생성한다")
        void createStoreSuccess() throws Exception {
            // given
            StoreRequestDto.Create req = new StoreRequestDto.Create();
            org.springframework.test.util.ReflectionTestUtils.setField(req, "storeName", "새로운 카페");
            org.springframework.test.util.ReflectionTestUtils.setField(req, "address", "서울시 관악구");
            org.springframework.test.util.ReflectionTestUtils.setField(req, "phone", "010-1234");
            org.springframework.test.util.ReflectionTestUtils.setField(req, "isOver5Employees", false);

            StoreResponseDto.StoreInfo mockResponse = StoreResponseDto.StoreInfo.builder()
                    .storeId(TEMP_STORE_ID).storeName("새로운 카페").build();

            Mockito.when(storeService.createStore(eq(TEMP_USER_ID), any(StoreRequestDto.Create.class)))
                    .thenReturn(mockResponse);

            // when & then
            // Spring Security를 exclude 했지만 @AuthUser 주입 목적인 인증 정보가 없으므로
            // 단위 테스트에서 @AuthUser(null)이 넘어갈 수 있습니다.
            // 정상적인 컨트롤러 매핑 테스트 목적만 갖습니다.
            mockMvc.perform(post("/api/v1/stores")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));

            Mockito.verify(storeService, Mockito.times(1))
                    .createStore(any(), any(StoreRequestDto.Create.class));
        }
    }

    @Nested
    @DisplayName("매장 조회 API 테스트")
    class ReadStoreTest {
        @Test
        @DisplayName("성공: 내 매장 전체를 조회한다")
        void getMyStoresSuccess() throws Exception {
            // given
            StoreResponseDto.StoreInfo mockStore = StoreResponseDto.StoreInfo.builder().storeId(TEMP_STORE_ID).build();
            Mockito.when(storeService.getMyStores(any())).thenReturn(List.of(mockStore));

            // when & then
            mockMvc.perform(get("/api/v1/stores"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));

            Mockito.verify(storeService, Mockito.times(1)).getMyStores(any());
        }

        @Test
        @DisplayName("성공: 특정 매장을 상세 단건 조회한다")
        void getStoreSuccess() throws Exception {
            // given
            StoreResponseDto.StoreInfo mockStore = StoreResponseDto.StoreInfo.builder().storeId(TEMP_STORE_ID).build();
            Mockito.when(storeService.getStore(any(), eq(TEMP_STORE_ID))).thenReturn(mockStore);

            // when & then
            mockMvc.perform(get("/api/v1/stores/{storeId}", TEMP_STORE_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));
        }
    }

    @Nested
    @DisplayName("매장 수정 및 삭제 API 테스트")
    class UpdateAndDeleteTest {
        @Test
        @DisplayName("성공: 매장 정보를 수정한다")
        void updateStoreSuccess() throws Exception {
            // given
            StoreRequestDto.Update req = new StoreRequestDto.Update();
            org.springframework.test.util.ReflectionTestUtils.setField(req, "storeName", "수정된 카페");
            org.springframework.test.util.ReflectionTestUtils.setField(req, "address", "수정된 주소");

            // when & then
            mockMvc.perform(put("/api/v1/stores/{storeId}", TEMP_STORE_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));
        }

        @Test
        @DisplayName("성공: 매장을 논리 삭제한다")
        void deleteStoreSuccess() throws Exception {
            // when & then
            mockMvc.perform(delete("/api/v1/stores/{storeId}", TEMP_STORE_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"));

            Mockito.verify(storeService, Mockito.times(1)).deleteStore(any(), eq(TEMP_STORE_ID));
        }
    }
}
