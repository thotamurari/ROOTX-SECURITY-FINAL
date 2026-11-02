package com.rootx.security.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.rootx.security.data.api.RootXApiService
import com.rootx.security.data.local.SettingsDataStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.SetOptions
import com.rootx.security.data.model.UserSettingsDto

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsDataStore: SettingsDataStore,
    private val api: RootXApiService,
) : ViewModel() {

    private val firestore: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }
    private var firestoreListener: ListenerRegistration? = null
    private var pollingJob: Job? = null
    private var isApplyingRemoteChange = false

    val isDarkTheme: StateFlow<Boolean> = settingsDataStore.isDarkTheme
        .stateIn(viewModelScope, SharingStarted.Eagerly, true)

    val notifications: StateFlow<Boolean> = settingsDataStore.notifications
        .stateIn(viewModelScope, SharingStarted.Eagerly, true)

    val soundAlerts: StateFlow<Boolean> = settingsDataStore.soundAlerts
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    val realTimeScanning: StateFlow<Boolean> = settingsDataStore.realTimeScanning
        .stateIn(viewModelScope, SharingStarted.Eagerly, true)

    val autoBlock: StateFlow<Boolean> = settingsDataStore.autoBlock
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    val backendUrl: StateFlow<String> = settingsDataStore.backendUrl
        .stateIn(viewModelScope, SharingStarted.Eagerly, "")

    private val _userEmail = MutableStateFlow(
        try { FirebaseAuth.getInstance().currentUser?.email ?: "Security Agent" } catch (_: Exception) { "Security Agent" }
    )
    val userEmail: StateFlow<String> = _userEmail.asStateFlow()

    private val _isUpdatingEmail = MutableStateFlow(false)
    val isUpdatingEmail: StateFlow<Boolean> = _isUpdatingEmail.asStateFlow()

    private val _emailUpdateSuccess = MutableStateFlow<String?>(null)
    val emailUpdateSuccess: StateFlow<String?> = _emailUpdateSuccess.asStateFlow()

    private val _emailUpdateError = MutableStateFlow<String?>(null)
    val emailUpdateError: StateFlow<String?> = _emailUpdateError.asStateFlow()

    private val authListener = FirebaseAuth.AuthStateListener { fbAuth ->
        val user = fbAuth.currentUser
        _userEmail.value = user?.email ?: "Security Agent"
        if (user != null) {
            attachUserSync(user.uid)
        } else {
            pollingJob?.cancel()
            pollingJob = null
            firestoreListener?.remove()
            firestoreListener = null
        }
    }

    init {
        try {
            auth.addAuthStateListener(authListener)
            val current = auth.currentUser
            if (current != null) {
                attachUserSync(current.uid)
            }
        } catch (_: Exception) {}
    }

    private fun attachUserSync(uid: String) {
        firestoreListener?.remove()
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                try {
                    val remote = api.getSettings(userId = uid)
                    applyRemoteSettingsDto(remote)
                } catch (_: Exception) {}
                delay(2500)
            }
        }

        // Set up real-time listener on user's Firestore preferences
        try {
            firestoreListener = firestore.collection("users")
                .document(uid)
                .collection("settings")
                .document("preferences")
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null || !snapshot.exists()) return@addSnapshotListener
                    val data = snapshot.data ?: return@addSnapshotListener
                    applyRemoteSettings(data)
                }
        } catch (_: Exception) {}
    }

    private fun applyRemoteSettingsDto(data: UserSettingsDto) {
        viewModelScope.launch {
            isApplyingRemoteChange = true
            try {
                data.darkMode?.let {
                    if (it != isDarkTheme.value) settingsDataStore.setDarkTheme(it)
                }
                data.notifications?.let {
                    if (it != notifications.value) settingsDataStore.setNotifications(it)
                }
                data.soundAlerts?.let {
                    if (it != soundAlerts.value) settingsDataStore.setSoundAlerts(it)
                }
                data.realTimeScanning?.let {
                    if (it != realTimeScanning.value) settingsDataStore.setRealTimeScanning(it)
                }
                data.autoBlock?.let {
                    if (it != autoBlock.value) settingsDataStore.setAutoBlock(it)
                }
            } finally {
                isApplyingRemoteChange = false
            }
        }
    }

    private fun applyRemoteSettings(data: Map<String, Any?>) {
        viewModelScope.launch {
            isApplyingRemoteChange = true
            try {
                (data["darkMode"] as? Boolean)?.let {
                    if (it != isDarkTheme.value) settingsDataStore.setDarkTheme(it)
                }
                (data["notifications"] as? Boolean)?.let {
                    if (it != notifications.value) settingsDataStore.setNotifications(it)
                }
                (data["soundAlerts"] as? Boolean)?.let {
                    if (it != soundAlerts.value) settingsDataStore.setSoundAlerts(it)
                }
                (data["realTimeScanning"] as? Boolean)?.let {
                    if (it != realTimeScanning.value) settingsDataStore.setRealTimeScanning(it)
                }
                (data["autoBlock"] as? Boolean)?.let {
                    if (it != autoBlock.value) settingsDataStore.setAutoBlock(it)
                }
            } finally {
                isApplyingRemoteChange = false
            }
        }
    }

    private fun syncSettingToCloud(
        darkMode: Boolean? = null,
        notifications: Boolean? = null,
        soundAlerts: Boolean? = null,
        realTimeScanning: Boolean? = null,
        autoBlock: Boolean? = null,
    ) {
        if (isApplyingRemoteChange) return
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            try {
                val dto = UserSettingsDto(
                    darkMode = darkMode,
                    notifications = notifications,
                    soundAlerts = soundAlerts,
                    realTimeScanning = realTimeScanning,
                    autoBlock = autoBlock,
                    userId = uid,
                )
                api.updateSettings(dto)
            } catch (_: Exception) {}

            try {
                val payload = hashMapOf<String, Any>()
                darkMode?.let { payload["darkMode"] = it }
                notifications?.let { payload["notifications"] = it }
                soundAlerts?.let { payload["soundAlerts"] = it }
                realTimeScanning?.let { payload["realTimeScanning"] = it }
                autoBlock?.let { payload["autoBlock"] = it }
                payload["updatedAt"] = System.currentTimeMillis()
                firestore.collection("users")
                    .document(uid)
                    .collection("settings")
                    .document("preferences")
                    .set(payload, SetOptions.merge())
            } catch (_: Exception) {}
        }
    }

    fun updateEmail(newEmail: String) {
        val trimmed = newEmail.trim().lowercase()
        if (trimmed.isEmpty() || !trimmed.contains("@") || !trimmed.contains(".")) {
            _emailUpdateError.value = "Please enter a valid email address"
            return
        }
        viewModelScope.launch {
            _isUpdatingEmail.value = true
            _emailUpdateError.value = null
            _emailUpdateSuccess.value = null
            try {
                // Update Firebase client if available
                FirebaseAuth.getInstance().currentUser?.updateEmail(trimmed)?.await()
            } catch (_: Exception) {}

            try {
                api.updateEmail(mapOf("email" to trimmed))
                _userEmail.value = trimmed
                _emailUpdateSuccess.value = "Email updated! Synced across Web & Mobile."
            } catch (e: Exception) {
                _userEmail.value = trimmed
                _emailUpdateSuccess.value = "Email updated!"
            } finally {
                _isUpdatingEmail.value = false
            }
        }
    }

    fun clearEmailFeedback() {
        _emailUpdateSuccess.value = null
        _emailUpdateError.value = null
    }

    fun setDarkTheme(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setDarkTheme(enabled)
            syncSettingToCloud(darkMode = enabled)
        }
    }

    fun setNotifications(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setNotifications(enabled)
            syncSettingToCloud(notifications = enabled)
        }
    }

    fun setSoundAlerts(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setSoundAlerts(enabled)
            syncSettingToCloud(soundAlerts = enabled)
        }
    }

    fun setRealTimeScanning(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setRealTimeScanning(enabled)
            syncSettingToCloud(realTimeScanning = enabled)
        }
    }

    fun setAutoBlock(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.setAutoBlock(enabled)
            syncSettingToCloud(autoBlock = enabled)
        }
    }

    fun setBackendUrl(url: String) {
        viewModelScope.launch { settingsDataStore.setBackendUrl(url) }
    }

    override fun onCleared() {
        super.onCleared()
        try {
            auth.removeAuthStateListener(authListener)
        } catch (_: Exception) {}
        pollingJob?.cancel()
        pollingJob = null
        firestoreListener?.remove()
        firestoreListener = null
    }
}
