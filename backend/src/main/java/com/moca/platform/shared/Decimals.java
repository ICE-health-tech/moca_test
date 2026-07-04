package com.moca.platform.shared;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** LOGIC: One place for score + money precision.
 *    First → always create BigDecimal from String (never double).
 *    Then → apply scale + HALF_UP before save or return.
 *    So → same input always gives same output — no float drift. */
public final class Decimals {

    public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    public static final int SCORE_SCALE = 0;
    public static final int MONEY_SCALE = 2;

    private Decimals() {
    }

    public static BigDecimal score(long value) {
        return BigDecimal.valueOf(value).setScale(SCORE_SCALE, ROUNDING);
    }

    public static BigDecimal score(String value) {
        return new BigDecimal(value).setScale(SCORE_SCALE, ROUNDING);
    }

    public static BigDecimal money(String value) {
        return new BigDecimal(value).setScale(MONEY_SCALE, ROUNDING);
    }

    public static BigDecimal zeroScore() {
        return BigDecimal.ZERO.setScale(SCORE_SCALE, ROUNDING);
    }

    public static BigDecimal normalizeScore(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(SCORE_SCALE, ROUNDING);
    }
}
