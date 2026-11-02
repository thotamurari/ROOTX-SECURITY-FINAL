package com.rootx.security.data.api

import com.rootx.security.data.model.*
import retrofit2.http.*

/**
 * Retrofit interface matching the safeopen-backend REST API.
 * Same endpoints the React app calls via axios.
 */
interface RootXApiService {

    // ── Auth ──
    @GET("auth/me")
    suspend fun getMe(): UserProfile

    @POST("auth/logout")
    suspend fun logout()

    @POST("auth/sessions/register")
    suspend fun registerSession(@Body request: RegisterSessionRequest)

    @PUT("auth/email")
    suspend fun updateEmail(@Body request: Map<String, String>): GenericApiResponse

    @GET("auth/settings")
    suspend fun getSettings(@Query("userId") userId: String? = null): UserSettingsDto

    @PUT("auth/settings")
    suspend fun updateSettings(@Body settings: UserSettingsDto): SettingsUpdateResponse

    // ── Scan ──
    // Returns BackendScanResult (the real API contract), not the UI's
    // ScanResult — see Models.kt's toUiScanResult() for why.
    @POST("scan/url")
    suspend fun scanUrl(@Body request: ScanUrlRequest): BackendScanResult

    @Multipart
    @POST("scan/file")
    suspend fun scanFile(@Part file: okhttp3.MultipartBody.Part): BackendScanResult

    @POST("scan/message")
    suspend fun scanMessage(@Body request: ScanMessageRequest): BackendScanResult

    @POST("scan/sync")
    suspend fun syncScan(@Body payload: Map<String, @JvmSuppressWildcards Any?>): Map<String, Any?>

    @GET("scan/history")
    suspend fun getScanHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("userId") userId: String? = null,
    ): PaginatedResponse<BackendScanResult>

    @GET("scan/result/{id}")
    suspend fun getScanResult(@Path("id") id: String): BackendScanResult

    // ── News ──
    @GET("news/feed")
    suspend fun getNewsFeed(): NewsFeedResponse

    @POST("news/refresh")
    suspend fun refreshNews(): NewsFeedResponse

    // ── Behavior ──
    @GET("behavior/profile")
    suspend fun getBehaviorProfile(): BehaviorProfile

    // ── Tracker ──
    @GET("tracker/connections")
    suspend fun getTrackerConnections(): List<TrackerConnection>

    // ── Community ──
    @GET("community/feed")
    suspend fun getCommunityFeed(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
    ): PaginatedResponse<CommunityReport>

    @POST("community/report")
    suspend fun submitReport(@Body report: CommunityReport): CommunityReport

    // ── RootX-AI ──
    @POST("rootx-ai/message")
    suspend fun queryAi(@Body request: AIChatRequest): AIChatResponse
}
