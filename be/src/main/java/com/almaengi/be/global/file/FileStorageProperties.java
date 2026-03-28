package com.almaengi.be.global.file;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.file")
public class FileStorageProperties {
    private String uploadDir = "uploads";
    private Map<String, Long> maxSize = new HashMap<>();

    public long getMaxSizeForType(String docType) {
        return maxSize.getOrDefault(docType, maxSize.getOrDefault("default", 10485760L));
    }
}
