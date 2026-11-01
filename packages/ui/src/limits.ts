/** 1 crore in rupees. */
export const CRORE = 1_00_00_000;

/** Highest rupee amount a calculator input accepts (₹999 Cr). */
export const MONEY_INPUT_MAX = 999 * CRORE;

/** Result layouts are built to show up to ₹9999 Cr in full INR. */
export const MONEY_OUTPUT_MAX = 9999 * CRORE;

/** Tenure, horizon, policy term, and other year inputs. */
export const YEARS_MAX = 100;

/** 100 years of months. */
export const MONTHS_MAX = YEARS_MAX * 12;

/** 100 years of days (365-day year, matching the MF vs FD horizon). */
export const DAYS_MAX = YEARS_MAX * 365;
