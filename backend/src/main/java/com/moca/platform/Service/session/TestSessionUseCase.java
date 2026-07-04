package com.moca.platform.Service.session;

import com.moca.platform.Dto.session.SubmitTestSessionRequest;
import com.moca.platform.Dto.session.TestSessionSummaryDto;
import java.util.UUID;

public interface TestSessionUseCase {

    TestSessionSummaryDto submit(SubmitTestSessionRequest request);

    byte[] loadDrawing(UUID sessionId, String answerKey);
}
