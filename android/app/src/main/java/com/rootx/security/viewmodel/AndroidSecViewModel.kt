package com.rootx.security.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.rootx.security.data.model.DeviceSecurityInfo
import com.rootx.security.data.model.InstalledApp
import com.rootx.security.util.DeviceInfoHelper
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AndroidSecViewModel @Inject constructor(
    application: Application,
) : AndroidViewModel(application) {

    private val _deviceInfo = MutableStateFlow(DeviceSecurityInfo())
    val deviceInfo: StateFlow<DeviceSecurityInfo> = _deviceInfo.asStateFlow()

    private val _installedApps = MutableStateFlow<List<InstalledApp>>(emptyList())
    val installedApps: StateFlow<List<InstalledApp>> = _installedApps.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _showSystemApps = MutableStateFlow(false)
    val showSystemApps: StateFlow<Boolean> = _showSystemApps.asStateFlow()

    val filteredApps: StateFlow<List<InstalledApp>> = combine(
        _installedApps, _searchQuery, _showSystemApps
    ) { apps, query, showSystem ->
        apps.filter { app ->
            (showSystem || !app.isSystemApp) &&
            (query.isEmpty() || app.appName.contains(query, ignoreCase = true) ||
             app.packageName.contains(query, ignoreCase = true))
        }.sortedByDescending { it.dangerousPermCount }
    }.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    init { loadData() }

    fun loadData() {
        viewModelScope.launch(Dispatchers.IO) {
            _isLoading.value = true
            try {
                _deviceInfo.value = DeviceInfoHelper.collect(getApplication())
                _installedApps.value = DeviceInfoHelper.getInstalledApps(getApplication())
            } catch (_: Exception) {}
            _isLoading.value = false
        }
    }

    fun setSearchQuery(q: String) { _searchQuery.value = q }
    fun toggleSystemApps() { _showSystemApps.value = !_showSystemApps.value }
}
