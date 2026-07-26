package com.moca.platform.Service.ai;

import com.moca.platform.Dto.ai.WhisperStatusDto;
import com.moca.platform.Dto.ai.WhisperTranscribeResponse;
import org.springframework.web.multipart.MultipartFile;

public interface WhisperUseCase {

    WhisperStatusDto status();

    WhisperTranscribeResponse transcribe(MultipartFile file);
}
