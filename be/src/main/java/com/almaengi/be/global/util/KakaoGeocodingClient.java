package com.almaengi.be.global.util;

import com.almaengi.be.global.error.BusinessException;
import com.almaengi.be.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoGeocodingClient {
    private final RestClient restClient;

    @Value("${kakao.local.base-url}")
    private String baseUrl;
    @Value("${kakao.local.rest-api-key}")
    private String restApiKey;

    // 주소 문자열을 카카오 로컬 API로 지오코딩하여 위/경도 반환
    // 결과없음: 400(S006) / 외부 API 장애, 타임아웃: 502(S005)
    public GeocodedPoint geocode(String address) {
        try {
            KakaoAddressSearchResponse response = restClient.get()
                    .uri(baseUrl + "/v2/local/search/address.json?query={query}", address)
                    .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + restApiKey)
                    .retrieve()
                    .body(KakaoAddressSearchResponse.class);

            if (response == null || response.documents() == null || response.documents().isEmpty())
                throw new BusinessException(ErrorCode.STORE_GEOCODING_NOT_FOUND);

            Document first = response.documents().get(0);

            Double longitude = parseCoordinate(first.x());
            Double latitude = parseCoordinate(first.y());

            return new GeocodedPoint(latitude, longitude);
        } catch(BusinessException e) {
            throw e;
        }  catch (RestClientResponseException e) {
            // 4xx/5xx 응답 등 외부 API 응답 예외
            log.warn("[KAKAO-GEOCODE] upstream response error. status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.STORE_GEOCODING_UPSTREAM_FAILED);
        } catch (ResourceAccessException e) {
            // 타임아웃/연결 실패 등
            log.warn("[KAKAO-GEOCODE] upstream connection error. message={}", e.getMessage());
            throw new BusinessException(ErrorCode.STORE_GEOCODING_UPSTREAM_FAILED);
        } catch (Exception e) {
            // 파싱 오류 등 예상 밖 예외도 외부 API 실패로 취급
            log.warn("[KAKAO-GEOCODE] unexpected error. message={}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.STORE_GEOCODING_UPSTREAM_FAILED);
        }
    }

    private Double parseCoordinate(String value) {
        try {
            return Double.parseDouble(value);
        } catch(Exception e) {
            throw new BusinessException(ErrorCode.STORE_GEOCODING_UPSTREAM_FAILED);
        }
    }

    public record GeocodedPoint(Double latitude, Double longitude) {}
    private record KakaoAddressSearchResponse(List<Document> documents) {}
    private record Document(String x, String y) {}
}
