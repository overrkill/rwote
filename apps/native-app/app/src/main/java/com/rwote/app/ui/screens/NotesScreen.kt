package com.rwote.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.staggeredgrid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
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
import com.rwote.app.data.model.Note
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotesScreen(
    notes: List<Note>,
    onNoteClick: (Note) -> Unit,
    onAddClick: () -> Unit,
    onSearchClick: () -> Unit,
    isLoadingMore: Boolean = false,
    onLoadMore: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val grouped = remember(notes) { groupNotesByDate(notes) }
    val gridState = rememberLazyStaggeredGridState()

    LaunchedEffect(gridState) {
        snapshotFlow {
            val last = gridState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val total = gridState.layoutInfo.totalItemsCount
            last >= total - 4
        }
        .map { it }
        .distinctUntilChanged()
        .filter { it }
        .collect { onLoadMore() }
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            NotesTopBar(onSearchClick = onSearchClick)
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddClick,
                containerColor = Color(0xFF1A1A1A),
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add note")
            }
        },
        containerColor = Color(0xFFF8F8F6)
    ) { padding ->
        if (notes.isEmpty()) {
            EmptyNotesState(modifier = Modifier.padding(padding))
            return@Scaffold
        }

        LazyVerticalStaggeredGrid(
            columns = StaggeredGridCells.Fixed(2),
            state = gridState,
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(
                start = 12.dp,
                end = 12.dp,
                top = 8.dp,
                bottom = 80.dp
            ),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalItemSpacing = 8.dp
        ) {
            grouped.forEach { (label, sectionNotes) ->
                item(span = StaggeredGridItemSpan.FullLine) {
                    SectionHeader(label = label)
                }

                items(sectionNotes, key = { it.id }) { note ->
                    NoteCard(
                        note = note,
                        onClick = { onNoteClick(note) }
                    )
                }
            }

            if (isLoadingMore) {
                item(span = StaggeredGridItemSpan.FullLine) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp,
                            color = Color(0xFF1A1A1A)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotesTopBar(onSearchClick: () -> Unit) {
    TopAppBar(
        title = {
            Text(
                text = "Rwote",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1A1A1A),
                letterSpacing = (-0.5).sp
            )
        },
        actions = {
            IconButton(onClick = onSearchClick) {
                Icon(
                    Icons.Default.Search,
                    contentDescription = "Search",
                    tint = Color(0xFF1A1A1A)
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFFF8F8F6)
        )
    )
}

@Composable
fun SectionHeader(label: String) {
    Text(
        text = label.uppercase(),
        fontSize = 10.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 1.5.sp,
        color = Color(0xFF999999),
        modifier = Modifier.padding(
            start = 4.dp,
            top = 12.dp,
            bottom = 4.dp
        )
    )
}

@Composable
fun NoteCard(
    note: Note,
    onClick: () -> Unit
) {
    val tint = tintForNote(note)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(tint)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        if (!note.sourceUrl.isNullOrEmpty()) {
            SourceBadge(url = note.sourceUrl)
        }

        Text(
            text = note.content ?: note.title,
            fontSize = 13.sp,
            lineHeight = 18.sp,
            color = Color(0xFF2A2A2A),
            maxLines = 8,
            overflow = TextOverflow.Ellipsis
        )

        if (note.tags.isNotEmpty()) {
            TagsRow(tags = note.tags)
        }

        note.createdAt?.let { created ->
            Text(
                text = formatCardTime(created),
                fontSize = 10.sp,
                color = Color(0xFFAAAAAA),
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun SourceBadge(url: String) {
    val domain = remember(url) {
        url.removePrefix("https://")
            .removePrefix("http://")
            .removePrefix("www.")
            .substringBefore("/")
            .take(30)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(Color(0x15000000))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = domain,
            fontSize = 10.sp,
            color = Color(0xFF666666),
            fontWeight = FontWeight.Medium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun TagsRow(tags: List<String>) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        tags.take(2).forEach { tag ->
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0x20000000))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "#$tag",
                    fontSize = 10.sp,
                    color = Color(0xFF555555),
                    fontWeight = FontWeight.Medium
                )
            }
        }
        if (tags.size > 2) {
            Text(
                text = "+${tags.size - 2}",
                fontSize = 10.sp,
                color = Color(0xFFAAAAAA)
            )
        }
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
        val date = instant.atZone(zone)
        date.format(DateTimeFormatter.ofPattern("h:mm a"))
    } catch (e: Exception) {
        ""
    }
}