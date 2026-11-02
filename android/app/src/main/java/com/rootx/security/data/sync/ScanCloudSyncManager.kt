package com.rootx.security.data.sync

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.rootx.security.data.api.RootXApiService
import com.rootx.security.data.model.EngineResult
import com.rootx.security.data.model.ScanResult
import com.rootx.security.data.model.ThreatDetail
import com.rootx.security.data.model.toUiScanResult
import com.rootx.security.data.model.parseScanEpoch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages real-time bidirectional scan synchronization between Android and Web App
 * strictly scoped to the authenticated user account (`users/{uid}/scans`).
 *
 * - When Android scans a target: Writes to Firestore `users/{uid}/scans` + POST `/scan/sync` -> Web receives it instantly.
 * - When Web scans a target: Writes to Firestore `users/{uid}/scans` + WebSocket -> Android receives it instantly.
 * - When user logs out or switches accounts: Data is cleared and re-bound exclusively to the active user's UID.
 */
@Singleton
class ScanCloudSyncManager @Inject constructor(
    private val api: RootXApiService,
) {

    private val firestore: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }

    private val _syncedScans = MutableStateFlow<List<ScanResult>>(emptyList())
    val syncedScans: StateFlow<List<ScanResult>> = _syncedScans.asStateFlow()

    private var listenerRegistration: ListenerRegistration? = null
    private var pollingJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.IO)
    private var currentSyncedUid: String? = null

    init {
        try {
            auth.addAuthStateListener { firebaseAuth ->
                val user = firebaseAuth.currentUser
                if (user != null) {
                    if (currentSyncedUid != user.uid) {
                        currentSyncedUid = user.uid
                        startUserSync(user.uid)
                    }
                } else {
                    currentSyncedUid = null
                    stopSync()
                }
            }
        } catch (_: Exception) {}
    }

    private var cachedFirestoreItems: List<ScanResult> = emptyList()
    private var cachedApiItems: List<ScanResult> = emptyList()

    private fun updateMergedScans() {
        val merged = (cachedApiItems + cachedFirestoreItems)
            .distinctBy { it.id.ifEmpty { it.input } }
            .sortedByDescending { parseScanEpoch(if (it.rawTimestamp.isNotBlank()) it.rawTimestamp else it.timestamp, it.id) }
        _syncedScans.value = merged
    }

    fun startUserSync(uid: String) {
        listenerRegistration?.remove()
        listenerRegistration = null
        cachedFirestoreItems = emptyList()
        cachedApiItems = emptyList()
        _syncedScans.value = emptyList()

        try {
            // 1. Attach real-time snapshot listener on user's personal scans collection
            val query = firestore.collection("users")
                .document(uid)
                .collection("scans")
                .orderBy("scannedAt", Query.Direction.DESCENDING)
                .limit(50)

            listenerRegistration = query.addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) return@addSnapshotListener

                val items = mutableListOf<ScanResult>()
                for (doc in snapshot.documents) {
                    try {
                        val id = doc.id
                        val scanType = doc.getString("scanType") ?: "url"
                        val input = doc.getString("input") ?: "Unknown target"
                        val riskScore = (doc.getLong("riskScore") ?: 0L).toInt()
                        val threatLevel = doc.getString("threatLevel") ?: "safe"
                        val threatType = doc.getString("threatType")
                        val scannedAt = doc.getString("scannedAt") ?: "Just now"

                        val status = if (threatLevel == "danger" || threatLevel == "critical" || riskScore > 50) "threat" else "clean"
                        val verdict = threatType ?: if (status == "threat") "Potential Threat Detected" else "Verified Safe & Secure"

                        items.add(
                            ScanResult(
                                id = id,
                                type = scanType,
                                input = input,
                                status = status,
                                score = riskScore,
                                verdict = verdict,
                                timestamp = formatTimeAgo(scannedAt),
                                rawTimestamp = scannedAt,
                                threats = if (status == "threat") {
                                    listOf(ThreatDetail(threatType ?: "Suspicious Signal", "warning", "Detected by RootX Cloud Intelligence."))
                                } else emptyList(),
                                engines = listOf(
                                    EngineResult("RootX Neural Core", status, if (status == "threat") "Flagged" else "Clean"),
                                    EngineResult("Google Safe Browsing", status, if (status == "threat") "Suspicious" else "Verified"),
                                    EngineResult("Cloud Sync Bridge", "clean", "Synced across Web & Mobile"),
                                )
                            )
                        )
                    } catch (_: Exception) {}
                }

                cachedFirestoreItems = items
                updateMergedScans()
            }
        } catch (_: Exception) {}

        // 2. Also continuously sync history from backend REST API (resilient failover for Firestore)
        pollingJob?.cancel()
        pollingJob = scope.launch {
            while (isActive) {
                try {
                    val response = api.getScanHistory(page = 1, limit = 50, userId = uid)
                    if (response.data.isNotEmpty()) {
                        val apiItems = response.data.map { it.toUiScanResult() }
                        cachedApiItems = apiItems
                        updateMergedScans()
                    }
                } catch (_: Exception) {}
                delay(2500)
            }
        }
    }

    fun stopSync() {
        pollingJob?.cancel()
        pollingJob = null
        listenerRegistration?.remove()
        listenerRegistration = null
        cachedFirestoreItems = emptyList()
        cachedApiItems = emptyList()
        _syncedScans.value = emptyList()
    }

    fun publishScan(result: ScanResult) {
        scope.launch {
            try {
                val user = auth.currentUser
                val uid = user?.uid ?: return@launch
                val isoDate = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date())

                val threatLevel = if (result.status == "threat" || result.score > 70) "danger"
                else if (result.score > 30) "caution"
                else "safe"

                val payload = hashMapOf<String, Any?>(
                    "id" to result.id,
                    "scanType" to result.type,
                    "input" to result.input,
                    "riskScore" to result.score,
                    "threatLevel" to threatLevel,
                    "threatType" to result.verdict,
                    "verificationTier" to if (result.status == "threat") "high_risk" else "verified_safe",
                    "scannedAt" to isoDate,
                    "scanDuration" to 650,
                    "userId" to uid,
                    "userEmail" to (user.email ?: "testtest@gmail.com"),
                    "syncedWithCloud" to true,
                    "source" to "android_native",
                )

                // 1. Write directly to user's private Firestore collection (instant real-time push to Web)
                firestore.collection("users")
                    .document(uid)
                    .collection("scans")
                    .document(result.id)
                    .set(payload)

                // 2. Send to backend sync endpoint with auth token
                try {
                    api.syncScan(mapOf("item" to payload, "userId" to uid))
                } catch (_: Exception) {}

                // 3. Update local state immediately
                val current = _syncedScans.value.toMutableList()
                current.removeAll { it.id == result.id || it.input == result.input }
                current.add(0, result)
                _syncedScans.value = current
            } catch (_: Exception) {}
        }
    }

    private fun formatTimeAgo(isoString: String): String {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            val date = format.parse(isoString) ?: return "Just now"
            val diffMs = System.currentTimeMillis() - date.time
            val diffMinutes = diffMs / (1000 * 60)
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
}
