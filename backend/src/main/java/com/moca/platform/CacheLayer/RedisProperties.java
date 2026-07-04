package com.moca.platform.CacheLayer;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "redis")
public class RedisProperties {

    private boolean enabled = false;
    private String host = "redis.duylong.art";
    private int port = 6379;
    private String password = "";
    private boolean ssl = true;
}
