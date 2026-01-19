/**
 * Timezone helper for WIB (UTC+7)
 * Server mungkin menggunakan UTC, jadi kita perlu adjust ke WIB
 * 
 * PENTING: Database menyimpan waktu dalam UTC.
 * Saat query "hari ini" di WIB, kita perlu convert ke UTC range:
 * - 00:00:00 WIB = 17:00:00 UTC hari sebelumnya
 * - 23:59:59 WIB = 16:59:59 UTC hari yang sama
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
 * Get start of today in WIB as UTC Date for database query
 * 00:00:00 WIB = 17:00:00 UTC hari sebelumnya
 */
export const getStartOfTodayWIB = (): Date => {
    const wibNow = getWIBDate();
    const year = wibNow.getFullYear();
    const month = wibNow.getMonth();
    const day = wibNow.getDate();

    // 00:00 WIB = -7 jam dari UTC = 17:00 UTC hari sebelumnya
    return new Date(Date.UTC(year, month, day - 1, 17, 0, 0, 0));
};

/**
 * Get end of today in WIB as UTC Date for database query
 * 23:59:59 WIB = 16:59:59 UTC hari yang sama
 */
export const getEndOfTodayWIB = (): Date => {
    const wibNow = getWIBDate();
    const year = wibNow.getFullYear();
    const month = wibNow.getMonth();
    const day = wibNow.getDate();

    // 23:59:59 WIB = 16:59:59 UTC
    return new Date(Date.UTC(year, month, day, 16, 59, 59, 999));
};

/**
 * Get tomorrow start in WIB as UTC Date for database query
 * 00:00:00 WIB tomorrow = 17:00:00 UTC today
 */
export const getTomorrowStartWIB = (): Date => {
    const wibNow = getWIBDate();
    const year = wibNow.getFullYear();
    const month = wibNow.getMonth();
    const day = wibNow.getDate();

    // Tomorrow 00:00 WIB = today 17:00 UTC
    return new Date(Date.UTC(year, month, day, 17, 0, 0, 0));
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

