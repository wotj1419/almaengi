package com.almaengi.be.global.util;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RedisUtil {
    private final RedisTemplate<String, Object> redisTemplate;

    public void setDataExpire(String key, String value, long duration, TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value, duration, timeUnit);
    }

    public String getData(String key) {
        return (String) redisTemplate.opsForValue().get(key);
    }

    public void deleteData(String key) {
        redisTemplate.delete(key);
    }

    // 키와 파라미터가 일치하는지 확인, 일치한다면 삭제하여 1회용으로 만듦.
    // 인증번호 로직에 사용.
    public boolean checkAndDeleteData(String key, String value) {
        String storedValue = getData(key);
        if(storedValue != null && storedValue.equals(value)) {
            deleteData(key);
            return true;
        }

        return false;
    }

    public String getAndDelete(String key) {
        String value = getData(key);
        if(value != null) deleteData(key);

        return value;
    }
}
