package com.rwote.app.data.repository

import android.util.Log
import com.rwote.app.data.api.NoteData
import com.rwote.app.data.api.SupabaseApi
import com.rwote.app.data.model.Note
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

private const val TAG = "NotesRepo"

object NotesRepository {
    private val _notes = MutableStateFlow<List<Note>>(emptyList())
    val notes: StateFlow<List<Note>> = _notes

    suspend fun fetchNotes(): Result<List<Note>> {
        return try {
            Log.d(TAG, "fetchNotes called, userId=${SupabaseApi.getUserId()}")
            val notesData = SupabaseApi.fetchNotes()
            _notes.value = notesData.map { it.toNote() }
            Log.d(TAG, "fetchNotes success: ${notesData.size} notes")
            Result.success(_notes.value)
        } catch (e: Exception) {
            Log.e(TAG, "fetchNotes failed", e)
            Result.failure(e)
        }
    }

    suspend fun createNote(title: String, content: String, tags: List<String> = emptyList()): Result<Note> {
        return try {
            Log.d(TAG, "createNote called: title='$title'")
            val id = SupabaseApi.createNote(title, content, tags)
            Log.d(TAG, "createNote got id: $id")
            fetchNotes()
            Log.d(TAG, "after fetchNotes, notes=${_notes.value.map { it.title }}")
            val note = _notes.value.firstOrNull { it.id == id }
            Log.d(TAG, "returning note: $note")
            Result.success(note ?: throw Exception("Note not found"))
        } catch (e: Exception) {
            Log.e(TAG, "createNote failed", e)
            Result.failure(e)
        }
    }

    suspend fun deleteNote(id: String): Result<Unit> {
        return try {
            SupabaseApi.deleteNote(id)
            _notes.value = _notes.value.filter { it.id != id }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateNote(id: String, title: String, content: String): Result<Note> {
        return try {
            SupabaseApi.updateNote(id, title, content)
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