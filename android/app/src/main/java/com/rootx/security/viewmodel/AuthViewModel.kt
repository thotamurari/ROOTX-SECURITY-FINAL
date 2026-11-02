package com.rootx.security.viewmodel

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.rootx.security.data.api.RootXApiService
import com.rootx.security.data.local.SettingsDataStore
import com.rootx.security.data.model.RegisterSessionRequest
import com.rootx.security.data.model.UserProfile
import com.rootx.security.util.DeviceIdentity
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val settingsDataStore: SettingsDataStore,
    private val api: RootXApiService,
    @ApplicationContext private val context: Context,
) : ViewModel() {

    private val auth: FirebaseAuth? = try {
        FirebaseAuth.getInstance()
    } catch (e: Exception) {
        null
    }

    private val _user = MutableStateFlow<UserProfile?>(null)
    val user: StateFlow<UserProfile?> = _user.asStateFlow()

    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    val isDarkTheme: StateFlow<Boolean> = settingsDataStore.isDarkTheme
        .stateIn(viewModelScope, SharingStarted.Eagerly, true)

    init {
        // Listen for Firebase auth state changes
        if (auth != null) {
            auth.addAuthStateListener { firebaseAuth ->
                val fbUser = firebaseAuth.currentUser
                if (fbUser != null) {
                    _user.value = UserProfile(
                        id = fbUser.uid,
                        email = fbUser.email ?: "",
                        plan = "free",
                        createdAt = fbUser.metadata?.creationTimestamp?.toString() ?: "",
                    )
                    _isAuthenticated.value = true
                } else {
                    _user.value = null
                    _isAuthenticated.value = false
                }
                _isLoading.value = false
            }
        } else {
            _isLoading.value = false
        }
    }

    fun loginWithEmail(email: String, password: String) {
        viewModelScope.launch {
            if (auth == null) {
                _error.value = "Authentication service unavailable"
                return@launch
            }
            val cleanEmail = email.trim().lowercase()
            try {
                _isLoading.value = true
                _error.value = null
                auth.signInWithEmailAndPassword(cleanEmail, password).await()
            } catch (e: Exception) {
                val msg = (e.message ?: "").lowercase()
                if (msg.contains("user-not-found") || msg.contains("no user record")) {
                    try {
                        auth.createUserWithEmailAndPassword(cleanEmail, password).await()
                    } catch (createErr: Exception) {
                        _error.value = createErr.localizedMessage ?: "Login failed"
                    }
                } else {
                    _error.value = e.localizedMessage ?: "Invalid email or password"
                }
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun registerWithEmail(email: String, password: String) {
        viewModelScope.launch {
            if (auth == null) {
                _error.value = "Authentication service unavailable"
                return@launch
            }
            try {
                _isLoading.value = true
                _error.value = null
                auth.createUserWithEmailAndPassword(email, password).await()
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Registration failed"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun signInWithGoogleToken(idToken: String) {
        viewModelScope.launch {
            if (auth == null) {
                _error.value = "Authentication service unavailable"
                return@launch
            }
            try {
                _isLoading.value = true
                _error.value = null
                val credential = GoogleAuthProvider.getCredential(idToken, null)
                auth.signInWithCredential(credential).await()
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Google sign-in failed"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun resetPassword(email: String) {
        viewModelScope.launch {
            if (auth == null) {
                _error.value = "Authentication service unavailable"
                return@launch
            }
            try {
                _error.value = null
                auth.sendPasswordResetEmail(email).await()
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "Reset failed"
            }
        }
    }

    fun logout() {
        auth?.signOut()
        _user.value = null
        _isAuthenticated.value = false
    }

    fun toggleTheme() {
        viewModelScope.launch {
            settingsDataStore.setDarkTheme(!isDarkTheme.value)
        }
    }

    fun clearError() { _error.value = null }
}
