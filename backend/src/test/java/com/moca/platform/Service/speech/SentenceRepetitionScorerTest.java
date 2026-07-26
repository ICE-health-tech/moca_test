package com.moca.platform.Service.speech;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SentenceRepetitionScorerTest {

    SentenceRepetitionScorer scorer;

    @BeforeEach
    void setUp() {
        scorer = new SentenceRepetitionScorer();
    }

    @Test
    void scoresOne_whenMostWordsMatch() {
        var result = scorer.score(
                "Con mèo ngồi trên tấm thảm",
                "con meo ngoi tren tam tham");
        assertThat(result.score()).isEqualTo(1);
        assertThat(result.matchRatio()).isGreaterThanOrEqualTo(0.85);
    }

    @Test
    void scoresZero_whenFewWordsMatch() {
        var result = scorer.score("Con mèo ngồi trên tấm thảm", "xin chao cac ban");
        assertThat(result.score()).isEqualTo(0);
    }

    @Test
    void scoresZero_whenEmptyTranscript() {
        assertThat(scorer.score("hello world", "").score()).isEqualTo(0);
    }
}
