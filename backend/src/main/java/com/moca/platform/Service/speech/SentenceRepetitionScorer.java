package com.moca.platform.Service.speech;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * MoCA sentence repetition scoring — mirrors frontend {@code scoreSentenceRepetition}.
 * 1 point when ≥85% of expected content words appear (ASR-tolerant, Vietnamese-normalized).
 */
@Component
public class SentenceRepetitionScorer {

    public record ScoreResult(int score, double matchRatio) {}

    public ScoreResult score(String expected, String transcript) {
        List<String> expWords = words(normalize(expected));
        List<String> gotWords = words(normalize(transcript));
        if (expWords.isEmpty() || gotWords.isEmpty()) {
            return new ScoreResult(0, 0.0);
        }

        int matched = 0;
        int j = 0;
        for (String word : expWords) {
            while (j < gotWords.size()) {
                String got = gotWords.get(j);
                if (got.equals(word) || got.contains(word) || word.contains(got)) {
                    matched++;
                    j++;
                    break;
                }
                j++;
            }
        }

        double ratio = (double) matched / expWords.size();
        return new ScoreResult(ratio >= 0.85 ? 1 : 0, ratio);
    }

    static String normalize(String s) {
        if (s == null) {
            return "";
        }
        String nfd = Normalizer.normalize(s.toLowerCase(), Normalizer.Form.NFD);
        return nfd
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replaceAll("[^\\w\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static List<String> words(String normalized) {
        if (normalized.isBlank()) {
            return List.of();
        }
        return Arrays.stream(normalized.split(" ")).filter(w -> !w.isBlank()).toList();
    }
}
