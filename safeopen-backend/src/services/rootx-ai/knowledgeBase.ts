/**
 * Curated, Versioned Mobile Cybersecurity Knowledge Base for RootX-AI
 * Version: 2.4.0 (2026 Mobile Threat Landscape)
 */

export interface SecurityKnowledgeEntry {
    id: string
    category: 'permissions' | 'malware' | 'hardware' | 'network' | 'remediation' | 'compliance'
    title: string
    keywords: string[]
    summary: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    evidenceIndicators: string[]
    remediationSteps: string[]
    limitations: string
}

export const SECURITY_KNOWLEDGE_BASE: SecurityKnowledgeEntry[] = [
    {
        id: 'kb-perm-accessibility',
        category: 'permissions',
        title: 'Android Accessibility Service Misuse (A11y Abuse)',
        keywords: ['accessibility', 'bind_accessibility_service', 'keystroke', 'screen reader', 'overlay'],
        summary: 'Accessibility services have legitimate uses for disabled users, but are the #1 attack vector for banking trojans (e.g. SharkBot, Hook, Octo). Malware abuses this permission to perform UI injection, auto-grant permissions, log keystrokes, and read OTPs from the screen.',
        riskLevel: 'CRITICAL',
        evidenceIndicators: [
            'Non-accessibility app requesting BIND_ACCESSIBILITY_SERVICE',
            'Installed from non-official store or browser sideload',
            'Automated taps or window change events observed'
        ],
        remediationSteps: [
            'Immediately navigate to Android Settings > Accessibility > Downloaded Apps.',
            'Turn OFF accessibility permission for any untrusted application.',
            'Uninstall the application completely via the APK Scanner or Android Settings.',
            'Review bank account or password manager sessions.'
        ],
        limitations: 'RootX-AI detects apps requesting or holding accessibility declarations, but Android SELinux sandboxing prevents direct interception of another app’s active accessibility event stream.'
    },
    {
        id: 'kb-perm-device-admin',
        category: 'permissions',
        title: 'Device Administrator Privilege Hijacking',
        keywords: ['device admin', 'bind_device_admin', 'lock screen', 'wipe data', 'uninstall prevention'],
        summary: 'Device Admin privileges allow an application to set password rules, lock the device, or wipe data. Malicious apps (ransomware, stalkerware) register as device admin to prevent users from uninstalling them through normal means.',
        riskLevel: 'CRITICAL',
        evidenceIndicators: [
            'App requests BIND_DEVICE_ADMIN without enterprise MDM affiliation',
            'Uninstall button in Android Settings is greyed out or redirects to lockscreen',
            'App presents fake security scan results demanding admin activation'
        ],
        remediationSteps: [
            'Go to Android Settings > Security & Privacy > More Security Settings > Device Admin Apps.',
            'Locate the suspicious app and toggle "Deactivate".',
            'Once deactivated, uninstall the app normally in Settings > Apps.'
        ],
        limitations: 'Deactivation requires explicit user action in system settings; third-party apps cannot revoke admin status programmatically.'
    },
    {
        id: 'kb-perm-sms-calls',
        category: 'permissions',
        title: 'SMS & Call Log Interception (Financial 2FA Theft)',
        keywords: ['sms', 'read_sms', 'receive_sms', 'call log', 'otp', 'two factor', '2fa', 'verification code'],
        summary: 'READ_SMS, RECEIVE_SMS, and READ_CALL_LOG allow direct access to 2FA verification codes, bank transactional alerts, and private communications. Google Play restricts these to default SMS handlers; apps sideloaded via APK frequently exploit them.',
        riskLevel: 'HIGH',
        evidenceIndicators: [
            'Calculator, flashlight, cleaner, or utility app requesting SMS permissions',
            'App not set as default SMS app requesting RECEIVE_SMS',
            'Background network activity following incoming SMS broadcast'
        ],
        remediationSteps: [
            'Open Android Settings > Apps > Special App Access / Permission Manager > SMS.',
            'Ensure ONLY your official messaging app (e.g. Google Messages / Samsung Messages) has access.',
            'Switch financial 2FA from SMS to hardware security keys or authenticator apps (TOTP).'
        ],
        limitations: 'Android 10+ restricts background SMS reads for non-default handlers, but malicious foreground services or overlay tricks can still capture notifications.'
    },
    {
        id: 'kb-perm-overlay',
        category: 'permissions',
        title: 'System Alert Window & Screen Overlay Attacks',
        keywords: ['overlay', 'system_alert_window', 'draw over other apps', 'display over other apps', 'clickjacking'],
        summary: 'SYSTEM_ALERT_WINDOW allows apps to render floating windows over other applications. Attackers use this for "Cloak & Dagger" or overlay attacks: placing a transparent fake login prompt over a banking app or credential dialog to steal credentials.',
        riskLevel: 'HIGH',
        evidenceIndicators: [
            'App requests "Display over other apps" without floating UI need (e.g. games, cleaners)',
            'Prompt appears when opening sensitive financial or email apps',
            'Unusual touch lag or misregistered taps'
        ],
        remediationSteps: [
            'Navigate to Settings > Apps > Special App Access > Display over other apps.',
            'Revoke overlay permission for any app you do not explicitly need floating widgets for.'
        ],
        limitations: 'Android 12+ blocks touches through untrusted overlays for sensitive system dialogs, but third-party app views may still be targeted if not using FLAG_SECURE.'
    },
    {
        id: 'kb-root-integrity',
        category: 'hardware',
        title: 'Root Privilege & Bootloader Integrity Assessment',
        keywords: ['root', 'rooted', 'superuser', 'magisk', 'su binary', 'bootloader', 'unlocked', 'safetynet'],
        summary: 'Rooting unlocks full system partition modification by bypassing Android’s Linux DAC/MAC access controls and SELinux enforcement. While powerful for developers, it compromises device sandboxing, allowing any compromised app to access other apps’ private SQLite databases, keystore secrets, and tokens.',
        riskLevel: 'HIGH',
        evidenceIndicators: [
            'Presence of su binary (/system/bin/su, /system/xbin/su, /sbin/su)',
            'Superuser or Magisk management packages installed',
            'Build test-keys in system properties or unlocked bootloader state'
        ],
        remediationSteps: [
            'For maximum security, re-lock the bootloader and flash the manufacturer official firmware.',
            'If root is intentional for research, enforce Magisk DenyList / Zygisk isolation and strict per-app root approval.'
        ],
        limitations: 'Modern root-hiding modules (Shamiko, KernelSU) can conceal root indicators from user-space checks.'
    },
    {
        id: 'kb-adb-debugging',
        category: 'hardware',
        title: 'USB / Wireless ADB Debugging Exposure',
        keywords: ['adb', 'debugging', 'developer options', 'usb debugging', 'wireless debugging'],
        summary: 'ADB (Android Debug Bridge) allows deep shell access to the device via USB or local Wi-Fi port 5555. If left enabled, connecting to public charging kiosks (juice jacking) or an untrusted Wi-Fi network exposes the device to unauthorized APK installation, screen mirroring, and file extraction.',
        riskLevel: 'MEDIUM',
        evidenceIndicators: [
            'Settings.Global.ADB_ENABLED is set to 1',
            'Developer options enabled with persistent USB debugging active'
        ],
        remediationSteps: [
            'Open Android Settings > System > Developer options.',
            'Turn OFF "USB debugging" and "Wireless debugging" when not actively developing.',
            'Revoke USB debugging authorizations to invalidate old PC pairing keys.'
        ],
        limitations: 'ADB requires host RSA authorization, but physical access or malicious computers previously authorized can bypass on-screen prompts.'
    },
    {
        id: 'kb-ram-storage-optimization',
        category: 'hardware',
        title: 'Hardware Resource Pressure & Memory Management',
        keywords: ['ram', 'memory', 'storage', 'space', 'disk', 'slow', 'lag', 'hang', 'cleaner'],
        summary: 'Android uses a low-memory killer (LMK) daemon to terminate cached background apps when available RAM falls below minfree thresholds. Excessive storage utilization (>85%) severely degrades flash NAND write endurance and prevents TRIM operations, causing noticeable UI stutter.',
        riskLevel: 'LOW',
        evidenceIndicators: [
            'RAM utilization > 85% or available memory < 1 GB',
            'Storage utilization > 85% or free storage < 5 GB',
            'Frequent foreground app reloads when multitasking'
        ],
        remediationSteps: [
            'Keep at least 15% internal flash storage free to maintain optimal file system read/write performance.',
            'Clear application cache (Settings > Storage > Cached data) for heavy video or social apps.',
            'Reboot the device weekly to purge orphaned socket handles and transient memory leaks.',
            'Avoid aggressive task-killer apps, which cause extra CPU drain when apps repeatedly restart.'
        ],
        limitations: 'Android manages RAM dynamically; high used RAM is normal Linux behavior (caching) unless free RAM drops below critical thresholds.'
    },
    {
        id: 'kb-battery-thermal',
        category: 'hardware',
        title: 'Battery Longevity & Thermal Throttling',
        keywords: ['battery', 'charge', 'temp', 'thermal', 'heat', 'drain', 'overheat', 'health'],
        summary: 'Lithium-ion cells degrade fastest at high voltage (>80% charge) and elevated temperatures (>38°C). Fast charging while running graphics-intensive workloads causes thermal throttling, reducing CPU frequency and accelerating cell impedance growth.',
        riskLevel: 'LOW',
        evidenceIndicators: [
            'Battery temperature > 38°C during charging or gaming',
            'Rapid battery drop in standby (>2% per hour without screen on)'
        ],
        remediationSteps: [
            'Maintain state of charge between 20% and 80% for maximum cycle life.',
            'Avoid gaming or streaming high-resolution video while connected to fast chargers.',
            'Audit background apps consuming battery in Settings > Battery > Battery Usage.'
        ],
        limitations: 'Operating systems estimate battery health through Coulomb counters; precise internal cell impedance requires laboratory hardware.'
    },
    {
        id: 'kb-phishing-url-defense',
        category: 'malware',
        title: 'Mobile Phishing & Deceptive URL Analysis',
        keywords: ['phishing', 'url', 'link', 'website', 'domain', 'scam', 'fraud', 'credential theft'],
        summary: 'Mobile screens truncate long URLs in mobile browser address bars and SMS previews, making users especially vulnerable to subdomain spoofing (e.g. `paypal.com.verify-security-login.xyz`). Malicious sites impersonate legitimate services to harvest credentials or session cookies.',
        riskLevel: 'HIGH',
        evidenceIndicators: [
            'Brand name positioned as subdomain on an unrelated registrar',
            'Newly registered domain (< 30 days old)',
            'No valid HTTPS or self-signed certificate on credential collection page',
            'Detections across global threat intelligence engines (VirusTotal, Google Safe Browsing)'
        ],
        remediationSteps: [
            'Scan any suspicious SMS or WhatsApp link using the RootX Scan Engine before visiting.',
            'Never enter credentials on websites reached via unprompted messages.',
            'Enable passkeys or hardware authenticators to neutralize credential harvesting.'
        ],
        limitations: 'Zero-hour phishing sites registered within minutes of an attack campaign may not yet appear on public threat blocklists.'
    },
    {
        id: 'kb-sideloaded-apk-risks',
        category: 'malware',
        title: 'Sideloaded APK Package Risks & Supply Chain Tampering',
        keywords: ['apk', 'sideload', 'install unknown apps', 'third party store', 'modded apk', 'cracked'],
        summary: 'Modded or cracked APKs downloaded from forums, Telegram channels, or unofficial websites frequently bundle commercial RATs (Remote Access Trojans) or adware into popular games and utility tools. They bypass Play Protect checks if developer warnings are dismissed.',
        riskLevel: 'HIGH',
        evidenceIndicators: [
            'Installer package is null, browser, or file manager (not Google Play or verified OEM store)',
            'Application is debuggable (android:debuggable="true" in manifest)',
            'Mismatched APK signing certificate compared to official developer signature'
        ],
        remediationSteps: [
            'Audit all sideloaded applications using the RootX APK Scanner.',
            'Disable "Install Unknown Apps" in Android Settings for browsers and file managers.',
            'Uninstall modded/cracked utilities and use official store releases.'
        ],
        limitations: 'Static APK analysis inspects manifests, permissions, and hashes; dynamic unpacking is required for heavily obfuscated droppers.'
    }
]

/**
 * Retrieves the most relevant knowledge base entries based on user question keywords.
 */
export function retrieveSecurityKnowledge(query: string, maxResults = 3): SecurityKnowledgeEntry[] {
    const q = query.toLowerCase()
    const tokens = q.split(/[\s,?.!]+/).filter(t => t.length > 2)

    const scored = SECURITY_KNOWLEDGE_BASE.map(entry => {
        let score = 0

        // Title match
        if (q.includes(entry.title.toLowerCase())) score += 15

        // Category match
        if (q.includes(entry.category)) score += 5

        // Keyword matches
        for (const kw of entry.keywords) {
            if (q.includes(kw)) score += 8
            for (const token of tokens) {
                if (kw.includes(token) || token.includes(kw)) score += 3
            }
        }

        return { entry, score }
    })

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(s => s.entry)
}

/**
 * Formats retrieved knowledge entries into a structured prompt section for AI grounding.
 */
export function formatKnowledgeForPrompt(entries: SecurityKnowledgeEntry[]): string {
    if (entries.length === 0) return ''

    return `\n═══ CURATED CYBERSECURITY KNOWLEDGE BASE (GROUNDING EVIDENCE) ═══\n` +
        entries.map(e => `[${e.title}] (Risk: ${e.riskLevel})\n` +
            `Summary: ${e.summary}\n` +
            `Key Indicators: ${e.evidenceIndicators.join('; ')}\n` +
            `Remediation: ${e.remediationSteps.join('; ')}\n` +
            `Known Limitations: ${e.limitations}`
        ).join('\n\n')
}
