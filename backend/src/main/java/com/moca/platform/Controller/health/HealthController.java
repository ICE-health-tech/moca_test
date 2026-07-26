package com.moca.platform.Controller.health;
import com.moca.platform.AiLayer.WhisperProperties;
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
    private final WhisperProperties whisper;

    public HealthController(RedisCacheService redisCache, WhisperProperties whisper) {
        this.redisCache = redisCache;
        this.whisper = whisper;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        body.put("service", "moca-platform");
        body.put("redis", redisStatus());
        body.put("whisper", whisper.isEnabled() ? whisper.getProvider() : "disabled");
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
