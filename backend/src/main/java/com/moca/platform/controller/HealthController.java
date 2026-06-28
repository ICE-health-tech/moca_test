package com.moca.platform.controller;
import com.moca.platform.CacheLayer.RedisCacheService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final RedisCacheService redisCache;

    public HealthController(RedisCacheService redisCache) {
        this.redisCache = redisCache;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        body.put("service", "moca-platform");
        body.put("redis", redisStatus());
        return body;
    }

    private String redisStatus() {
        if (!redisCache.isAvailable()) {
            return "disabled";
        }
        try {
            redisCache.ping();
            return "ok";
        } catch (Exception e) {
            return "down";
        }
    }
}
