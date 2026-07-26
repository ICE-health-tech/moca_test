package com.moca.platform.Dto.speech;

public record TranscribeResponse(
        boolean available,
        String transcript,
        String provider,
        String language,
        Integer score,
        Double matchRatio,
        String message) {

    public static TranscribeResponse unavailable(String message) {
        return new TranscribeResponse(false, "", "none", null, null, null, message);
    }

    public static TranscribeResponse ok(
            String transcript, String provider, String language, Integer score, Double matchRatio) {
        return new TranscribeResponse(true, transcript, provider, language, score, matchRatio, null);
    }
}
