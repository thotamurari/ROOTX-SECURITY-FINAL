package com.rootx.security.data.api

import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import com.rootx.security.util.DeviceIdentity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * OkHttp interceptor that injects the Firebase ID token and this device's
 * stable id into every request, matching what the React axios interceptor
 * does (Authorization + X-Device-Id — see src/services/axios.ts). The
 * device id lets authMiddleware on the backend enforce remote logout for
 * this device from Settings → Active Devices.
 */
@Singleton
class AuthInterceptor @Inject constructor(
    @ApplicationContext private val context: Context,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val user = FirebaseAuth.getInstance().currentUser

        val token = if (user != null) {
            try {
                runBlocking { user.getIdToken(false).await().token }
            } catch (_: Exception) { null }
        } else null

        val builder = original.newBuilder()
            .header("X-Device-Id", DeviceIdentity.getId(context))
        if (token != null) {
            builder.header("Authorization", "Bearer $token")
        }

        return chain.proceed(builder.build())
    }
}
