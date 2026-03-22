// ─── Permission Risk Calculator ─────────────
export const DANGEROUS_PERMISSIONS = [
    'READ_SMS', 'SEND_SMS', 'RECEIVE_SMS',
    'RECORD_AUDIO',
    'ACCESS_FINE_LOCATION', 'ACCESS_BACKGROUND_LOCATION',
    'READ_CONTACTS', 'WRITE_CONTACTS',
    'CAMERA',
    'READ_CALL_LOG', 'WRITE_CALL_LOG',
    'PROCESS_OUTGOING_CALLS',
    'BIND_DEVICE_ADMIN',
    'SYSTEM_ALERT_WINDOW',
    'WRITE_SETTINGS',
    'INSTALL_PACKAGES',
    'READ_PHONE_STATE',
    'CHANGE_NETWORK_STATE',
    'BLUETOOTH_ADMIN',
    'MANAGE_EXTERNAL_STORAGE',
] as const

// Mismatches: apps requesting permissions they clearly don't need
const CATEGORY_MISMATCHES: Record<string, string[]> = {
    Flashlight: ['READ_CONTACTS', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION'],
    Calculator: ['CAMERA', 'READ_CONTACTS', 'ACCESS_FINE_LOCATION'],
    Utility: ['READ_SMS', 'SEND_SMS', 'READ_CALL_LOG'],
}

export function calculatePermissionRisk(
    permissions: string[],
    dangerous: string[],
    category: string
): number {
    let score = 0

    // Base score from dangerous permission count
    score += dangerous.length * 8

    // Context mismatch — app doesn't need this permission
    const appMismatches = CATEGORY_MISMATCHES[category] || []
    const suspiciousPerms = dangerous.filter((p) => appMismatches.includes(p))
    score += suspiciousPerms.length * 15

    // Critical combos (very suspicious)
    if (dangerous.includes('RECORD_AUDIO') && dangerous.includes('ACCESS_FINE_LOCATION')) score += 20
    if (dangerous.includes('READ_SMS') && dangerous.includes('SEND_SMS')) score += 25
    if (dangerous.includes('BIND_DEVICE_ADMIN')) score += 30
    if (dangerous.includes('INSTALL_PACKAGES')) score += 20

    return Math.min(100, score)
}
