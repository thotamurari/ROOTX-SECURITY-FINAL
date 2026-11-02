package com.rootx.security.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.rootx.security.data.api.RootXApiService
import com.rootx.security.data.model.DeviceSecurityInfo
import com.rootx.security.data.model.InstalledApp
import com.rootx.security.util.DeviceInfoHelper
import com.rootx.security.data.sync.ScanCloudSyncManager
import com.rootx.security.data.model.ScanResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    application: Application,
    private val api: RootXApiService,
    private val scanSyncManager: ScanCloudSyncManager,
) : AndroidViewModel(application) {

    val syncedScans: StateFlow<List<ScanResult>> = scanSyncManager.syncedScans

    private val _deviceInfo = MutableStateFlow(DeviceSecurityInfo())
    val deviceInfo: StateFlow<DeviceSecurityInfo> = _deviceInfo.asStateFlow()

    private val _securityScore = MutableStateFlow(0)
    val securityScore: StateFlow<Int> = _securityScore.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadDeviceData()
    }

    fun loadDeviceData() {
        viewModelScope.launch(Dispatchers.IO) {
            _isLoading.value = true
            try {
                val info = DeviceInfoHelper.collect(getApplication())
                _deviceInfo.value = info
                _securityScore.value = calculateSecurityScore(info)
            } catch (_: Exception) { }
            _isLoading.value = false
        }
    }

    private fun calculateSecurityScore(info: DeviceSecurityInfo): Int {
        var score = 100
        if (info.isRooted) score -= 30
        if (info.isAdbEnabled) score -= 10
        if (info.dangerousAppsCount > 5) score -= 15
        if (info.dangerousAppsCount > 10) score -= 10
        if (info.batteryLevel < 15) score -= 5
        if (info.sdkVersion < 30) score -= 10
        if (info.securityPatch == "N/A") score -= 10
        return score.coerceIn(0, 100)
    }
}
