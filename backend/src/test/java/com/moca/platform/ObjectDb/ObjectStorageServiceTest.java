package com.moca.platform.ObjectDb;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * ObjectStorageService tests — pure Mockito, no Spring context.
 *
 * <p>Flow: mock MinioClient → call service → assert result or exception.
 */
class ObjectStorageServiceTest {

    MinioClient client;
    MinioProperties props;
    ObjectStorageService service;

    @BeforeEach
    void setUp() {
        client = mock(MinioClient.class);
        props = new MinioProperties();
        props.setBucket("moca-test");
        service = new ObjectStorageService(client, props);
    }

    @Nested
    class PutPng {

        @Test
        void uploadsSuccessfully() throws Exception {
            byte[] data = {1, 2, 3};

            service.putPng("drawing/abc.png", data);

            verify(client).putObject((PutObjectArgs) any());
        }

        @Test
        void throwsIllegalState_whenMinioFails() throws Exception {
            doThrow(new RuntimeException("connection refused"))
                    .when(client).putObject(any(PutObjectArgs.class));

            assertThatThrownBy(() -> service.putPng("drawing/abc.png", new byte[]{1}))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("drawing/abc.png");
        }
    }

    @Nested
    class GetObject {

        @Test
        void returnsBytes() throws Exception {
            byte[] expected = {10, 20, 30};
            GetObjectResponse response = mock(GetObjectResponse.class);
            when(response.readAllBytes()).thenReturn(expected);
            when(client.getObject(any(GetObjectArgs.class))).thenReturn(response);

            byte[] result = service.getObject("drawing/abc.png");

            assertThat(result).containsExactly(10, 20, 30);
        }

        @Test
        void throwsIllegalState_whenMinioFails() throws Exception {
            when(client.getObject(any(GetObjectArgs.class)))
                    .thenThrow(new RuntimeException("not found"));

            assertThatThrownBy(() -> service.getObject("drawing/missing.png"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("drawing/missing.png");
        }
    }

    @Nested
    class PresignedGetUrl {

        @Test
        void returnsUrl() throws Exception {
            String expected = "https://minio.test/obj?token=abc";
            when(client.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn(expected);

            String result = service.presignedGetUrl("drawing/abc.png", Duration.ofHours(1));

            assertThat(result).isEqualTo(expected);
        }

        @Test
        void throwsIllegalState_whenMinioFails() throws Exception {
            when(client.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenThrow(new RuntimeException("token expired"));

            assertThatThrownBy(() -> service.presignedGetUrl("drawing/abc.png", Duration.ofHours(1)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("drawing/abc.png");
        }
    }

    @Nested
    class Bucket {

        @Test
        void returnsConfiguredBucketName() {
            assertThat(service.bucket()).isEqualTo("moca-test");
        }
    }
}
