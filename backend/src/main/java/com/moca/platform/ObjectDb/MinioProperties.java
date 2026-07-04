package com.moca.platform.ObjectDb;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "minio")
public class MinioProperties {

    private String endpoint = "http://localhost:9000";
    private String accessKey = "moca_minio";
    private String secretKey = "moca_minio_dev";
    private String bucket = "moca-drawings";
    private boolean enabled = false;
    /** Remote team buckets usually exist already — do not auto-create unless local dev. */
    private boolean autoCreateBucket = false;
}
