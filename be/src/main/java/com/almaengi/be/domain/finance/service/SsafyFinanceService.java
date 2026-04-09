package com.almaengi.be.domain.finance.service;

import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class SsafyFinanceService {

    private final RestClient restClient;

    @Value("${ssafy.finance.api-key}")
    private String apiKey;

    @Value("${ssafy.finance.base-url}")
    private String baseUrl;

    /** 기관거래고유번호 채번용. 멀티스레드 환경에서도 중복 없이 순차 증가를 보장합니다. */
    private final AtomicLong sequence = new AtomicLong(0);

    /**
     * SSAFY 금융망 사용자 계정 생성
     */
    public String createMember(String email) {
        Map<String, String> requestBody = Map.of(
                "apiKey", apiKey,
                "userId", email
        );

        Map response = restClient.post()
                .uri(baseUrl + "/member")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("userKey")) {
            log.error("[SsafyFinance] 사용자 계정 생성 실패 - email: {}, response: {}", email, response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        String userKey = (String) response.get("userKey");
        log.info("[SsafyFinance] 사용자 계정 생성 완료 - email: {}, userKey: {}", email, userKey);
        return userKey;
    }

    /**
     * 은행코드 목록 조회
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, String>> inquireBankCodes() {
        Map<String, Object> requestBody = Map.of(
                "Header", buildHeader("inquireBankCodes")
        );

        Map response = restClient.post()
                .uri(baseUrl + "/edu/bank/inquireBankCodes")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 은행코드 조회 실패 - response: {}", response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        return (List<Map<String, String>>) response.get("REC");
    }

    /**
     * 수시입출금 상품 목록에서 bankCode에 해당하는 accountTypeUniqueNo를 조회합니다.
     * @param bankCode 은행코드 (예: "001")
     * @return accountTypeUniqueNo (예: "001-1-ffa4253081d540")
     */
    @SuppressWarnings("unchecked")
    public String getAccountTypeUniqueNo(String bankCode) {
        Map<String, Object> requestBody = Map.of(
                "Header", buildHeader("inquireDemandDepositList")
        );

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/inquireDemandDepositList")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 상품 조회 실패 - response: {}", response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        List<Map<String, String>> products = (List<Map<String, String>>) response.get("REC");
        return products.stream()
                .filter(p -> bankCode.equals(p.get("bankCode")))
                .map(p -> p.get("accountTypeUniqueNo"))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.FINANCE_BANK_NOT_FOUND));
    }

    /**
     * SSAFY 금융망 수시입출금 계좌를 생성합니다.
     * @param userKey 사용자 금융망 키
     * @param accountTypeUniqueNo 상품 고유번호
     * @return [accountNo, bankCode] 배열
     */
    @SuppressWarnings("unchecked")
    public String[] createDemandDepositAccount(String userKey, String accountTypeUniqueNo) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("Header", buildHeaderWithUserKey("createDemandDepositAccount", userKey));
        requestBody.put("accountTypeUniqueNo", accountTypeUniqueNo);

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/createDemandDepositAccount")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 계좌 생성 실패 - response: {}", response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        Map<String, Object> rec = (Map<String, Object>) response.get("REC");
        String accountNo = (String) rec.get("accountNo");
        String bankCode = (String) rec.get("bankCode");
        log.info("[SsafyFinance] 계좌 생성 완료 - accountNo: {}, bankCode: {}", accountNo, bankCode);
        return new String[]{accountNo, bankCode};
    }

    /**
     * 수시입출금 계좌의 거래내역을 조회합니다.
     * @param userKey 사용자 금융망 키
     * @param accountNo 계좌번호
     * @param startDate 조회 시작일 (yyyyMMdd)
     * @param endDate 조회 종료일 (yyyyMMdd)
     * @param transactionType 거래구분 (M:입금, D:출금, A:전체)
     * @param orderByType 정렬순서 (ASC:오름차순, DESC:내림차순)
     * @return 거래내역 리스트
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, String>> inquireTransactionHistoryList(
            String userKey, String accountNo,
            String startDate, String endDate,
            String transactionType, String orderByType) {

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("Header", buildHeaderWithUserKey("inquireTransactionHistoryList", userKey));
        requestBody.put("accountNo", accountNo);
        requestBody.put("startDate", startDate);
        requestBody.put("endDate", endDate);
        requestBody.put("transactionType", transactionType);
        requestBody.put("orderByType", orderByType);

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/inquireTransactionHistoryList")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 거래내역 조회 실패 - response: {}", response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        Map<String, Object> rec = (Map<String, Object>) response.get("REC");
        return (List<Map<String, String>>) rec.get("list");
    }

    /**
     * 수시입출금 계좌의 잔액을 조회합니다.
     * @param userKey 사용자 금융망 키
     * @param accountNo 계좌번호
     * @return 계좌 잔액 (원)
     */
    @SuppressWarnings("unchecked")
    public Long inquireBalance(String userKey, String accountNo) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("Header", buildHeaderWithUserKey("inquireDemandDepositAccountBalance", userKey));
        requestBody.put("accountNo", accountNo);

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/inquireDemandDepositAccountBalance")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 잔액 조회 실패 - response: {}", response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        Map<String, Object> rec = (Map<String, Object>) response.get("REC");
        return Long.parseLong((String) rec.get("accountBalance"));
    }

    /**
     * 수시입출금 계좌 간 이체를 수행합니다.
     * @param userKey 출금 계좌 소유자의 금융망 키
     * @param withdrawalAccountNo 출금 계좌번호 (사장님)
     * @param depositAccountNo 입금 계좌번호 (알바생)
     * @param amount 이체 금액 (원)
     * @param withdrawalMemo 출금 통장 메모 (예: "홍길동 3월 급여")
     * @param depositMemo 입금 통장 메모 (예: "알마엥이카페 3월 급여")
     */
    public void transferDemandDeposit(String userKey,
                                      String withdrawalAccountNo, String depositAccountNo,
                                      Long amount,
                                      String withdrawalMemo, String depositMemo) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("Header", buildHeaderWithUserKey("updateDemandDepositAccountTransfer", userKey));
        requestBody.put("depositAccountNo", depositAccountNo);
        requestBody.put("depositTransactionSummary", depositMemo);
        requestBody.put("transactionBalance", String.valueOf(amount));
        requestBody.put("withdrawalAccountNo", withdrawalAccountNo);
        requestBody.put("withdrawalTransactionSummary", withdrawalMemo);

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/updateDemandDepositAccountTransfer")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 이체 실패 - withdrawal: {}, deposit: {}, amount: {}, response: {}",
                    withdrawalAccountNo, depositAccountNo, amount, response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        log.info("[SsafyFinance] 이체 완료 - {} → {}, {}원", withdrawalAccountNo, depositAccountNo, amount);
    }

    /**
     * 수시입출금 계좌에서 출금합니다.
     *
     * @param userKey 계좌 소유자의 금융망 키
     * @param accountNo 출금 대상 계좌번호
     * @param amount 출금 금액 (원)
     * @param summary 거래 메모
     */
    @SuppressWarnings("unchecked")
    public void withdraw(String userKey, String accountNo, Long amount, String summary) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("Header", buildHeaderWithUserKey("updateDemandDepositAccountWithdrawal", userKey));
        requestBody.put("accountNo", accountNo);
        requestBody.put("transactionBalance", String.valueOf(amount));
        requestBody.put("transactionSummary", summary);

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/updateDemandDepositAccountWithdrawal")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 출금 실패 - accountNo: {}, amount: {}, response: {}", accountNo, amount, response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        log.info("[SsafyFinance] 출금 완료 - accountNo: {}, {}원", accountNo, amount);
    }

    /**
     * 수시입출금 계좌에 입금합니다.
     *
     * @param userKey 계좌 소유자의 금융망 키
     * @param accountNo 입금 대상 계좌번호
     * @param amount 입금 금액 (원)
     * @param summary 거래 메모
     */
    @SuppressWarnings("unchecked")
    public void deposit(String userKey, String accountNo, Long amount, String summary) {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("Header", buildHeaderWithUserKey("updateDemandDepositAccountDeposit", userKey));
        requestBody.put("accountNo", accountNo);
        requestBody.put("transactionBalance", String.valueOf(amount));
        requestBody.put("transactionSummary", summary);

        Map response = restClient.post()
                .uri(baseUrl + "/edu/demandDeposit/updateDemandDepositAccountDeposit")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("REC")) {
            log.error("[SsafyFinance] 입금 실패 - accountNo: {}, amount: {}, response: {}", accountNo, amount, response);
            throw new BusinessException(ErrorCode.FINANCE_API_ERROR);
        }

        log.info("[SsafyFinance] 입금 완료 - accountNo: {}, {}원", accountNo, amount);
    }

    /**
     * SSAFY 금융망에서 이메일(userId)로 사용자의 userKey를 조회합니다.
     * DB에 userKey를 저장하지 않고, 필요할 때마다 API를 호출하여 조회합니다.
     *
     * @param email 사용자 이메일 (SSAFY 금융망 userId)
     * @return userKey
     */
    @SuppressWarnings("unchecked")
    public String searchMemberKey(String email) {
        Map<String, String> requestBody = Map.of(
                "apiKey", apiKey,
                "userId", email
        );

        Map response = restClient.post()
                .uri(baseUrl + "/member/search")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("userKey")) {
            log.error("[SsafyFinance] 사용자 조회 실패 - email: {}, response: {}", email, response);
            throw new BusinessException(ErrorCode.FINANCE_USER_KEY_NOT_FOUND);
        }

        return (String) response.get("userKey");
    }

    /**
     * userKey를 포함하는 공통 Header 생성
     */
    private Map<String, String> buildHeaderWithUserKey(String apiName, String userKey) {
        Map<String, String> header = buildHeader(apiName);
        header.put("userKey", userKey);
        return header;
    }

    /**
     * 공통 Header 생성
     */
    private Map<String, String> buildHeader(String apiName) {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String time = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        String uniqueNo = date + time + String.format("%06d", sequence.incrementAndGet() % 1000000);

        Map<String, String> header = new LinkedHashMap<>();
        header.put("apiName", apiName);
        header.put("transmissionDate", date);
        header.put("transmissionTime", time);
        header.put("institutionCode", "00100");
        header.put("fintechAppNo", "001");
        header.put("apiServiceCode", apiName);
        header.put("institutionTransactionUniqueNo", uniqueNo);
        header.put("apiKey", apiKey);
        return header;
    }
}
