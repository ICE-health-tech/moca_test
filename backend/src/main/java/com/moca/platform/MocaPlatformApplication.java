package com.moca.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;

@SpringBootApplication(exclude = RedisAutoConfiguration.class)
public class MocaPlatformApplication {

    public static void main(String[] args) {
        var pid = ProcessHandle.current().pid();
        System.out.println("Application PID: "+pid);
        SpringApplication.run(MocaPlatformApplication.class, args);
    }
}
