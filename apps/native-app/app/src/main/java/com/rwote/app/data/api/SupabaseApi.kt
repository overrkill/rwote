package com.rwote.app.data.api

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import kotlinx.serialization.json.*
import java.util.UUID

private const val TAG = "SupabaseApi"
private const val PREFS = "rwote_prefs"
private const val KEY_TOKEN = "access_token"
private const val KEY_REFRESH = "refresh_token"
private const val KEY_USER_ID = "user_id"
private const val KEY_EXPIRY = "token_expiry"
private const val KEY_EMAIL = "email"

object SupabaseApi {
    private const val BASE_URL = "https://joqxsbboxmkpcizasdbc.supabase.co"
    private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo"

    private lateinit var prefs: SharedPreferences
    private var accessToken: String? = null
    private var refreshToken: String? = null
    private var userId: String? = null
    private var userEmail: String? = null
    private var tokenExpiry: Long = 0L

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val client = HttpClient(Android) {
        install(ContentNegotiation) { json(json) }
    }

    fun init(ctx: Context) {
        prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        loadToken()
    }

    private fun loadToken() {
        accessToken = prefs.getString(KEY_TOKEN, null)
        refreshToken = prefs.getString(KEY_REFRESH, null)
        userId = prefs.getString(KEY_USER_ID, null)
        userEmail = prefs.getString(KEY_EMAIL, null)
        tokenExpiry = prefs.getLong(KEY_EXPIRY, 0L)
    }

    private fun saveToken(token: String?, refresh: String?, uid: String?, email: String?, expiry: Long) {
        prefs.edit().apply {
            if (token != null) putString(KEY_TOKEN, token) else remove(KEY_TOKEN)
            if (refresh != null) putString(KEY_REFRESH, refresh) else remove(KEY_REFRESH)
            if (uid != null) putString(KEY_USER_ID, uid) else remove(KEY_USER_ID)
            if (email != null) putString(KEY_EMAIL, email) else remove(KEY_EMAIL)
            putLong(KEY_EXPIRY, expiry)
        }.apply()
    }

    fun clearToken() {
        accessToken = null
        refreshToken = null
        userId = null
        userEmail = null
        tokenExpiry = 0L
        saveToken(null, null, null, null, 0)
    }

    fun isLoggedIn() = accessToken != null && userId != null
    fun getUserId() = userId
    fun getEmail() = userEmail

    private suspend fun refreshTokenIfNeeded(): Boolean {
        if (refreshToken == null || tokenExpiry <= 0) return false

        if (System.currentTimeMillis() < tokenExpiry - 5000) return true

        Log.d(TAG, "Attempting token refresh")

        // First attempt
        var result = tryRefreshToken()
        if (result) return true

        // Retry once on network failure
        result = tryRefreshToken()
        return result
    }

    private suspend fun tryRefreshToken(): Boolean {
        return try {
            val resp = client.post("$BASE_URL/auth/v1/token?grant_type=refresh_token") {
                header("apikey", ANON_KEY)
                contentType(ContentType.Application.Json)
                setBody(RefreshRequest(refreshToken!!))
            }

            // Check HTTP status before parsing
            if (!resp.status.isSuccess()) {
                val errorBody = try { resp.body<AuthErrorResponse>() } catch (_: Exception) { null }
                val isAuthError = resp.status.value == 401 || errorBody?.error == "invalid_grant"

                Log.w(TAG, "Token refresh failed with status ${resp.status.value}, isAuthError=$isAuthError")

                if (isAuthError) {
                    clearToken()
                }
                return false
            }

            val data = resp.body<AuthResponse>()
            accessToken = data.accessToken

            // Handle null refresh token - keep existing if not provided
            val newRefreshToken = data.refreshToken ?: refreshToken
            if (newRefreshToken != null) {
                refreshToken = newRefreshToken
            }

            tokenExpiry = System.currentTimeMillis() + (data.expiresIn * 1000L)
            saveToken(data.accessToken, newRefreshToken, userId, userEmail, tokenExpiry)

            Log.d(TAG, "Token refresh successful, new expiry in ${data.expiresIn}s")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Token refresh exception: ${e.message}")
            false
        }
    }

    private fun authHeaders() = accessToken?.let { mapOf("Authorization" to "Bearer $it") } ?: emptyMap()

    sealed class AuthResult {
        data class Success(val accessToken: String, val userId: String, val email: String) : AuthResult()
        data class Error(val message: String) : AuthResult()
    }

    suspend fun signUp(email: String, password: String): AuthResult {
        return try {
            val body = SignUpRequest(email, password)
            val resp = client.post("$BASE_URL/auth/v1/signup") {
                header("apikey", ANON_KEY)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            val data = resp.body<AuthResponse>()
            accessToken = data.accessToken
            refreshToken = data.refreshToken
            tokenExpiry = System.currentTimeMillis() + (data.expiresIn * 1000L)
            userId = data.user?.id ?: parseUserId(data.accessToken)
            userEmail = email
            saveToken(data.accessToken, data.refreshToken, userId, userEmail, tokenExpiry)
            AuthResult.Success(data.accessToken, userId!!, email)
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Sign up failed")
        }
    }

    suspend fun signIn(email: String, password: String): AuthResult {
        return try {
            Log.d(TAG, "signIn: $email")
            val body = SignInRequest(email, password)
            val resp = client.post("$BASE_URL/auth/v1/token?grant_type=password") {
                header("apikey", ANON_KEY)
                contentType(ContentType.Application.Json)
                setBody(body)
            }
            val data = resp.body<AuthResponse>()
            accessToken = data.accessToken
            refreshToken = data.refreshToken
            tokenExpiry = System.currentTimeMillis() + (data.expiresIn * 1000L)
            userId = data.user?.id ?: parseUserId(data.accessToken)
            userEmail = email
            saveToken(data.accessToken, data.refreshToken, userId, userEmail, tokenExpiry)
            AuthResult.Success(data.accessToken, userId!!, email)
        } catch (e: Exception) {
            Log.e(TAG, "signIn failed", e)
            AuthResult.Error(e.message ?: "Sign in failed")
        }
    }

    suspend fun signOut() {
        try {
            refreshToken?.let {
                client.post("$BASE_URL/auth/v1/logout") {
                    header("apikey", ANON_KEY)
                    contentType(ContentType.Application.Json)
                    setBody(RefreshRequest(it))
                }
            }
        } catch (_: Exception) { }
        clearToken()
    }

    private fun parseUserId(token: String): String {
        return try {
            val parts = token.split(".")
            if (parts.size >= 2) {
                val payload = String(java.util.Base64.getDecoder().decode(parts[1]))
                json.parseToJsonElement(payload).jsonObject["sub"]?.jsonPrimitive?.content
                    ?: throw Exception("No sub in token")
            } else throw Exception("Invalid token")
        } catch (e: Exception) {
            throw Exception("No user id")
        }
    }

    suspend fun createNote(title: String, content: String, tags: List<String> = emptyList(), sourceUrl: String? = null): String {
        val uid = userId ?: throw Exception("Not authenticated")
        if (!refreshTokenIfNeeded()) throw Exception("Session expired")
        val note = NoteRequest(UUID.randomUUID().toString(), uid, title, content, tags, sourceUrl)
        val noteId = note.id
        client.post("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            header("Accept", "application/json")
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            contentType(ContentType.Application.Json)
            setBody(note)
        }
        return noteId
    }

    suspend fun fetchNotes(): List<NoteData> {
        val uid = userId ?: throw Exception("Not authenticated")
        if (!refreshTokenIfNeeded()) throw Exception("Session expired")
        val resp = client.get("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            parameter("user_id", "eq.$uid")
            parameter("order", "created_at.desc")
            parameter("limit", 100)
        }
        return resp.body()
    }

    suspend fun deleteNote(id: String) {
        if (!refreshTokenIfNeeded()) throw Exception("Session expired")
        client.delete("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            parameter("id", "eq.$id")
        }
    }

    suspend fun updateNote(id: String, title: String, content: String, tags: List<String> = emptyList()) {
        if (!refreshTokenIfNeeded()) throw Exception("Session expired")
        val body = NoteUpdateRequest(title, content, tags, java.time.Instant.now().toString())
        client.patch("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            contentType(ContentType.Application.Json)
            parameter("id", "eq.$id")
            setBody(body)
        }
    }

    @Serializable
    data class NoteUpdateRequest(
        val title: String,
        val content: String,
        val tags: List<String>,
        val updated_at: String
    )
}

@Serializable
data class SignUpRequest(val email: String, val password: String)

@Serializable
data class SignInRequest(val email: String, val password: String, val grantType: String = "password")

@Serializable
data class RefreshRequest(val refreshToken: String)

@Serializable
data class AuthResponse(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String? = null,
    @SerialName("expires_in") val expiresIn: Int = 3600,
    val user: UserInfo? = null
)

@Serializable
data class AuthErrorResponse(
    val error: String? = null,
    val errorDescription: String? = null
)

@Serializable
data class UserInfo(val id: String)

@Serializable
data class NoteRequest(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    val content: String? = null,
    val tags: List<String> = emptyList(),
    @SerialName("source_url") val sourceUrl: String? = null
)

@Serializable
data class NoteResponse(val id: String)

@Serializable
data class NoteData(
    val id: String,
    @SerialName("user_id") val userId: String? = null,
    val title: String,
    val content: String? = null,
    val tags: List<String> = emptyList(),
    @SerialName("pinned") val pinned: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)