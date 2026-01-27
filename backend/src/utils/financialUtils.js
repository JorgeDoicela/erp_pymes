import { Decimal } from 'decimal.js';

// Configure Decimal for financial precision
// 20 digits of precision is more than enough for currency, but we want 2 decimal rounding by default for final results.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Handles financial calculations with decimal precision.
 */
export const financial = {
    /**
     * Converts a value to a Decimal.
     */
    from: (value) => new Decimal(value || 0),

    /**
     * Rounds a decimal to fixed precision (default 2).
     */
    round: (value, decimals = 2) => {
        return new Decimal(value).toDecimalPlaces(decimals).toNumber();
    },

    /**
     * Calculates percentage of a value.
     */
    percentage: (value, percent) => {
        return new Decimal(value).mul(new Decimal(percent)).div(100);
    },

    /**
     * Safely sums multiple values.
     */
    sum: (...values) => {
        return values.reduce((acc, val) => acc.plus(new Decimal(val || 0)), new Decimal(0));
    },

    /**
     * Safely subtracts multiple values from a base.
     */
    subtract: (base, ...values) => {
        return values.reduce((acc, val) => acc.minus(new Decimal(val || 0)), new Decimal(base || 0));
    },

    /**
     * Standard multiplication.
     */
    multiply: (a, b) => new Decimal(a).mul(new Decimal(b)),

    /**
     * Standard division.
     */
    divide: (a, b) => new Decimal(a).div(new Decimal(b))
};

export default financial;
