package com.almaengi.be.domain.store.controller;

import com.almaengi.be.domain.store.dto.StoreEmployeeRequestDto;
import com.almaengi.be.domain.store.dto.StoreEmployeeResponseDto;
import com.almaengi.be.domain.store.service.StoreEmployeeService;
import com.almaengi.be.domain.store.type.StoreEmployeeStatus;
import com.almaengi.be.global.config.SecurityConfig;
import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import com.almaengi.be.global.security.jwt.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = StoreEmployeeController.class, excludeFilters = {
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {SecurityConfig.class, JwtAuthenticationFilter.class})
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
        Long userId = 1L;
        Long storeId = 1L;
        UsernamePasswordAuthenticationToken auth = auth(userId);

        StoreEmployeeResponseDto.InviteCodeInfo response = StoreEmployeeResponseDto.InviteCodeInfo.builder()
                .inviteCode("A1B2C3")
                .expiredAt("2026-03-27T22:00:00")
                .build();

        given(storeEmployeeService.generateInviteCode(any(), eq(storeId))).willReturn(response);

        mockMvc.perform(post("/api/v1/stores/{storeId}/invite-code", storeId)
                        .with(csrf())
                        .with(authentication(auth)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.inviteCode").value("A1B2C3"));
    }

    @Test
    @DisplayName("매장 합류 신청 API - 응답 형태 검증")
    void joinStore() throws Exception {
        Long userId = 2L;
        UsernamePasswordAuthenticationToken auth = auth(userId);

        StoreEmployeeRequestDto.Join request = new StoreEmployeeRequestDto.Join();
        org.springframework.test.util.ReflectionTestUtils.setField(request, "inviteCode", "A1B2C3");

        StoreEmployeeResponseDto.EmployeeInfo response = StoreEmployeeResponseDto.EmployeeInfo.builder()
                .employeeId(10L)
                .userId(userId)
                .name("김알바")
                .status(StoreEmployeeStatus.WAITING)
                .build();

        given(storeEmployeeService.joinStore(any(), any(StoreEmployeeRequestDto.Join.class))).willReturn(response);

        mockMvc.perform(post("/api/v1/stores/employees/join")
                        .with(csrf())
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.employeeId").value(10L))
                .andExpect(jsonPath("$.data.status").value("WAITING"));
    }

    @Test
    @DisplayName("직원 합류 승인 API - 응답 형태 검증")
    void approveEmployee() throws Exception {
        Long ownerId = 1L;
        Long storeId = 10L;
        Long employeeId = 200L;
        UsernamePasswordAuthenticationToken auth = auth(ownerId);

        StoreEmployeeResponseDto.EmployeeInfo response = StoreEmployeeResponseDto.EmployeeInfo.builder()
                .employeeId(employeeId)
                .userId(2L)
                .name("김알바")
                .status(StoreEmployeeStatus.WORKING)
                .build();

        given(storeEmployeeService.approveEmployee(any(), eq(storeId), eq(employeeId))).willReturn(response);

        mockMvc.perform(patch("/api/v1/stores/{storeId}/employees/{employeeId}/approve", storeId, employeeId)
                        .with(csrf())
                        .with(authentication(auth)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.status").value("WORKING"));
    }

    @Test
    @DisplayName("매장 직원 목록 조회 API - 응답 형태 검증")
    void getStoreEmployees() throws Exception {
        Long userId = 101L;
        Long storeId = 1L;
        UsernamePasswordAuthenticationToken auth = auth(userId);

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

        given(storeEmployeeService.getStoreEmployees(any(), eq(storeId))).willReturn(List.of(ownerInfo, employeeInfo));

        mockMvc.perform(get("/api/v1/stores/{storeId}/employees", storeId)
                        .with(authentication(auth)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].employeeId").value(Matchers.nullValue()))
                .andExpect(jsonPath("$.data[1].employeeId").value(10L));
    }

    @Test
    @DisplayName("상태별 직원 목록 조회 API - enum status 쿼리 전달 검증")
    void getStatusEmployees() throws Exception {
        Long ownerId = 1L;
        Long storeId = 10L;
        UsernamePasswordAuthenticationToken auth = auth(ownerId);

        StoreEmployeeResponseDto.EmployeeInfo bestEmployee = StoreEmployeeResponseDto.EmployeeInfo.builder()
                .employeeId(20L)
                .userId(2L)
                .name("우수직원")
                .status(StoreEmployeeStatus.BEST)
                .build();

        given(storeEmployeeService.getStatusEmployees(any(), eq(storeId), eq(StoreEmployeeStatus.BEST)))
                .willReturn(List.of(bestEmployee));

        mockMvc.perform(get("/api/v1/stores/{storeId}/employees/status", storeId)
                        .queryParam("status", "BEST")
                        .with(authentication(auth)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].status").value("BEST"));
    }

    @Test
    @DisplayName("상태별 직원 목록 조회 API - 권한 없음 예외 응답 검증")
    void getStatusEmployeesUnauthorized() throws Exception {
        Long userId = 999L;
        Long storeId = 10L;
        UsernamePasswordAuthenticationToken auth = auth(userId);

        given(storeEmployeeService.getStatusEmployees(any(), eq(storeId), eq(StoreEmployeeStatus.WAITING)))
                .willThrow(new BusinessException(ErrorCode.UNAUTHORIZED_USER));

        mockMvc.perform(get("/api/v1/stores/{storeId}/employees/status", storeId)
                        .queryParam("status", "WAITING")
                        .with(authentication(auth)))
                .andDo(print())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(ErrorCode.UNAUTHORIZED_USER.getCode()))
                .andExpect(jsonPath("$.message").value(ErrorCode.UNAUTHORIZED_USER.getMessage()));
    }

    private UsernamePasswordAuthenticationToken auth(Long userId) {
        return new UsernamePasswordAuthenticationToken(
                userId,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
