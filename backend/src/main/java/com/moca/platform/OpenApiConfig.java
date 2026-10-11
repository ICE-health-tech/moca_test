package com.moca.platform;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "MoCA Platform API",
                version = "0.1.0",
                description =
                        "MoCA cognitive assessment platform — patient tests, clinician review queue, AI/Whisper assist"
        ),
        servers = {@Server(url = "/", description = "Current host")}
)
public class OpenApiConfig {}
