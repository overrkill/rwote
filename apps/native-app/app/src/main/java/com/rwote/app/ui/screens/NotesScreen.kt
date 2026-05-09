package com.rwote.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.jeziellago.compose.markdowntext.MarkdownText 
import com.rwote.app.data.model.Note
import com.rwote.app.data.api.SupabaseApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import androidx.activity.compose.BackHandler

val cardTints = listOf(
    Color(0xFFFFFBF0),
    Color(0xFFF0F4FF),
    Color(0xFFF0FFF4),
    Color(0xFFFFF0F0),
    Color(0xFFF5F0FF),
)

fun tintForNote(note: Note): Color {
    return cardTints[note.id.hashCode().and(0x7FFFFFFF) % cardTints.size]
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun NoteDetailPage(
    note: Note?,
    isEditMode: Boolean,
    onToggleEditMode: () -> Unit,
    onSave: (String, String, List<String>) -> Unit,
    onDelete: (String) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var title by remember(note) {
        mutableStateOf(note?.title?.replace(Regex("#\\w+"), "")?.replace("  ", " ")?.trim() ?: "")
    }
    var content by remember(note) {
        mutableStateOf(note?.content?.replace(Regex("#\\w+"), "")?.replace("  ", " ")?.trim() ?: "")
    }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showDiscardDialog by remember { mutableStateOf(false) }
    var originalTitle by remember { mutableStateOf("") }
    var originalContent by remember { mutableStateOf("") }
    var summarizeResponse by remember { mutableStateOf<com.rwote.app.data.api.SupabaseApi.SummarizeResponse?>(null) }
    var isSummarizing by remember { mutableStateOf(false) }
    var summarizeError by remember { mutableStateOf("") }
    var summarizeApplied by remember { mutableStateOf(false) }

    val detectedTags = remember(title, content, note?.tags) {
        (note?.tags ?: emptyList()) + parseTags("$title $content")
    }.distinct()

    val isNewNote = note == null

    val hasChanges = remember(title, content, originalTitle, originalContent) {
        title != originalTitle || content != originalContent
    }

    LaunchedEffect(note) {
        originalTitle = note?.title ?: ""
        originalContent = note?.content ?: ""
        summarizeApplied = false
    }

    val coroutineScope = rememberCoroutineScope()

    // Handle system back button
    val isEditOrNew = isEditMode || isNewNote
    val isNewNoteEmpty = isNewNote && title.isBlank() && content.isBlank()
    BackHandler(enabled = true) {
        if (isEditOrNew) {
            if (isNewNoteEmpty) {
                onBack() // New note with no content → home screen
            } else if (hasChanges) {
                showDiscardDialog = true
            } else {
                onToggleEditMode() // Edit mode with no changes → view mode
            }
        } else {
            onBack() // View mode → notes list
        }
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isNewNote) "New Note" else if (isEditMode) "Edit" else "Note",
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (isEditOrNew) {
                            if (isNewNoteEmpty) {
                                onBack() // New note with no content → home screen
                            } else if (hasChanges) {
                                showDiscardDialog = true
                            } else {
                                onToggleEditMode() // Edit mode → view mode
                            }
                        } else {
                            onBack() // View mode → notes list
                        }
                    }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (!isNewNote && !isEditMode) {
                        IconButton(onClick = onToggleEditMode) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit")
                        }
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    } else if (isEditMode || isNewNote) {
                        if (isSummarizing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            TextButton(
                                onClick = {
                                    if (content.isNotBlank()) {
                                        isSummarizing = true
                                        summarizeError = ""
                                        val contentToSummarize = content
                                        android.util.Log.d("NoteDetailPage", "Summarize clicked, content length: ${contentToSummarize.length}")
                                        coroutineScope.launch {
                                            try {
                                                summarizeResponse = SupabaseApi.summarizeContent(contentToSummarize)
                                                android.util.Log.d("NoteDetailPage", "Summarize success")
                                                // Populate content directly
                                                val builder = StringBuilder()
                                                summarizeResponse?.summary?.let { summary ->
                                                    builder.append(summary)
                                                }
                                                if (summarizeResponse?.keyPoints?.isNotEmpty() == true) {
                                                    if (builder.isNotEmpty()) builder.append("\n\n")
                                                    summarizeResponse?.keyPoints?.forEach { point ->
                                                        builder.append("\n- $point")
                                                    }
                                                }
                                                if (summarizeResponse?.tags?.isNotEmpty() == true) {
                                                    if (builder.isNotEmpty()) builder.append("\n\n")
                                                    summarizeResponse?.tags?.forEach { tag ->
                                                        builder.append("$tag ")
                                                    }
                                                }
                                                content = builder.toString().trim()
                                                summarizeApplied = true
                                            } catch (e: Exception) {
                                                android.util.Log.e("NoteDetailPage", "Summarize error", e)
                                                summarizeError = e.message ?: "Failed to summarize"
                                            } finally {
                                                isSummarizing = false
                                            }
                                        }
                                    }
                                },
                                enabled = content.isNotBlank()
                            ) {
                                Text("Summarize")
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        // Undo button - enabled only after summarize
                        IconButton(
                            onClick = {
                                // Restore original state (before summarize)
                                title = originalTitle
                                content = originalContent
                                summarizeApplied = false
                                summarizeError = ""
                            },
                            enabled = summarizeApplied
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Undo summarize")
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        // Save button with check icon
                        IconButton(onClick = {
                            val contentTags = parseTags("$title $content")
                            val previousTags = note?.tags ?: emptyList()
                            val finalTags = (previousTags + contentTags).distinct()
                            val cleanTitle = title.replace(Regex("#\\w+"), "").replace("  ", " ").trim()
                            val cleanContent = content.replace(Regex("#\\w+"), "").replace("  ", " ").trim()
                            onSave(cleanTitle, cleanContent, finalTags)
                        }) {
                            Icon(Icons.Default.Check, contentDescription = "Save")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 12.dp)
            ) {
                if (isEditMode || isNewNote) {
                    TextField(
                        value = title,
                        onValueChange = { title = it },
                        placeholder = { Text("Title", color = MaterialTheme.colorScheme.onSurfaceVariant) },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3,
                        colors = TextFieldDefaults.colors(
                            unfocusedContainerColor = Color.Transparent,
                            focusedContainerColor = Color.Transparent,
                            unfocusedIndicatorColor = MaterialTheme.colorScheme.outlineVariant,
                            focusedIndicatorColor = MaterialTheme.colorScheme.primary
                        )
                    )

                    HorizontalDivider(
                        thickness = 0.5.dp,
                        color = MaterialTheme.colorScheme.outlineVariant
                    )

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                    ) {
                        TextField(
                            value = content,
                            onValueChange = { content = it },
                            placeholder = { Text("Content", color = MaterialTheme.colorScheme.onSurfaceVariant) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = TextFieldDefaults.colors(
                                unfocusedContainerColor = Color.Transparent,
                                focusedContainerColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent,
                                focusedIndicatorColor = Color.Transparent
                            )
                        )

                        if (summarizeError.isNotEmpty()) {
                            Text(
                                text = summarizeError,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        if (detectedTags.isNotEmpty()) {
                            TagsEditor(
                                tags = detectedTags,
                                onRemoveTag = { removed ->
                                    val word = "#$removed"
                                    content = content.replace(word, "").replace("  ", " ").trim()
                                }
                            )
                        }

                        note?.createdAt?.let {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = formatCardTime(it),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                } else {
                    Text(
                        text = note?.title ?: "",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    HorizontalDivider(
                        thickness = 0.5.dp,
                        color = MaterialTheme.colorScheme.outlineVariant
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                    ) {
                        MarkdownText(
                            markdown = note?.content ?: "",
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                            )
                        )

                        if (note?.tags?.isNotEmpty() == true) {
                            Spacer(modifier = Modifier.height(8.dp))
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                note.tags.forEach { tag ->
                                    SuggestionChip(
                                        onClick = { },
                                        label = { Text("#$tag", style = MaterialTheme.typography.labelSmall) }
                                    )
                                }
                            }
                        }

                        note?.createdAt?.let {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = formatCardTime(it),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                }
                
        }
        
        if (showDeleteConfirm) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirm = false },
                title = { Text("Delete Note?") },
                text = { Text("This cannot be undone.") },
                confirmButton = {
                    TextButton(onClick = {
                        note?.let { onDelete(it.id) }
                        showDeleteConfirm = false
                    }) {
                        Text("Delete", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirm = false }) {
                        Text("Cancel")
                    }
                }
            )
        }

        if (showDiscardDialog) {
            AlertDialog(
                onDismissRequest = { showDiscardDialog = false },
                title = { Text("Discard changes?") },
                text = { Text("You have unsaved changes that will be lost.") },
                confirmButton = {
                    TextButton(onClick = {
                        showDiscardDialog = false
                        when {
                            isNewNote -> onBack() // New note → home screen
                            isEditOrNew -> onToggleEditMode() // Edit mode → view mode
                            else -> onBack() // View mode → home screen
                        }
                    }) {
                        Text("Discard", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDiscardDialog = false }) {
                        Text("Keep editing")
                    }
                }
            )
        }
        
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotesScreen(
    notes: List<Note>,
    searchQuery: String = "",
    onSearchQueryChange: (String) -> Unit = {},
    onNoteClick: (Note) -> Unit,
    onAddClick: () -> Unit,
    onLogoutClick: () -> Unit = {},
    isLoading: Boolean = false,
    modifier: Modifier = Modifier,
    userEmail: String = ""
) {
    val grouped = remember(notes) { groupNotesByDate(notes) }
    val gridState = rememberLazyListState()
    var showDrawer by remember { mutableStateOf(false) }

    if (showDrawer) {
        SettingsDrawer(
            userEmail = userEmail,
            onDismiss = { showDrawer = false },
            onLogout = onLogoutClick
        )
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            NotesTopBar(
                searchQuery = searchQuery,
                onSearchQueryChange = onSearchQueryChange,
                onProfileClick = { showDrawer = true },
                userEmail = userEmail
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddClick,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add note")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        if (notes.isEmpty()) {
            EmptyNotesState(modifier = Modifier.padding(padding))
            return@Scaffold
        }

        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return@Scaffold
        }

        LazyColumn(
            state = gridState,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(
                start = 12.dp,
                end = 12.dp,
                top = 8.dp,
                bottom = 80.dp
            )
        ) {
            grouped.forEach { (label, sectionNotes) ->
                item { SectionHeader(label = label) }

                items(sectionNotes, key = { it.id }) { note ->
                    NoteListItemWithDivider(
                        note = note,
                        onClick = { onNoteClick(note) }
                    )
                }
            }

            if (isLoading) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotesTopBar(
    searchQuery: String = "",
    onSearchQueryChange: (String) -> Unit = {},
    onProfileClick: () -> Unit = {},
    userEmail: String = ""
) {
    var showSearch by remember { mutableStateOf(false) }

    TopAppBar(
        title = {
            if (showSearch) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    placeholder = { Text("Search notes...", fontSize = 14.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent
                    )
                )
            } else {
                Text(
                    text = "Rwote",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    letterSpacing = (-0.5).sp
                )
            }
        },
        actions = {
            IconButton(onClick = {
                showSearch = !showSearch
                if (!showSearch) onSearchQueryChange("")
            }) {
                Icon(
                    if (showSearch) Icons.Default.Close else Icons.Default.Search,
                    contentDescription = "Search",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
            UserAvatar(email = userEmail, onClick = onProfileClick)
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun UserAvatar(
    email: String,
    onClick: () -> Unit
) {
    val initial = email.firstOrNull()?.uppercaseChar() ?: '?'

    IconButton(onClick = onClick) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = initial.toString(),
                color = MaterialTheme.colorScheme.onPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun SectionHeader(label: String) {
    Column(
        modifier = Modifier.padding(start = 4.dp, top = 12.dp, bottom = 4.dp)
    ) {
        Text(
            text = label.uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.5.sp,
            color = Color(0xFF999999)
        )
    }
}

@Composable
fun NoteListItem(
    note: Note,
    onClick: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme

    val timeText = remember(note.createdAt) { note.createdAt?.let { formatCardTime(it) } ?: "" }
    val displayText = remember(note.id, note.title, note.content, note.tags) {
        val title = note.title.take(50)
        val content = note.content ?: ""
        val tags = note.tags.take(2).joinToString(" ") { "#$it" }
        buildString {
            if (title.contains(":") || content.isEmpty()) append("$title $content".take(100))
            else append("$title: $content".take(100))
            if (tags.isNotEmpty()) append(" $tags")
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = displayText,
            fontSize = 13.sp,
            lineHeight = 18.sp,
            color = colorScheme.onSurface,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f)
        )

        if (timeText.isNotEmpty()) {
            Text(
                text = timeText,
                fontSize = 10.sp,
                color = colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 8.dp)
            )
        }
    }
}

@Composable
fun NoteListItemWithDivider(
    note: Note,
    onClick: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme

    Column {
        NoteListItem(note = note, onClick = onClick)
        HorizontalDivider(
            color = colorScheme.outlineVariant,
            thickness = 0.5.dp
        )
    }
}

@Composable
fun EmptyNotesState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(text = "✦", fontSize = 32.sp)
            Text(
                text = "No notes yet",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF1A1A1A)
            )
            Text(
                text = "Share text from any app to save it here",
                fontSize = 13.sp,
                color = Color(0xFF999999)
            )
        }
    }
}

fun groupNotesByDate(notes: List<Note>): List<Pair<String, List<Note>>> {
    val today = LocalDate.now()
    val yesterday = today.minusDays(1)
    val zone = ZoneId.systemDefault()

    return notes
        .groupBy { note ->
            val date = note.createdAt?.let {
                try {
                    Instant.parse(it).atZone(zone).toLocalDate()
                } catch (e: Exception) {
                    null
                }
            } ?: return@groupBy "Earlier"
            when {
                date == today -> "Today"
                date == yesterday -> "Yesterday"
                date.isAfter(today.minusWeeks(1)) -> "This week"
                date.isAfter(today.minusMonths(1)) -> "This month"
                else -> date.format(DateTimeFormatter.ofPattern("MMMM yyyy"))
            }
        }
        .entries
        .map { it.key to it.value }
        .sortedBy { (label, _) ->
            when (label) {
                "Today" -> 0
                "Yesterday" -> 1
                "This week" -> 2
                "This month" -> 3
                else -> 4
            }
        }
}

fun formatCardTime(isoString: String): String {
    return try {
        val instant = Instant.parse(isoString)
        val zone = ZoneId.systemDefault()
        val dateTime = instant.atZone(zone)
        val today = LocalDate.now()
        val yesterday = today.minusDays(1)
        val noteDate = dateTime.toLocalDate()

        when {
            noteDate == today -> dateTime.format(DateTimeFormatter.ofPattern("h:mm a"))
            noteDate == yesterday -> "Yesterday"
            else -> dateTime.format(DateTimeFormatter.ofPattern("MMM d"))
        }
    } catch (e: Exception) {
        ""
    }
}

fun parseTags(text: String): List<String> {
    val matches = Regex("#(\\w+)").findAll(text)
    return matches.map { it.groupValues[1].lowercase() }.distinct().take(4).toList()
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TagsEditor(
    tags: List<String>,
    onRemoveTag: (String) -> Unit
) {
    if (tags.isEmpty()) return

    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        tags.forEach { tag ->
            InputChip(
                selected = false,
                onClick = { onRemoveTag(tag) },
                label = { Text("#$tag", style = MaterialTheme.typography.labelSmall) },
                trailingIcon = {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Remove",
                        modifier = Modifier.size(16.dp)
                    )
                }
            )
        }
    }
}
