/**
 * @ppos/shared-infra - Sanitization Utils
 * 
 * Reusable regex patterns and logic for cleaning system metadata.
 */

const PATH_PATTERNS = {
    WINDOWS: /[A-Z]:\\[^ "]+/gi,
    UNIX_SYSTEM: /\/[^ "]*\/ppos-[^ "]+/gi,
    UNIX_TEMP: /\/tmp\/[^ "]+/gi
};

const TOKENS = {
    LOCAL_PATH: '[REDACTED_LOCAL_PATH]',
    SYSTEM_PATH: '[REDACTED_SYSTEM_PATH]',
    TEMP_PATH: '[REDACTED_TEMP_PATH]'
};

function redactPaths(text) {
    if (typeof text !== 'string') return text;

    let sanitized = text;
    sanitized = sanitized.replace(PATH_PATTERNS.WINDOWS, TOKENS.LOCAL_PATH);
    sanitized = sanitized.replace(PATH_PATTERNS.UNIX_SYSTEM, TOKENS.SYSTEM_PATH);
    sanitized = sanitized.replace(PATH_PATTERNS.UNIX_TEMP, TOKENS.TEMP_PATH);

    return sanitized;
}

module.exports = {
    PATH_PATTERNS,
    TOKENS,
    redactPaths
};
