package com.rootx.security.data.api

import com.rootx.security.BuildConfig
import com.rootx.security.data.local.SettingsDataStore
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    // Default connects directly to local development host over Wi-Fi (192.168.1.6:3000).
    // Can also be overridden at runtime via Settings -> Backend URL.
    private const val DEFAULT_BASE_URL = "http://192.168.1.6:3000/"

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    /** Rewrites each request's scheme/host/port to the user-configured
     *  backend URL, if one has been set in Settings. */
    private fun backendUrlInterceptor(settingsDataStore: SettingsDataStore) =
        okhttp3.Interceptor { chain ->
            val original = chain.request()
            val override = try {
                runBlocking { settingsDataStore.backendUrl.first() }.trim()
            } catch (_: Exception) {
                ""
            }

            val overrideUrl = if (override.isNotBlank()) override.toHttpUrlOrNull() else null
            if (overrideUrl == null) {
                try {
                    chain.proceed(original)
                } catch (ioe: java.io.IOException) {
                    // Seamless failover to USB reverse forwarder (127.0.0.1:3000)
                    try {
                        val fallback = original.url.newBuilder()
                            .scheme("http")
                            .host("127.0.0.1")
                            .port(3000)
                            .build()
                        chain.proceed(original.newBuilder().url(fallback).build())
                    } catch (_: Exception) {
                        throw ioe
                    }
                }
            } else {
                val newUrl = original.url.newBuilder()
                    .scheme(overrideUrl.scheme)
                    .host(overrideUrl.host)
                    .port(overrideUrl.port)
                    .build()
                chain.proceed(original.newBuilder().url(newUrl).build())
            }
        }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        settingsDataStore: SettingsDataStore,
    ): OkHttpClient {
        val builder = OkHttpClient.Builder()
            .addInterceptor(backendUrlInterceptor(settingsDataStore))
            .addInterceptor(authInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)

        // Logs full request/response bodies, including the Authorization
        // bearer token — fine for a debug build's Logcat, a real leak in a
        // release build shipped to users. Only ever enabled in debug.
        if (BuildConfig.DEBUG) {
            builder.addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
        }

        return builder.build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(DEFAULT_BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): RootXApiService {
        return retrofit.create(RootXApiService::class.java)
    }
}
