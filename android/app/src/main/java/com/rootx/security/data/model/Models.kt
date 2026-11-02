package com.rootx.security.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String = "",
    val email: String = "",
    val plan: String = "free",
    val createdAt: String = "",
)

@Serializable
data class ScanResult(
    val id: String = "",
    val type: String = "", // "url" | "file" | "message"
    val input: String = "",
    val status: String = "pending", // "pending"|"scanning"|"clean"|"suspicious"|"threat"|"unverified"|"error"
    val score: Int = 0,
    val verdict: String = "", // human-readable summary line
    val verdictLabel: String = "", // "SAFE" | "SUSPICIOUS" | "PHISHING" | "UNVERIFIED"
    val threats: List<ThreatDetail> = emptyList(),
    val engines: List<EngineResult> = emptyList(),
    val timestamp: String = "",
    val rawTimestamp: String = "",
)

@Serializable
data class ThreatDetail(
    val name: String = "",
    val severity: String = "low",
    val description: String = "",
)

@Serializable
data class EngineResult(
    val name: String = "",
    val status: String = "", // "clean" | "threat" | "error" | "timeout"
    val detail: String = "",
)

@Serializable
data class ScanUrlRequest(val url: String)

@Serializable
data class ScanMessageRequest(val message: String, val context: String = "sms")

@Serializable
data class RegisterSessionRequest(
    val deviceId: String,
    val deviceName: String,
    val platform: String = "android",
)

// ── Backend scan response contract ──
// Mirrors exactly what safeopen-backend/src/routes/scan.routes.ts actually
// returns (see mapScan() / the in-memory anonymous-scan builder there) —
// NOT the same shape as the UI's ScanResult below. Deserializing the real
// API response directly into ScanResult silently produced an empty/default
// result on every successful scan (status stayed "pending", score 0, verdict
// "") because none of ScanResult's field names match the backend's JSON
// (type vs scanType, status vs threatLevel, score vs riskScore, verdict
// doesn't exist on the backend at all). toUiScanResult() below does the real
// mapping.
@Serializable
data class BackendIndicator(
    val name: String = "",
    val severity: String = "low",
    val description: String = "",
)

@Serializable
data class BackendGeminiVerdict(
    val label: String = "",
    val riskScore: Int = 0,
    val confidence: Int = 0,
    val reasons: List<String> = emptyList(),
    val summary: String = "",
)

@Serializable
data class BackendAiAnalysis(
    val summary: String = "",
    val verdict: String = "", // "SAFE" | "SUSPICIOUS" | "PHISHING" | "UNVERIFIED"
    val geminiVerdict: BackendGeminiVerdict? = null,
    val confidence: Int = 0,
    val details: List<String> = emptyList(),
    val recommendation: String = "",
)

@Serializable
data class BackendScanResult(
    val id: String = "",
    val scanType: String = "",
    val input: String = "",
    val riskScore: Int = 0,
    val threatLevel: String = "safe",
    val threatType: String? = null,
    // Clear top-level verdict added by the backend scan pipeline.
    val verdict: String = "",
    val indicators: List<BackendIndicator> = emptyList(),
    val recommendations: List<String> = emptyList(),
    val aiAnalysis: BackendAiAnalysis? = null,
    val scanDuration: Int = 0,
    val scannedAt: String = "",
)

fun BackendScanResult.toUiScanResult(): ScanResult {
    // Prefer the backend's explicit verdict (SAFE / SUSPICIOUS / PHISHING /
    // UNVERIFIED); fall back to threatLevel for older responses.
    val label = verdict.ifBlank { aiAnalysis?.verdict ?: "" }.uppercase().ifBlank {
        when (threatLevel) {
            "safe" -> "SAFE"
            "critical", "danger" -> "PHISHING"
            "caution" -> "SUSPICIOUS"
            else -> "UNVERIFIED"
        }
    }
    val uiStatus = when (label) {
        "SAFE" -> "clean"
        "PHISHING" -> "threat"
        "SUSPICIOUS" -> "suspicious"
        else -> "unverified"
    }
    val verdictText = aiAnalysis?.summary?.takeIf { it.isNotBlank() }
        ?: indicators.firstOrNull()?.description
        ?: "No additional details available."

    // Show high/critical/medium indicators (so Gemini's "medium" suspicious
    // reasons surface), plus each specific Gemini reason as its own line.
    val indicatorThreats = indicators
        .filter { it.severity == "high" || it.severity == "critical" || it.severity == "medium" }
        .map { ThreatDetail(name = it.name, severity = it.severity, description = it.description) }
    val geminiThreats = (aiAnalysis?.geminiVerdict?.reasons ?: emptyList())
        .map { ThreatDetail(name = "RootX-AI (Gemini)", severity = if (label == "PHISHING") "critical" else "medium", description = it) }
    val threatDetails = (indicatorThreats + geminiThreats).distinctBy { it.description }

    return ScanResult(
        id = id,
        type = scanType,
        input = input,
        status = uiStatus,
        score = riskScore,
        verdict = verdictText,
        verdictLabel = label,
        threats = threatDetails,
        engines = emptyList(),
        timestamp = formatScanTimeAgo(scannedAt),
        rawTimestamp = scannedAt,
    )
}

fun parseScanEpoch(timestamp: String, id: String = ""): Long {
    if (timestamp.startsWith("20")) {
        try {
            val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).apply {
                timeZone = java.util.TimeZone.getTimeZone("UTC")
            }
            return format.parse(timestamp)?.time ?: 0L
        } catch (_: Exception) {}
    }
    val digits = id.filter { it.isDigit() }
    if (digits.length >= 13) {
        try {
            return digits.take(13).toLong()
        } catch (_: Exception) {}
    }
    if (timestamp.equals("Just now", ignoreCase = true)) {
        return System.currentTimeMillis()
    }
    return 0L
}

fun formatScanTimeAgo(isoString: String): String {
    if (!isoString.startsWith("20")) return isoString.ifBlank { "Recently" }
    return try {
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val date = format.parse(isoString) ?: return "Just now"
        val diffMs = System.currentTimeMillis() - date.time
        val diffMinutes = Math.abs(diffMs) / (1000 * 60)
        when {
            diffMinutes < 1 -> "Just now"
            diffMinutes < 60 -> "${diffMinutes}m ago"
            diffMinutes < 1440 -> "${diffMinutes / 60}h ago"
            else -> "${diffMinutes / 1440}d ago"
        }
    } catch (_: Exception) {
        "Recently"
    }
}

@Serializable
data class InstalledApp(
    val packageName: String = "",
    val appName: String = "",
    val versionName: String = "",
    val versionCode: Long = 0,
    val isSystemApp: Boolean = false,
    val installedAt: Long = 0,
    val permissions: List<String> = emptyList(),
    val dangerousPermCount: Int = 0,
    val installer: String = "",
    val riskLevel: String = "Safe",
    val riskScore: Int = 0,
    val riskExplanation: String = "",
)

@Serializable
data class DeviceSecurityInfo(
    val model: String = "",
    val manufacturer: String = "",
    val androidVersion: String = "",
    val sdkVersion: Int = 0,
    val securityPatch: String = "",
    val isRooted: Boolean = false,
    val isAdbEnabled: Boolean = false,
    val isEncrypted: Boolean = false,
    val totalStorage: Long = 0,
    val freeStorage: Long = 0,
    val totalRam: Long = 0,
    val availableRam: Long = 0,
    val batteryLevel: Int = 0,
    val isCharging: Boolean = false,
    val cpuAbi: String = "",
    val fingerprint: String = "",
    val installedAppsCount: Int = 0,
    val systemAppsCount: Int = 0,
    val userAppsCount: Int = 0,
    val dangerousAppsCount: Int = 0,
)

@Serializable
data class NewsItem(
    val id: String = "",
    val title: String = "",
    val summary: String = "",
    val content: String = "",
    val date: String = "",
    val source: String = "",
    val url: String? = null,
    val severity: String = "medium", // low|medium|high|critical
    val category: String = "",
)

@Serializable
data class NewsFeedResponse(
    val items: List<NewsItem> = emptyList(),
    val fetchedAt: String? = null,
    val nextRefresh: String? = null,
)

@Serializable
data class ChatMessage(
    val role: String = "user", // "user" | "assistant"
    val content: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val feedback: Int = 0, // 0 = none, 1 = thumbs up, -1 = thumbs down
)


@Serializable
data class AIChatRequest(
    val message: String,
    val deviceContext: String = "",
    val history: List<ChatMessage> = emptyList(),
)

@Serializable
data class AIChatResponse(
    val success: Boolean = true,
    val response: String = "",
    val model: String = "gemini-2.0-flash",
    val timestamp: Long = System.currentTimeMillis(),
)

@Serializable
data class BehaviorProfile(
    val riskScore: Int = 0,
    val anomalyCount: Int = 0,
    val lastUpdated: String = "",
)

@Serializable
data class TrackerConnection(
    val id: String = "",
    val domain: String = "",
    val ip: String = "",
    val country: String = "",
    val countryCode: String = "",
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val isBlocked: Boolean = false,
    val protocol: String = "",
    val timestamp: String = "",
)

@Serializable
data class CommunityReport(
    val id: String = "",
    val type: String = "",
    val value: String = "",
    val description: String = "",
    val votes: Int = 0,
    val timestamp: String = "",
)

@Serializable
data class PaginatedResponse<T>(
    val data: List<T> = emptyList(),
    val page: Int = 1,
    val totalPages: Int = 1,
    val total: Int = 0,
)

@Serializable
data class UserSettingsDto(
    val darkMode: Boolean? = null,
    val notifications: Boolean? = null,
    val soundAlerts: Boolean? = null,
    val realTimeScanning: Boolean? = null,
    val autoBlock: Boolean? = null,
    val updatedAt: String? = null,
    val userId: String? = null,
)

@Serializable
data class SettingsUpdateResponse(
    val success: Boolean = false,
    val settings: UserSettingsDto? = null,
)

@Serializable
data class GenericApiResponse(
    val success: Boolean = false,
    val message: String = "",
)
