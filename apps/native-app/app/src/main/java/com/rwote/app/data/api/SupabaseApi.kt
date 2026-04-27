package com.rwote.app.data.api

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Base64
import java.util.UUID

private const val TAG = "SupabaseApi"
private const val PREFS_NAME = "rwote_prefs"
private const val KEY_TOKEN = "access_token"
private const val KEY_REFRESH_TOKEN = "refresh_token"
private const val KEY_USER_ID = "user_id"
private const val KEY_TOKEN_EXPIRY = "token_expiry"

object SupabaseApi {
    private const val BASE_URL = "https://joqxsbboxmkpcizasdbc.supabase.co"
    private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo"

    private var accessToken: String? = null
    private var refreshToken: String? = null
    private var userId: String? = null
    private var tokenExpiry: Long = 0L
    private var prefs: SharedPreferences? = null

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadToken()
    }

    private fun loadToken() {
        prefs?.let { p ->
            accessToken = p.getString(KEY_TOKEN, null)
            refreshToken = p.getString(KEY_REFRESH_TOKEN, null)
            userId = p.getString(KEY_USER_ID, null)
            tokenExpiry = p.getLong(KEY_TOKEN_EXPIRY, 0L)
            Log.d(TAG, "loadToken: token=${accessToken != null}, uid=$userId, exp=$tokenExpiry")
        }
    }

    private fun saveToken(token: String?, refresh: String?, uid: String?, expiry: Long) {
        prefs?.edit()?.apply {
            if (token != null) putString(KEY_TOKEN, token) else remove(KEY_TOKEN)
            if (refresh != null) putString(KEY_REFRESH_TOKEN, refresh) else remove(KEY_REFRESH_TOKEN)
            if (uid != null) putString(KEY_USER_ID, uid) else remove(KEY_USER_ID)
            putLong(KEY_TOKEN_EXPIRY, expiry)
            apply()
        }
    }

    fun clearToken() {
        accessToken = null
        refreshToken = null
        userId = null
        tokenExpiry = 0L
        saveToken(null, null, null, 0L)
    }

    fun isLoggedIn(): Boolean = accessToken != null && userId != null

    fun getUserId(): String? = userId

    fun setToken(token: String?, refresh: String?, uid: String?, expiresIn: Int = 3600) {
        accessToken = token
        refreshToken = refresh
        userId = uid
        tokenExpiry = System.currentTimeMillis() + (expiresIn * 1000L)
        saveToken(token, refresh, uid, tokenExpiry)
        Log.d(TAG, "setToken: exp=$tokenExpiry")
    }

    private suspend fun request(
        method: String,
        endpoint: String,
        body: String? = null,
        retryRefresh: Boolean = true
    ): String = withContext(Dispatchers.IO) {
        var token = accessToken

        // Check if token expired or about to expire (within 60 seconds)
        if (token != null && tokenExpiry > 0 && System.currentTimeMillis() > tokenExpiry - 60000) {
            Log.d(TAG, "Token expiring soon, attempting refresh")
            try {
                refreshAccessToken()
                token = accessToken
            } catch (e: Exception) {
                Log.w(TAG, "Token refresh failed", e)
            }
        }

        val url = URL("$BASE_URL$endpoint")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method
        conn.setRequestProperty("apikey", ANON_KEY)
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Accept", "application/json")
        token?.let { conn.setRequestProperty("Authorization", "Bearer $it") }

        if (body != null) {
            conn.doOutput = true
            OutputStreamWriter(conn.outputStream).use { it.write(body) }
        }

        val response = conn.responseCode
        val responseBody = if (response in 200..299) {
            conn.inputStream.bufferedReader().readText()
        } else {
            conn.errorStream?.bufferedReader()?.readText() ?: ""
        }

        if (response !in 200..299) {
            Log.w(TAG, "request error: $response $responseBody")
            throw Exception("Request failed: $response")
        }

        responseBody
    }

    sealed class AuthResult {
        data class Success(val accessToken: String, val userId: String, val email: String) : AuthResult()
        data class Error(val message: String) : AuthResult()
    }

    suspend fun signUp(email: String, password: String): AuthResult {
        return try {
            val body = """{"email":"$email","password":"$password"}"""
            val response = request("POST", "/auth/v1/signup", body)
            val token = parseAccessToken(response)
            val refresh = parseRefreshToken(response)
            val expiresIn = parseExpiresIn(response)
            val uid = parseUserId(token, response)
            setToken(token, refresh, uid, expiresIn)
            AuthResult.Success(token, uid, email)
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Sign up failed")
        }
    }

    private suspend fun refreshAccessToken(): String {
        val refresh = refreshToken ?: throw Exception("No refresh token")
        val body = """{"refresh_token":"$refresh"}"""
        val response = request("POST", "/auth/v1/token?grant_type=refresh_token", body, retryRefresh = false)
        val newToken = parseAccessToken(response)
        val newRefresh = parseRefreshToken(response)
        val expiresIn = parseExpiresIn(response)
        setToken(newToken, newRefresh, userId, expiresIn)
        return newToken
    }

    suspend fun signIn(email: String, password: String): AuthResult {
        return try {
            Log.d(TAG, "signIn called for $email")
            val body = """{"email":"$email","password":"$password","grant_type":"password"}"""
            val response = request("POST", "/auth/v1/token?grant_type=password", body)
            Log.d(TAG, "signIn response: ${response.take(200)}")
            val token = parseAccessToken(response)
            val refresh = parseRefreshToken(response)
            val expiresIn = parseExpiresIn(response)
            val uid = parseUserId(token, response)
            Log.d(TAG, "parsed token, uid: $uid")
            setToken(token, refresh, uid, expiresIn)
            AuthResult.Success(token, uid, email)
        } catch (e: Exception) {
            Log.e(TAG, "signIn failed", e)
            AuthResult.Error(e.message ?: "Sign in failed")
        }
    }

    suspend fun signOut() {
        try {
            refreshToken?.let { rt ->
                val body = """{"refresh_token":"$rt"}"""
                request("POST", "/auth/v1/logout", body)
            }
        } catch (_: Exception) { }
        setToken(null, null, null, 0)
    }

    private fun parseAccessToken(json: String): String {
        return try {
            JSONObject(json).getString("access_token")
        } catch (e: Exception) {
            throw Exception("No access token")
        }
    }

    private fun parseRefreshToken(json: String): String {
        return try {
            JSONObject(json).getString("refresh_token")
        } catch (e: Exception) {
            ""
        }
    }

    private fun parseExpiresIn(json: String): Int {
        return try {
            JSONObject(json).getInt("expires_in")
        } catch (e: Exception) {
            3600
        }
    }

    private fun parseUserId(token: String, json: String): String {
        return try {
            val parts = token.split(".")
            if (parts.size >= 2) {
                val payload = String(Base64.getDecoder().decode(parts[1]))
                JSONObject(payload).getString("sub")
            } else {
                JSONObject(json).getString("id")
            }
        } catch (e: Exception) {
            JSONObject(json).getString("id")
        }
    }

    private fun parseUserIdJson(json: String): String {
        return try {
            JSONObject(json).getString("id")
        } catch (e: Exception) {
            throw Exception("No user id")
        }
    }

    suspend fun createNote(title: String, content: String, tags: List<String> = emptyList()): String {
        val uid = userId ?: throw Exception("Not authenticated")
        Log.d(TAG, "createNote: title='$title', content='$content', uid=$uid")
        val body = """
            {
                "id":"${UUID.randomUUID()}",
                "user_id":"$uid",
                "title":"${escapeJson(title)}",
                "content":"${escapeJson(content)}",
                "tags":${tags.map { "\"$it\"" }.toList().ifEmpty { "[]" }}
            }
        """.trimIndent()
        Log.d(TAG, "createNote body: $body")
        val response = request("POST", "/rest/v1/notes_v2", body)
        Log.d(TAG, "createNote response: $response")
        return parseNoteId(response)
    }

    suspend fun fetchNotes(): List<NoteData> {
        val uid = userId ?: throw Exception("Not authenticated")
        Log.d(TAG, "fetchNotes: uid=$uid")
        val response = request("GET", "/rest/v1/notes_v2?user_id=eq.$uid&order=created_at.desc&limit=100")
        Log.d(TAG, "fetchNotes response: ${response.take(500)}")
        val notes = parseNotes(response)
        Log.d(TAG, "parsed ${notes.size} notes")
        notes.forEach { Log.d(TAG, "  - ${it.title}") }
        return notes
    }

    suspend fun deleteNote(id: String) {
        request("DELETE", "/rest/v1/notes_v2?id=eq.$id")
    }

    suspend fun updateNote(id: String, title: String, content: String) {
        val body = """
            {
                "title":"${escapeJson(title)}",
                "content":"${escapeJson(content)}",
                "updated_at":"${java.time.Instant.now()}"
            }
        """.trimIndent()
        request("PATCH", "/rest/v1/notes_v2?id=eq.$id", body)
    }

    private fun parseNoteId(json: String): String {
        return try {
            JSONObject(json).getString("id")
        } catch (e: Exception) {
            throw Exception("No note id")
        }
    }

    private fun parseNotes(json: String): List<NoteData> {
        val notes = mutableListOf<NoteData>()
        try {
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val tagsArray = obj.optJSONArray("tags") ?: JSONArray()
                val tags = (0 until tagsArray.length()).map { tagsArray.getString(it) }
                notes.add(NoteData(
                    obj.getString("id"),
                    obj.optString("title", ""),
                    obj.optString("content", ""),
                    tags,
                    obj.optString("created_at", ""),
                    obj.optString("updated_at", "")
                ))
            }
        } catch (e: Exception) {
            Log.e(TAG, "parseNotes failed", e)
        }
        return notes
    }

    private fun escapeJson(s: String) = s
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t")
}

data class NoteData(
    val id: String,
    val title: String,
    val content: String,
    val tags: List<String>,
    val createdAt: String,
    val updatedAt: String
)