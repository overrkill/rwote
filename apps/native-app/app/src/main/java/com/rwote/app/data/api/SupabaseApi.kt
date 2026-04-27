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

object SupabaseApi {
    private const val BASE_URL = "https://joqxsbboxmkpcizasdbc.supabase.co"
    private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo"

    private lateinit var prefs: SharedPreferences
    private var accessToken: String? = null
    private var refreshToken: String? = null
    private var userId: String? = null
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
        tokenExpiry = prefs.getLong(KEY_EXPIRY, 0L)
    }

    private fun saveToken(token: String?, refresh: String?, uid: String?, expiry: Long) {
        prefs.edit().apply {
            if (token != null) putString(KEY_TOKEN, token) else remove(KEY_TOKEN)
            if (refresh != null) putString(KEY_REFRESH, refresh) else remove(KEY_REFRESH)
            if (uid != null) putString(KEY_USER_ID, uid) else remove(KEY_USER_ID)
            putLong(KEY_EXPIRY, expiry)
        }.apply()
    }

    fun clearToken() {
        accessToken = null
        refreshToken = null
        userId = null
        tokenExpiry = 0L
        saveToken(null, null, null, 0)
    }

    fun isLoggedIn() = accessToken != null && userId != null
    fun getUserId() = userId

    private suspend fun refreshTokenIfNeeded() {
        if (refreshToken != null && tokenExpiry > 0 && System.currentTimeMillis() > tokenExpiry - 60000) {
            try {
                val resp = client.post("$BASE_URL/auth/v1/token?grant_type=refresh_token") {
                    header("apikey", ANON_KEY)
                    contentType(ContentType.Application.Json)
                    setBody(RefreshRequest(refreshToken!!))
                }
                val data = resp.body<AuthResponse>()
                accessToken = data.accessToken
                refreshToken = data.refreshToken
                tokenExpiry = System.currentTimeMillis() + (data.expiresIn * 1000L)
                saveToken(data.accessToken, data.refreshToken, userId, tokenExpiry)
            } catch (e: Exception) {
                Log.w(TAG, "Token refresh failed", e)
            }
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
            saveToken(data.accessToken, data.refreshToken, userId, tokenExpiry)
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
            saveToken(data.accessToken, data.refreshToken, userId, tokenExpiry)
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

    suspend fun createNote(title: String, content: String, tags: List<String> = emptyList()): String {
        val uid = userId ?: throw Exception("Not authenticated")
        refreshTokenIfNeeded()
        val note = NoteRequest(UUID.randomUUID().toString(), uid, title, content, tags)
        val resp = client.post("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            contentType(ContentType.Application.Json)
            setBody(note)
        }
        return resp.body<NoteResponse>().id
    }

    suspend fun fetchNotes(): List<NoteData> {
        val uid = userId ?: throw Exception("Not authenticated")
        refreshTokenIfNeeded()
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
        refreshTokenIfNeeded()
        client.delete("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            parameter("id", "eq.$id")
        }
    }

    suspend fun updateNote(id: String, title: String, content: String) {
        refreshTokenIfNeeded()
        val body = mapOf("title" to title, "content" to content, "updated_at" to java.time.Instant.now().toString())
        client.patch("$BASE_URL/rest/v1/notes_v2") {
            header("apikey", ANON_KEY)
            headers { authHeaders().forEach { (k, v) -> append(k, v) } }
            contentType(ContentType.Application.Json)
            parameter("id", "eq.$id")
            setBody(body)
        }
    }
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
data class UserInfo(val id: String)

@Serializable
data class NoteRequest(
    val id: String,
    @SerialName("user_id") val userId: String,
    val title: String,
    val content: String? = null,
    val tags: List<String> = emptyList()
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