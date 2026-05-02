package com.rwote.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rwote.app.data.model.Note
import com.rwote.app.ui.screens.NotesScreen
import com.rwote.app.ui.screens.NoteDetailPage
import com.rwote.app.ui.theme.RwoteTheme
import com.rwote.app.viewmodel.MainViewModel
import com.rwote.app.viewmodel.UiState

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            RwoteTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: MainViewModel = viewModel()
                    val authState by viewModel.authState.collectAsState()
                    val notes by viewModel.notes.collectAsState()
                    val isLoading by viewModel.isLoading.collectAsState()

                    var searchQuery by remember { mutableStateOf("") }
                    var selectedNote by remember { mutableStateOf<Note?>(null) }
                    var isEditMode by remember { mutableStateOf(false) }
                    var showNoteDetail by remember { mutableStateOf(false) }

                    val filteredNotes = remember(notes, searchQuery) {
                        if (searchQuery.isBlank()) notes
                        else notes.filter {
                            it.title.contains(searchQuery, ignoreCase = true) ||
                            (it.content?.contains(searchQuery, ignoreCase = true) == true)
                        }
                    }

                    LaunchedEffect(intent) {
                        handleIntent(intent) { text, url ->
                            viewModel.handleSharedText(text, url)
                        }
                    }

                    val isLoggedIn = (authState as? UiState.Success)?.data?.isLoggedIn == true
                    val userEmail = (authState as? UiState.Success)?.data?.email ?: ""

                    LaunchedEffect(isLoggedIn) {
                        if (isLoggedIn) {
                            viewModel.fetchNotes()
                        }
                    }

                    if (isLoggedIn) {
                        if (showNoteDetail) {
                            NoteDetailPage(
                                note = selectedNote,
                                isEditMode = isEditMode,
                                onToggleEditMode = { isEditMode = !isEditMode },
                                onSave = { title, content, tags ->
                                    if (selectedNote != null) {
                                        viewModel.updateNote(selectedNote!!.id, title, content, tags)
                                    } else {
                                        viewModel.createNote(title, content, tags)
                                    }
                                    showNoteDetail = false
                                    selectedNote = null
                                    isEditMode = false
                                },
                                onDelete = { id ->
                                    viewModel.deleteNote(id)
                                    showNoteDetail = false
                                    selectedNote = null
                                    isEditMode = false
                                },
                                onBack = {
                                    showNoteDetail = false
                                    selectedNote = null
                                    isEditMode = false
                                },
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            NotesScreen(
                                notes = filteredNotes,
                                searchQuery = searchQuery,
                                onSearchQueryChange = { searchQuery = it },
                                onNoteClick = { note ->
                                    selectedNote = note
                                    isEditMode = false
                                    showNoteDetail = true
                                },
                                onAddClick = {
                                    selectedNote = null
                                    isEditMode = true
                                    showNoteDetail = true
                                },
                                onLogoutClick = {
                                    viewModel.signOut()
                                },
                                isLoading = isLoading,
                                modifier = Modifier.fillMaxSize(),
                                userEmail = userEmail
                            )
                        }
                    } else {
                        LoginScreen(
                            isLoading = isLoading,
                            authState = authState,
                            onSignIn = viewModel::signIn,
                            onSignUp = viewModel::signUp,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Handled via BackHandler in Compose
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent) { _, _ -> }
    }

    private fun handleIntent(intent: Intent?, onText: (String, String?) -> Unit) {
        intent?.let {
            if (it.action == Intent.ACTION_SEND && it.type == "text/plain") {
                it.getStringExtra(Intent.EXTRA_TEXT)?.let { text ->
                    val urlRegex = Regex("https?://[^\\s]+")
                    val url = urlRegex.find(text)?.value
                    val cleanText = url?.let { u -> text.replace(u, "").replace("  ", " ").trim() } ?: text
                    onText(cleanText, url)
                }
            }
        }
    }
}

@Composable
fun LoginScreen(
    isLoading: Boolean,
    authState: UiState<MainViewModel.AuthState>,
    onSignIn: (String, String) -> Unit,
    onSignUp: (String, String) -> Unit,
    modifier: Modifier = Modifier
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isSignUp by remember { mutableStateOf(false) }

    Column(
        modifier = modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Rwote",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = if (isSignUp) "Create account" else "Sign in to continue",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (authState is UiState.Error) {
            Text(
                text = authState.message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        Button(
            onClick = {
                if (isSignUp) onSignUp(email, password)
                else onSignIn(email, password)
            },
            enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text(if (isSignUp) "Sign Up" else "Sign In")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        TextButton(onClick = { isSignUp = !isSignUp }) {
            Text(
                text = if (isSignUp) "Already have an account? Sign In"
                else "Don't have an account? Sign Up"
            )
        }
    }
}