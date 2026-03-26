package com.almaengi.be.domain.store.controller;

import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.service.StoreEmployeeService;
import com.almaengi.be.global.common.ApiResponse;
import com.almaengi.be.global.config.SecurityConfig;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.hamcrest.Matchers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.Collections;
import java.util.List;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StoreEmployeeController.class, excludeFilters = {
                // 커스텀 보안 필터가 테스트에 영향을 주는 것을 방지 (단순 컨트롤러 매핑 테스트 목적)
                @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = { SecurityConfig.class,
                                JwtAuthenticationFilter.class })
})
class StoreEmployeeControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private StoreEmployeeService storeEmployeeService;

        @Test
        @DisplayName("매장 초대 코드 발급 API - 응답 형태 검증")
        void generateInviteCode() throws Exception {
                // given
                Long storeId = 1L;
                Long userId = 1L;
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userId, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

                StoreEmployeeResponseDto.InviteCodeInfo mockResponse = StoreEmployeeResponseDto.InviteCodeInfo.builder()
                                .inviteCode("A1B2C3")
                                .expiredAt("2023-12-31T23:59:59")
                                .build();

                given(storeEmployeeService.generateInviteCode(any(), eq(storeId))).willReturn(mockResponse);

                // when & then
                mockMvc.perform(post("/api/v1/stores/{storeId}/invite-code", storeId)
                                .with(csrf()) // POST에 막히지 않도록 csrf 토큰 처리
                                .with(authentication(auth)))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("SUCCESS"))
                                .andExpect(jsonPath("$.data.inviteCode").value("A1B2C3"))
                                .andExpect(jsonPath("$.data.expiredAt").value("2023-12-31T23:59:59"));
        }

        @Test
        @DisplayName("매장 합류하기 (직원 등록) API - 응답 형태 검증")
        void joinStore() throws Exception {
                // given
                Long userId = 2L;
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userId, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

                StoreEmployeeRequestDto.Join request = new StoreEmployeeRequestDto.Join();
                org.springframework.test.util.ReflectionTestUtils.setField(request, "inviteCode", "A1B2C3");

                StoreEmployeeResponseDto.EmployeeInfo mockResponse = StoreEmployeeResponseDto.EmployeeInfo.builder()
                                .employeeId(10L)
                                .userId(userId)
                                .name("김알바")
                                .build();

                given(storeEmployeeService.joinStore(any(), any(StoreEmployeeRequestDto.Join.class)))
                                .willReturn(mockResponse);

                // JSON 직렬화를 위해 ObjectMapper 사용
                String requestJson = objectMapper.writeValueAsString(request);

                // when & then
                mockMvc.perform(post("/api/v1/stores/employees/join")
                                .with(csrf())
                                .with(authentication(auth))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestJson))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("SUCCESS"))
                                .andExpect(jsonPath("$.data.employeeId").value(10L))
                                .andExpect(jsonPath("$.data.name").value("김알바"));
        }

        @Test
        @DisplayName("매장 직원 목록 조회 API - 사장 포함 목록 응답 형태 검증")
        void getStoreEmployees() throws Exception {
                // given
                Long storeId = 1L;
                Long userId = 101L; // 요청자(직원)
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userId, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

                StoreEmployeeResponseDto.EmployeeInfo ownerInfo = StoreEmployeeResponseDto.EmployeeInfo.builder()
                                .employeeId(null)
                                .userId(1L)
                                .name("사장님")
                                .position("사장님")
                                .build();

                StoreEmployeeResponseDto.EmployeeInfo employeeInfo = StoreEmployeeResponseDto.EmployeeInfo.builder()
                                .employeeId(10L)
                                .userId(102L)
                                .name("김알바")
                                .position("평일 오전")
                                .build();

                given(storeEmployeeService.getStoreEmployees(any(), eq(storeId)))
                                .willReturn(List.of(ownerInfo, employeeInfo));

                // when & then
                mockMvc.perform(get("/api/v1/stores/{storeId}/employees", storeId)
                                .with(authentication(auth)))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("SUCCESS"))
                                .andExpect(jsonPath("$.data.length()").value(2))
                                .andExpect(jsonPath("$.data[0].userId").value(1L))
                                .andExpect(jsonPath("$.data[0].name").value("사장님"))
                                .andExpect(jsonPath("$.data[0].employeeId").value(Matchers.nullValue()))
                                .andExpect(jsonPath("$.data[1].employeeId").value(10L))
                                .andExpect(jsonPath("$.data[1].name").value("김알바"));
        }

        @Test
        @DisplayName("매장 직원 목록 조회 API - 권한 없음 예외 응답 검증")
        void getStoreEmployees_Unauthorized() throws Exception {
                // given
                Long storeId = 1L;
                Long userId = 999L;
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                userId, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

                given(storeEmployeeService.getStoreEmployees(any(), eq(storeId)))
                                .willThrow(new BusinessException(ErrorCode.UNAUTHORIZED_USER));

                // when & then
                mockMvc.perform(get("/api/v1/stores/{storeId}/employees", storeId)
                                .with(authentication(auth)))
                                .andDo(print())
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.status").value(ErrorCode.UNAUTHORIZED_USER.getCode()))
                                .andExpect(jsonPath("$.message").value(ErrorCode.UNAUTHORIZED_USER.getMessage()));
        }
}
