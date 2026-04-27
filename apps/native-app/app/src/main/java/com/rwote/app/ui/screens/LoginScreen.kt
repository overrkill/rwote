package com.rwote.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.rwote.app.ui.components.AuthForm

@Composable
fun LoginScreen(
    isLoading: Boolean,
    authState: com.rwote.app.viewmodel.UiState<com.rwote.app.viewmodel.MainViewModel.AuthState>,
    onSignIn: (String, String) -> Unit,
    onSignUp: (String, String) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(100.dp))

        AuthForm(
            isLoading = isLoading,
            authState = authState,
            onSignIn = onSignIn,
            onSignUp = onSignUp
        )
    }
}