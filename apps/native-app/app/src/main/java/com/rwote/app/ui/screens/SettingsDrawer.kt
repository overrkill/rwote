package com.rwote.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.rwote.app.ui.theme.ThemeManager
import com.rwote.app.ui.theme.ThemeMode

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsDrawer(
    userEmail: String,
    onDismiss: () -> Unit,
    onLogout: () -> Unit
) {
    val colorScheme = MaterialTheme.colorScheme
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = colorScheme.surface,
        dragHandle = { HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp, horizontal = 40.dp)) }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.5f)
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(colorScheme.primary),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        tint = colorScheme.onPrimary,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Column {
                    Text(
                        text = userEmail.substringBefore("@").replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (userEmail.contains("@")) {
                        Text(
                            text = userEmail,
                            style = MaterialTheme.typography.bodySmall,
                            color = colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Text(
                text = "Theme",
                style = MaterialTheme.typography.labelMedium,
                color = colorScheme.onSurfaceVariant
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = !ThemeManager.useSystemTheme && !ThemeManager.isDarkMode,
                    onClick = { ThemeManager.setTheme(ThemeMode.LIGHT) },
                    label = { Text("Light", style = MaterialTheme.typography.labelSmall) }
                )
                FilterChip(
                    selected = ThemeManager.useSystemTheme,
                    onClick = { ThemeManager.setTheme(ThemeMode.SYSTEM) },
                    label = { Text("Auto", style = MaterialTheme.typography.labelSmall) }
                )
                FilterChip(
                    selected = !ThemeManager.useSystemTheme && ThemeManager.isDarkMode,
                    onClick = { ThemeManager.setTheme(ThemeMode.DARK) },
                    label = { Text("Dark", style = MaterialTheme.typography.labelSmall) }
                )
            }

            TextButton(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Logout", color = colorScheme.error)
            }
        }
    }
}