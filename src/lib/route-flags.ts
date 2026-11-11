/**
 * Classic Goal SIP lives at `/`. While V2 is the default entry, keep this off.
 */
export const CLASSIC_HOME_ENABLED = false;

/** Post-login and safe redirect fallback when classic home is off. */
export const DEFAULT_APP_HOME = CLASSIC_HOME_ENABLED ? "/" : "/2";
