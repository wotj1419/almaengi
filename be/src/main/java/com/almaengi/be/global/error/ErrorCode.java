package com.almaengi.be.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Global
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "G001", "서버 오류가 발생했습니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "G002", "잘못된 입력값입니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "G003", "지원하지 않는 HTTP 메서드입니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "해당 사용자를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U002", "이미 존재하는 이메일입니다."),
    UNAUTHORIZED_ROLE(HttpStatus.FORBIDDEN, "U003", "접근 권한이 없는 역할입니다."),
    UNAUTHORIZED_USER(HttpStatus.FORBIDDEN, "U004", "접근 권한이 없는 유저입니다."),

    // Store
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "S001", "해당 매장을 찾을 수 없습니다."),
    STORE_EMPLOYEE_NOT_FOUND(HttpStatus.NOT_FOUND, "S002", "해당 매장의 직원을 찾을 수 없습니다."),

    ALREADY_STORE_EMPLOYEE(HttpStatus.BAD_REQUEST, "S003", "이미 해당 매장에 소속된 직원입니다."),
    INVALID_INVITE_CODE(HttpStatus.BAD_REQUEST, "S004", "유효하지 않거나 만료된 초대 코드입니다."),

    // Auction
    AUCTION_NOT_FOUND(HttpStatus.NOT_FOUND, "A001", "해당 구인 경매를 찾을 수 없습니다."),
    AUCTION_NOT_IN_PROGRESS(HttpStatus.BAD_REQUEST, "A002", "현재 진행 중인 경매가 아닙니다."),
    INVALID_MIN_WAGE(HttpStatus.BAD_REQUEST, "A003", "하한가는 법정 최저시급 이상이어야 합니다."),
    INVALID_MAX_WAGE(HttpStatus.BAD_REQUEST, "A004", "상한가는 하한가 이상이어야 합니다."),
    INVALID_BID_WAGE(HttpStatus.BAD_REQUEST, "A005", "희망 시급은 상한가와 하한가 사이여야 합니다."),
    NO_SELECTED_BIDDER(HttpStatus.BAD_REQUEST, "A006", "선택된 지원자가 없습니다."),
    INVALID_BID_SELECTION(HttpStatus.BAD_REQUEST, "A007", "유효하지 않은 입찰 정보가 포함되어 있습니다."),
    AUCTION_LOCK_TIMEOUT(HttpStatus.TOO_MANY_REQUESTS, "A008", "현재 접속량이 많아 처리가 지연되고 있습니다. 잠시 후 다시 시도해주세요."),
    AUCTION_LOCK_INTERRUPTED(HttpStatus.INTERNAL_SERVER_ERROR, "A009", "Redisson Lock 처리 중 스레드 인터럽트가 발생했습니다."),
    INVALID_TIME_FORMAT(HttpStatus.BAD_REQUEST, "A010", "잘못된 시간 형식입니다."),
    INVALID_DEADLINE(HttpStatus.BAD_REQUEST, "A011", "마감 시간은 현재 시각 이후여야 합니다."),
    INVALID_TARGET_DATE(HttpStatus.BAD_REQUEST, "A012", "근무일은 오늘 이후(오늘 포함)여야 합니다."),

    // Auth
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A101", "이메일 또는 비밀번호가 올바르지 않습니다."),
    WITHDRAWN_USER(HttpStatus.FORBIDDEN, "A102", "탈퇴한 사용자입니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A103", "토큰이 만료되었습니다."),
    TOKEN_BLACKLISTED(HttpStatus.UNAUTHORIZED, "A104", "이미 로그아웃된 토큰입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A105", "유효하지 않은 토큰입니다."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A106", "리프레시 토큰이 만료되었습니다."),
    REFRESH_TOKEN_MISMATCH(HttpStatus.UNAUTHORIZED, "A107", "리프레시 토큰이 일치하지 않습니다."),
    INVALID_PASSWORD_FORMAT(HttpStatus.BAD_REQUEST, "A108", "비밀번호 형식이 올바르지 않습니다."),

    // Schedule
    SCHEDULE_NOT_FOUND(HttpStatus.NOT_FOUND, "S101", "해당 스케줄을 찾을 수 없습니다."),
    DUPLICATE_SCHEDULE(HttpStatus.CONFLICT, "S102", "중복된 스케줄입니다."),
    INVALID_DAY_OF_WEEK_FORMAT(HttpStatus.BAD_REQUEST, "S103", "잘못된 요일입니다."),

    // Notification
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "N001", "존재하지 않는 알림입니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
