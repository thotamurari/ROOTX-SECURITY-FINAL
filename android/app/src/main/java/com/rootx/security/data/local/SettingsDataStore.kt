package com.rootx.security.data.local

import android.content.Context
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "rootx_settings")

/**
 * DataStore-backed settings — replaces the Zustand settingsStore + localStorage.
 */
@Singleton
class SettingsDataStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private object Keys {
        val DARK_THEME = booleanPreferencesKey("dark_theme")
        val NOTIFICATIONS = booleanPreferencesKey("notifications")
        val SOUND_ALERTS = booleanPreferencesKey("sound_alerts")
        val REAL_TIME_SCANNING = booleanPreferencesKey("real_time_scanning")
        val AUTO_BLOCK = booleanPreferencesKey("auto_block")
        val BACKEND_URL = stringPreferencesKey("backend_url")
    }

    val isDarkTheme: Flow<Boolean> = context.dataStore.data.map { it[Keys.DARK_THEME] ?: true }
    val notifications: Flow<Boolean> = context.dataStore.data.map { it[Keys.NOTIFICATIONS] ?: true }
    val soundAlerts: Flow<Boolean> = context.dataStore.data.map { it[Keys.SOUND_ALERTS] ?: false }
    val realTimeScanning: Flow<Boolean> = context.dataStore.data.map { it[Keys.REAL_TIME_SCANNING] ?: true }
    val autoBlock: Flow<Boolean> = context.dataStore.data.map { it[Keys.AUTO_BLOCK] ?: false }
    val backendUrl: Flow<String> = context.dataStore.data.map { it[Keys.BACKEND_URL] ?: "" }

    suspend fun setDarkTheme(value: Boolean) {
        context.dataStore.edit { it[Keys.DARK_THEME] = value }
    }

    suspend fun setNotifications(value: Boolean) {
        context.dataStore.edit { it[Keys.NOTIFICATIONS] = value }
    }

    suspend fun setSoundAlerts(value: Boolean) {
        context.dataStore.edit { it[Keys.SOUND_ALERTS] = value }
    }

    suspend fun setRealTimeScanning(value: Boolean) {
        context.dataStore.edit { it[Keys.REAL_TIME_SCANNING] = value }
    }

    suspend fun setAutoBlock(value: Boolean) {
        context.dataStore.edit { it[Keys.AUTO_BLOCK] = value }
    }

    suspend fun setBackendUrl(value: String) {
        context.dataStore.edit { it[Keys.BACKEND_URL] = value }
    }
}
