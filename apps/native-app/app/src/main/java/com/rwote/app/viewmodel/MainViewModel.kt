package com.rwote.app.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rwote.app.data.api.SupabaseApi
import com.rwote.app.data.model.Note
import com.rwote.app.data.repository.NotesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

private const val TAG = "MainViewModel"

sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

class MainViewModel : ViewModel() {
    private val _authState = MutableStateFlow<UiState<AuthState>>(UiState.Success(AuthState()))
    val authState: StateFlow<UiState<AuthState>> = _authState

    val notes: StateFlow<List<Note>> = NotesRepository.notes

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        checkExistingAuth()
    }

    private fun checkExistingAuth() {
        if (SupabaseApi.isLoggedIn()) {
            _authState.value = UiState.Success(AuthState(
                userId = SupabaseApi.getUserId(),
                email = SupabaseApi.getEmail(),
                isLoggedIn = true
            ))
            loadCachedNotes()
            fetchNotes()
        }
    }

    private fun loadCachedNotes() {
        viewModelScope.launch {
            NotesRepository.loadCached()
        }
    }

    data class AuthState(
        val userId: String? = null,
        val email: String? = null,
        val isLoggedIn: Boolean = false
    )

    fun signUp(email: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = SupabaseApi.signUp(email, password)) {
                is SupabaseApi.AuthResult.Success -> {
                    _authState.value = UiState.Success(AuthState(result.userId, result.email, true))
                }
                is SupabaseApi.AuthResult.Error -> {
                    _authState.value = UiState.Error(result.message)
                }
            }
            _isLoading.value = false
        }
    }

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = SupabaseApi.signIn(email, password)) {
                is SupabaseApi.AuthResult.Success -> {
                    _authState.value = UiState.Success(AuthState(result.userId, result.email, true))
                    fetchNotes()
                }
                is SupabaseApi.AuthResult.Error -> {
                    _authState.value = UiState.Error(result.message)
                }
            }
            _isLoading.value = false
        }
    }

    fun signOut() {
        viewModelScope.launch {
            SupabaseApi.signOut()
            _authState.value = UiState.Success(AuthState())
        }
    }

    fun fetchNotes() {
        viewModelScope.launch {
            NotesRepository.fetchNotes()
        }
    }

    fun createNote(title: String, content: String, tags: List<String> = emptyList(), sourceUrl: String? = null) {
        viewModelScope.launch {
            _isLoading.value = true
            Log.d(TAG, "createNote VM: title='$title'")
            val result = NotesRepository.createNote(title, content, tags, sourceUrl)
            Log.d(TAG, "createNote VM result: ${result.isSuccess}")
            _isLoading.value = false
        }
    }

    fun deleteNote(id: String) {
        viewModelScope.launch {
            NotesRepository.deleteNote(id)
        }
    }

    fun updateNote(id: String, title: String, content: String, tags: List<String> = emptyList()) {
        viewModelScope.launch {
            NotesRepository.updateNote(id, title, content, tags)
        }
    }

    fun handleSharedText(text: String, sourceUrl: String? = null) {
        val title = text.take(50).let { if (text.length > 50) "$it..." else it }
        createNote(title, text, emptyList(), sourceUrl)
    }
}