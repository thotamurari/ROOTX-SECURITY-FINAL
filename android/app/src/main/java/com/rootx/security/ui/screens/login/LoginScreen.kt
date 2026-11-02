package com.rootx.security.ui.screens.login

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.AuthViewModel

enum class LoginView { WELCOME, LOGIN, FORGOT }

@Composable
fun LoginScreen(
    onNavigateToRegister: () -> Unit,
    onLoginSuccess: () -> Unit,
    authViewModel: AuthViewModel,
) {
    val colors = RootXTheme.colors
    val error by authViewModel.error.collectAsState()
    val isLoading by authViewModel.isLoading.collectAsState()
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()

    var view by remember { mutableStateOf(LoginView.LOGIN) }
    var email by remember { mutableStateOf(authViewModel.user.value?.email?.ifEmpty { "testtest@gmail.com" } ?: "testtest@gmail.com") }
    var password by remember { mutableStateOf("") }
    var resetEmail by remember { mutableStateOf("") }
    var resetSent by remember { mutableStateOf(false) }
    var showPassword by remember { mutableStateOf(false) }

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) onLoginSuccess()
    }

    when (view) {
        LoginView.WELCOME -> {
            WelcomeView(
                onGoToLogin = { view = LoginView.LOGIN },
                onGoToRegister = onNavigateToRegister,
            )
        }
        LoginView.FORGOT -> {
            ForgotPasswordView(
                resetEmail = resetEmail,
                onResetEmailChange = { resetEmail = it },
                resetSent = resetSent,
                isLoading = isLoading,
                error = error,
                onSendReset = {
                    if (resetEmail.isNotBlank()) {
                        authViewModel.resetPassword(resetEmail)
                        resetSent = true
                    }
                },
                onBackToLogin = {
                    view = LoginView.LOGIN
                    resetSent = false
                    authViewModel.clearError()
                },
            )
        }
        LoginView.LOGIN -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(colors.bgBase)
                    .statusBarsPadding()
                    .navigationBarsPadding(),
            ) {
                // Header bar
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
                            .clickable { view = LoginView.WELCOME },
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
                        text = "Sign in to RootX",
                        style = RootXTypography.labelLarge.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
                        color = colors.textSecondary,
                    )
                }

                // Main Form Content
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 24.dp, vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Spacer(Modifier.height(10.dp))

                    // Logo with genuine RootX brand image & glow
                    RootXLogo(size = 56.dp, glow = true)

                    Spacer(Modifier.height(14.dp))

                    Text(
                        text = "Welcome back",
                        style = RootXTypography.headlineMedium.copy(fontSize = 21.sp, fontWeight = FontWeight.Bold),
                        color = colors.textPrimary,
                    )

                    Spacer(Modifier.height(4.dp))

                    Text(
                        text = "Sign in to resume monitoring your devices.",
                        style = RootXTypography.bodySmall.copy(fontSize = 13.sp),
                        color = colors.textSecondary,
                    )

                    Spacer(Modifier.height(28.dp))

                    // Error Box if any
                    AnimatedVisibility(visible = error != null) {
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
                                    text = error ?: "",
                                    style = RootXTypography.bodySmall,
                                    color = colors.danger,
                                )
                            }
                            Spacer(Modifier.height(16.dp))
                        }
                    }

                    // Email Field
                    RootXField(
                        value = email,
                        onValueChange = { email = it; authViewModel.clearError() },
                        placeholder = "name@example.com",
                        label = "Email address",
                        leadingIcon = {
                            Icon(Icons.Outlined.Mail, "Email", Modifier.size(16.dp), tint = colors.textTertiary)
                        },
                    )

                    Spacer(Modifier.height(14.dp))

                    // Password Field
                    RootXField(
                        value = password,
                        onValueChange = { password = it; authViewModel.clearError() },
                        placeholder = "Enter your password",
                        label = "Password",
                        isPassword = !showPassword,
                        leadingIcon = {
                            Icon(Icons.Outlined.Lock, "Password", Modifier.size(16.dp), tint = colors.textTertiary)
                        },
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

                    Spacer(Modifier.height(10.dp))

                    // Forgot Password
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        Text(
                            text = "Forgot password?",
                            style = RootXTypography.labelSmall.copy(
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = colors.accent,
                            modifier = Modifier.clickable {
                                resetEmail = email
                                view = LoginView.FORGOT
                                authViewModel.clearError()
                            },
                        )
                    }

                    Spacer(Modifier.height(18.dp))

                    // Login Button
                    RootXButton(
                        text = if (isLoading) "Signing in…" else "Log in",
                        onClick = { authViewModel.loginWithEmail(email, password) },
                        isLoading = isLoading,
                        enabled = email.isNotBlank() && password.isNotBlank(),
                    )

                    Spacer(Modifier.height(20.dp))

                    // OR CONTINUE WITH divider
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

                    // Continue with Google Button
                    RootXButton(
                        text = "Continue with Google",
                        onClick = {
                            // Google sign-in trigger
                        },
                        variant = ButtonVariant.SECONDARY,
                        leadingIcon = { GoogleIcon(Modifier.size(18.dp)) },
                    )

                    Spacer(Modifier.height(36.dp))

                    // Register Link
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "Don't have an account? ",
                            style = RootXTypography.bodySmall.copy(fontSize = 13.sp),
                            color = colors.textSecondary,
                        )
                        Text(
                            text = "Create one",
                            style = RootXTypography.labelLarge.copy(
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.accent
                            ),
                            modifier = Modifier.clickable(onClick = onNavigateToRegister),
                        )
                    }

                    Spacer(Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun WelcomeView(
    onGoToLogin: () -> Unit,
    onGoToRegister: () -> Unit,
) {
    val colors = RootXTheme.colors

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.weight(1f))

        RootXLogo(size = 84.dp, glow = true)

        Spacer(Modifier.height(28.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "RootX",
                style = RootXTypography.displayMedium.copy(fontWeight = FontWeight.Bold),
                color = colors.textPrimary,
            )
            Text(
                text = "Security",
                style = RootXTypography.displayMedium.copy(fontWeight = FontWeight.Bold),
                color = colors.accent,
            )
        }

        Spacer(Modifier.height(10.dp))

        Text(
            text = "AI-powered threat detection that keeps your device, apps and data continuously protected.",
            style = RootXTypography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp),
        )

        Spacer(Modifier.height(32.dp))

        // 3 Pill Feature Tiles
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FeaturePill(icon = Icons.Outlined.Shield, label = "Real-time", modifier = Modifier.weight(1f))
            FeaturePill(icon = Icons.Outlined.RemoveRedEye, label = "Tracker map", modifier = Modifier.weight(1f))
            FeaturePill(icon = Icons.Outlined.Bolt, label = "AI triage", modifier = Modifier.weight(1f))
        }

        Spacer(Modifier.height(36.dp))

        // Action Buttons
        RootXButton(
            text = "Log in",
            onClick = onGoToLogin,
        )

        Spacer(Modifier.height(12.dp))

        RootXButton(
            text = "Create account",
            onClick = onGoToRegister,
            variant = ButtonVariant.SECONDARY,
        )

        Spacer(Modifier.weight(1.2f))

        // Footer
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = "SEC_LEVEL: ALPHA\nNODE: 0x82…F2",
                style = RootXTypography.mono.copy(fontSize = 10.sp, lineHeight = 13.sp),
                color = colors.textTertiary,
            )
            Text(
                text = "ROOTX SYSTEMS\nV2.4.0",
                style = RootXTypography.mono.copy(fontSize = 10.sp, lineHeight = 13.sp, textAlign = TextAlign.End),
                color = colors.textTertiary,
            )
        }
    }
}

@Composable
private fun FeaturePill(
    icon: ImageVector,
    label: String,
    modifier: Modifier = Modifier,
) {
    val colors = RootXTheme.colors
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(colors.bgSurface)
            .border(1.dp, colors.borderDefault, RoundedCornerShape(12.dp))
            .padding(vertical = 12.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(icon, label, Modifier.size(16.dp), tint = colors.accent)
        Spacer(Modifier.height(6.dp))
        Text(
            text = label,
            style = RootXTypography.labelSmall.copy(fontSize = 11.sp),
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun ForgotPasswordView(
    resetEmail: String,
    onResetEmailChange: (String) -> Unit,
    resetSent: Boolean,
    isLoading: Boolean,
    error: String?,
    onSendReset: () -> Unit,
    onBackToLogin: () -> Unit,
) {
    val colors = RootXTheme.colors

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
                    .clickable(onClick = onBackToLogin),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.ChevronLeft, "Back", tint = colors.textSecondary, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(6.dp))
            Text(
                text = "Reset password",
                style = RootXTypography.labelLarge.copy(fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
                color = colors.textSecondary,
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            if (resetSent) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(colors.successSoft),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.CheckCircle, "Success", Modifier.size(32.dp), tint = colors.success)
                }

                Spacer(Modifier.height(20.dp))

                Text(
                    text = "Check your inbox",
                    style = RootXTypography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                    color = colors.textPrimary,
                )

                Spacer(Modifier.height(8.dp))

                Text(
                    text = "We sent a password reset link to $resetEmail. Follow the instructions in the email to choose a new password.",
                    style = RootXTypography.bodyMedium,
                    color = colors.textSecondary,
                    textAlign = TextAlign.Center,
                )

                Spacer(Modifier.height(28.dp))

                RootXButton(
                    text = "Back to login",
                    onClick = onBackToLogin,
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.accentSoft),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Outlined.Mail, "Mail", Modifier.size(28.dp), tint = colors.accent)
                }

                Spacer(Modifier.height(18.dp))

                Text(
                    text = "Forgot your password?",
                    style = RootXTypography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                    color = colors.textPrimary,
                )

                Spacer(Modifier.height(6.dp))

                Text(
                    text = "Enter the email tied to your account and we'll send you a secure reset link.",
                    style = RootXTypography.bodyMedium,
                    color = colors.textSecondary,
                    textAlign = TextAlign.Center,
                )

                Spacer(Modifier.height(28.dp))

                RootXField(
                    value = resetEmail,
                    onValueChange = onResetEmailChange,
                    label = "Email address",
                    placeholder = "name@example.com",
                    leadingIcon = {
                        Icon(Icons.Outlined.Mail, "Email", Modifier.size(16.dp), tint = colors.textTertiary)
                    },
                )

                Spacer(Modifier.height(20.dp))

                RootXButton(
                    text = if (isLoading) "Sending…" else "Send reset link",
                    onClick = onSendReset,
                    isLoading = isLoading,
                    enabled = resetEmail.isNotBlank(),
                )

                Spacer(Modifier.height(20.dp))

                Text(
                    text = "Remember your password? Log in",
                    style = RootXTypography.bodySmall,
                    color = colors.accent,
                    modifier = Modifier.clickable(onClick = onBackToLogin),
                )
            }
        }
    }
}
