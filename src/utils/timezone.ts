/**
 * Timezone helper for WIB (UTC+7)
 * Server mungkin menggunakan UTC, jadi kita perlu adjust ke WIB
 */

const WIB_OFFSET_HOURS = 7;

/**
 * Get current date/time in WIB timezone
 */
export const getWIBDate = (): Date => {
    const now = new Date();
    // Get UTC time, then add 7 hours for WIB
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (WIB_OFFSET_HOURS * 3600000));
};

/**
 * Get start of today in WIB (00:00:00 WIB)
 */
export const getStartOfTodayWIB = (): Date => {
    const wibNow = getWIBDate();
    wibNow.setHours(0, 0, 0, 0);
    return wibNow;
};

/**
 * Get end of today in WIB (23:59:59 WIB)
 */
export const getEndOfTodayWIB = (): Date => {
    const wibNow = getWIBDate();
    wibNow.setHours(23, 59, 59, 999);
    return wibNow;
};

/**
 * Get tomorrow start in WIB (00:00:00 WIB)
 */
export const getTomorrowStartWIB = (): Date => {
    const today = getStartOfTodayWIB();
    today.setDate(today.getDate() + 1);
    return today;
};

/**
 * Format date to YYYY-MM-DD in WIB
 */
export const formatDateWIB = (date: Date): string => {
    const wibDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (WIB_OFFSET_HOURS * 3600000));
    const year = wibDate.getFullYear();
    const month = String(wibDate.getMonth() + 1).padStart(2, '0');
    const day = String(wibDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
