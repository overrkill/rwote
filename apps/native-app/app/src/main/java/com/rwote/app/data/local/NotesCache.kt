package com.rwote.app.data.local

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.rwote.app.data.model.Note
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private const val TAG = "NotesCache"
private const val PREFS_FILE = "notes_cache"
private const val KEY_NOTES = "cached_notes"

object NotesCache {
    private var prefs: android.content.SharedPreferences? = null
    private val json = Json { ignoreUnknownKeys = true }

    fun init(context: Context) {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        prefs = EncryptedSharedPreferences.create(
            context,
            PREFS_FILE,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    suspend fun saveNotes(notes: List<Note>) = withContext(Dispatchers.IO) {
        try {
            val notesJson = json.encodeToString(notes)
            prefs?.edit()?.putString(KEY_NOTES, notesJson)?.apply()
            Log.d(TAG, "Saved ${notes.size} notes to cache")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save notes", e)
        }
    }

    suspend fun loadNotes(): List<Note> = withContext(Dispatchers.IO) {
        try {
            val notesJson = prefs?.getString(KEY_NOTES, null) ?: return@withContext emptyList()
            json.decodeFromString<List<Note>>(notesJson).also {
                Log.d(TAG, "Loaded ${it.size} notes from cache")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load notes", e)
            emptyList()
        }
    }
}