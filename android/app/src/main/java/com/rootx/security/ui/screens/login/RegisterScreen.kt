package com.rootx.security.ui.screens.login

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.AuthViewModel

@Composable
fun RegisterScreen(
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit,
    authViewModel: AuthViewModel,
) {
    val colors = RootXTheme.colors
    val error by authViewModel.error.collectAsState()
    val isLoading by authViewModel.isLoading.collectAsState()
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }
    var showPassword by remember { mutableStateOf(false) }

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) onRegisterSuccess()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .border(width = (0.5).dp, color = colors.borderSubtle)
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onNavigateToLogin),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.ChevronLeft,
                    contentDescription = "Back",
                    tint = colors.textSecondary,
                    modifier = Modifier.size(22.dp),
                )
            }
            Spacer(Modifier.width(6.dp))
            Text(
                text = "Create RootX Account",
                style = RootXTypography.labelLarge.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
                color = colors.textSecondary,
            )
        }

        // Form Body
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(8.dp))

            RootXLogo(size = 52.dp, glow = false)

            Spacer(Modifier.height(14.dp))

            Text(
                text = "Create account",
                style = RootXTypography.headlineMedium.copy(fontSize = 21.sp, fontWeight = FontWeight.Bold),
                color = colors.textPrimary,
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = "Start protecting your devices in minutes.",
                style = RootXTypography.bodySmall.copy(fontSize = 13.sp),
                color = colors.textSecondary,
            )

            Spacer(Modifier.height(28.dp))

            // Error display
            val displayError = localError ?: error
            AnimatedVisibility(visible = displayError != null) {
                Column {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(colors.dangerSoft)
                            .border(1.dp, colors.danger.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.ErrorOutline, "Error", tint = colors.danger, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = displayError ?: "",
                            style = RootXTypography.bodySmall,
                            color = colors.danger,
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                }
            }

            // Email
            RootXField(
                value = email,
                onValueChange = { email = it; localError = null; authViewModel.clearError() },
                placeholder = "name@example.com",
                label = "Email address",
                leadingIcon = { Icon(Icons.Outlined.Mail, "Email", Modifier.size(16.dp), tint = colors.textTertiary) },
            )

            Spacer(Modifier.height(14.dp))

            // Password
            RootXField(
                value = password,
                onValueChange = { password = it; localError = null; authViewModel.clearError() },
                placeholder = "At least 6 characters",
                label = "Password",
                isPassword = !showPassword,
                leadingIcon = { Icon(Icons.Outlined.Lock, "Password", Modifier.size(16.dp), tint = colors.textTertiary) },
                trailingIcon = {
                    Icon(
                        imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                        contentDescription = "Toggle password",
                        modifier = Modifier
                            .size(18.dp)
                            .clickable { showPassword = !showPassword },
                        tint = colors.textTertiary,
                    )
                },
            )

            Spacer(Modifier.height(14.dp))

            // Confirm Password
            RootXField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it; localError = null },
                placeholder = "Repeat password",
                label = "Confirm password",
                isPassword = !showPassword,
                leadingIcon = { Icon(Icons.Outlined.Lock, "Confirm", Modifier.size(16.dp), tint = colors.textTertiary) },
            )

            Spacer(Modifier.height(22.dp))

            RootXButton(
                text = if (isLoading) "Creating account…" else "Create account",
                onClick = {
                    localError = null
                    when {
                        password.length < 6 -> localError = "Password must be at least 6 characters"
                        password != confirmPassword -> localError = "Passwords do not match"
                        else -> authViewModel.registerWithEmail(email, password)
                    }
                },
                isLoading = isLoading,
                enabled = email.isNotBlank() && password.isNotBlank() && confirmPassword.isNotBlank(),
            )

            Spacer(Modifier.height(20.dp))

            // Divider
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(modifier = Modifier.weight(1f).height(1.dp).background(colors.borderDefault))
                Text(
                    text = "OR CONTINUE WITH",
                    style = RootXTypography.micro.copy(
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp
                    ),
                    color = colors.textTertiary,
                    modifier = Modifier.padding(horizontal = 12.dp),
                )
                Box(modifier = Modifier.weight(1f).height(1.dp).background(colors.borderDefault))
            }

            Spacer(Modifier.height(20.dp))

            // Google Button
            RootXButton(
                text = "Continue with Google",
                onClick = { },
                variant = ButtonVariant.SECONDARY,
                leadingIcon = { GoogleIcon(Modifier.size(18.dp)) },
            )

            Spacer(Modifier.height(32.dp))

            Row(
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Already have an account? ",
                    style = RootXTypography.bodySmall.copy(fontSize = 13.sp),
                    color = colors.textSecondary,
                )
                Text(
                    text = "Sign in",
                    style = RootXTypography.labelLarge.copy(
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.accent
                    ),
                    modifier = Modifier.clickable(onClick = onNavigateToLogin),
                )
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}
