package com.rwote.app.data.repository

import android.util.Log
import com.rwote.app.data.api.NoteData
import com.rwote.app.data.api.SupabaseApi
import com.rwote.app.data.local.NotesCache
import com.rwote.app.data.model.Note
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

private const val TAG = "NotesRepo"

object NotesRepository {
    private val _notes = MutableStateFlow<List<Note>>(emptyList())
    val notes: StateFlow<List<Note>> = _notes

    fun getCachedNotes(): List<Note> = _notes.value.ifEmpty { emptyList() }

    suspend fun loadCached(): List<Note> {
        val cached = NotesCache.loadNotes()
        if (cached.isNotEmpty()) {
            _notes.value = cached
        }
        return cached
    }

    suspend fun fetchNotes(): Result<List<Note>> {
        return try {
            Log.d(TAG, "fetchNotes called, userId=${SupabaseApi.getUserId()}")
            val notesData = SupabaseApi.fetchNotes()
            _notes.value = notesData.map { it.toNote() }
            NotesCache.saveNotes(_notes.value)
            Log.d(TAG, "fetchNotes success: ${notesData.size} notes")
            Result.success(_notes.value)
        } catch (e: Exception) {
            Log.e(TAG, "fetchNotes failed", e)
            Result.failure(e)
        }
    }

    suspend fun createNote(title: String, content: String, tags: List<String> = emptyList(), sourceUrl: String? = null): Result<Note> {
        return try {
            Log.d(TAG, "createNote called: title='$title'")
            
            val tempNote = Note(
                id = "temp_${System.currentTimeMillis()}",
                title = title.ifEmpty { "Untitled" },
                content = content,
                tags = tags,
                sourceUrl = sourceUrl,
                createdAt = java.time.Instant.now().toString()
            )
            _notes.value = listOf(tempNote) + _notes.value
            NotesCache.saveNotes(_notes.value)
            
            SupabaseApi.createNote(title, content, tags, sourceUrl)
            Log.d(TAG, "createNote sent to server")
            fetchNotes()
            
            Result.success(tempNote)
        } catch (e: Exception) {
            Log.e(TAG, "createNote failed", e)
            Result.failure(e)
        }
    }

    suspend fun deleteNote(id: String): Result<Unit> {
        return try {
            _notes.value = _notes.value.filter { it.id != id }
            NotesCache.saveNotes(_notes.value)
            SupabaseApi.deleteNote(id)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateNote(id: String, title: String, content: String, tags: List<String> = emptyList()): Result<Note> {
        return try {
            _notes.value = _notes.value.map { 
                if (it.id == id) it.copy(title = title, content = content, tags = tags) else it 
            }
            NotesCache.saveNotes(_notes.value)
            
            SupabaseApi.updateNote(id, title, content, tags)
            fetchNotes()
            
            val note = _notes.value.firstOrNull { it.id == id }
            Result.success(note ?: throw Exception("Note not found"))
        } catch (e: Exception) {
            Log.e(TAG, "updateNote failed", e)
            Result.failure(e)
        }
    }

    private fun NoteData.toNote() = Note(
        id = id,
        userId = null,
        title = title.ifEmpty { "Untitled" },
        content = content,
        tags = tags,
        pinned = false,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}