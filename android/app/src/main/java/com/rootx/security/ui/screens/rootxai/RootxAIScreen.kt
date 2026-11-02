package com.rootx.security.ui.screens.rootxai

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rootx.security.data.model.ChatMessage
import com.rootx.security.ui.components.RootXField
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.RootxAIViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class QuickPromptItem(
    val emoji: String,
    val text: String,
    val keywords: List<String> = emptyList(),
)

@Composable
fun RootxAIScreen(
    viewModel: RootxAIViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val messages by viewModel.messages.collectAsState()
    val inputText by viewModel.inputText.collectAsState()
    val isStreaming by viewModel.isStreaming.collectAsState()
    val listState = rememberLazyListState()

    val quickPrompts = remember {
        listOf(
            QuickPromptItem("🛡️", "Analyze my device security posture", listOf("posture", "security", "score", "audit", "status", "safe")),
            QuickPromptItem("📱", "Which applications on my phone have the highest risk?", listOf("risk", "app", "apps", "package", "malware", "highest")),
            QuickPromptItem("🔍", "What did my last scan find?", listOf("scan", "latest", "last", "threat", "finding", "verdict")),
            QuickPromptItem("💾", "What is my current storage and RAM status?", listOf("storage", "ram", "memory", "space", "hardware")),
            QuickPromptItem("🔋", "How is my battery and thermal health?", listOf("battery", "thermal", "charge", "temp", "heat")),
            QuickPromptItem("🔒", "How can I harden my Android permissions?", listOf("harden", "permission", "protect", "privacy")),
        )
    }

    // Keyword asking suggestions
    val matchingPrompts = remember(inputText) {
        if (inputText.isBlank()) {
            emptyList()
        } else {
            val q = inputText.lowercase().trim()
            quickPrompts.filter { prompt ->
                prompt.text.lowercase().contains(q) ||
                prompt.keywords.any { it.contains(q) || q.contains(it) }
            }.take(3)
        }
    }

    // Auto-scroll to latest message
    LaunchedEffect(messages.size, messages.lastOrNull()?.content?.length) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase),
    ) {
        // Chat & Inquiries Scrollable Area
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // ── EMPTY STATE: Welcome Greeting Card & Full Inquiry List ──
            if (messages.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(colors.bgSurface)
                            .border(1.dp, colors.borderDefault, RoundedCornerShape(16.dp))
                            .padding(16.dp)
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(colors.accentSoft),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Outlined.Psychology,
                                        contentDescription = null,
                                        tint = colors.accent,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "RootX-AI Security Assistant",
                                        style = RootXTypography.labelLarge.copy(fontWeight = FontWeight.Bold),
                                        color = colors.textPrimary
                                    )
                                    Text(
                                        text = "Mobile-Aware Cybersecurity Intelligence",
                                        style = RootXTypography.micro.copy(fontSize = 11.sp),
                                        color = colors.accent
                                    )
                                }
                            }
                            Spacer(Modifier.height(10.dp))
                            Text(
                                text = "RootX-AI inspects your phone's live hardware telemetry, installed app permissions, and security scan logs in real-time. Tap any query below or ask directly.",
                                style = RootXTypography.bodyMedium.copy(
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp,
                                ),
                                color = colors.textSecondary
                            )
                        }
                    }
                }

                item {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "SUGGESTED SECURITY INQUIRIES",
                        style = RootXTypography.micro.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.1.sp
                        ),
                        color = colors.textTertiary
                    )
                    Spacer(Modifier.height(4.dp))
                }

                items(quickPrompts) { prompt ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(colors.bgSurface)
                            .border(1.dp, colors.borderDefault, RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.sendPrompt(prompt.text)
                            }
                            .padding(horizontal = 14.dp, vertical = 12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = prompt.emoji,
                                fontSize = 16.sp
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = prompt.text,
                                style = RootXTypography.bodyMedium.copy(
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                color = colors.textPrimary
                            )
                        }
                    }
                }
            } else {
                // ── ACTIVE CHAT: Structured Markdown Message Bubbles ──
                itemsIndexed(messages) { index, msg ->
                    val isUser = msg.role == "user"
                    val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date(msg.timestamp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                    ) {
                        Column(
                            modifier = Modifier.widthIn(max = 345.dp),
                            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
                        ) {
                            // Sender Tag
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                if (!isUser) {
                                    Icon(
                                        imageVector = Icons.Outlined.Shield,
                                        contentDescription = null,
                                        tint = colors.accent,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(Modifier.width(4.dp))
                                }
                                Text(
                                    text = if (isUser) "You" else "RootX-AI Guardian",
                                    style = RootXTypography.micro.copy(
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.SemiBold
                                    ),
                                    color = if (isUser) colors.textTertiary else colors.accent
                                )
                            }

                            // Message Card
                            Box(
                                modifier = Modifier
                                    .clip(
                                        RoundedCornerShape(
                                            topStart = 16.dp,
                                            topEnd = 16.dp,
                                            bottomStart = if (isUser) 16.dp else 4.dp,
                                            bottomEnd = if (isUser) 4.dp else 16.dp
                                        )
                                    )
                                    .background(if (isUser) colors.accent else colors.bgSurface)
                                    .border(
                                        1.dp,
                                        if (isUser) colors.accent else colors.borderDefault,
                                        RoundedCornerShape(
                                            topStart = 16.dp,
                                            topEnd = 16.dp,
                                            bottomStart = if (isUser) 16.dp else 4.dp,
                                            bottomEnd = if (isUser) 4.dp else 16.dp
                                        )
                                    )
                                    .padding(horizontal = 14.dp, vertical = 12.dp)
                            ) {
                                Column {
                                    if (isUser) {
                                        Text(
                                            text = msg.content,
                                            style = RootXTypography.bodyMedium.copy(
                                                fontSize = 13.5.sp,
                                                lineHeight = 19.sp,
                                            ),
                                            color = colors.accentForeground
                                        )
                                    } else {
                                        // Rich Markdown & Card Rendering for AI Response
                                        RenderMarkdownContent(content = msg.content)
                                    }

                                    Spacer(Modifier.height(6.dp))

                                    // Timestamp & Status
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (!isUser && isStreaming && msg == messages.lastOrNull()) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                CircularProgressIndicator(
                                                    modifier = Modifier.size(10.dp),
                                                    strokeWidth = 1.5.dp,
                                                    color = colors.accent
                                                )
                                                Spacer(Modifier.width(6.dp))
                                                Text(
                                                    text = "Analyzing...",
                                                    style = RootXTypography.micro.copy(fontSize = 10.sp),
                                                    color = colors.accent
                                                )
                                            }
                                        }
                                        Text(
                                            text = timeStr,
                                            style = RootXTypography.micro.copy(fontSize = 9.5.sp),
                                            color = if (isUser) colors.accentForeground.copy(alpha = 0.75f) else colors.textTertiary
                                        )
                                    }
                                }
                            }

                            // ── Action Bar on Assistant Responses (Copy, Regenerate, Feedback) ──
                            if (!isUser && msg.content.isNotBlank() && (!isStreaming || msg != messages.lastOrNull())) {
                                Row(
                                    modifier = Modifier
                                        .padding(top = 4.dp, start = 4.dp)
                                        .fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Start,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Copy Action
                                    IconButton(
                                        onClick = {
                                            clipboardManager.setText(AnnotatedString(msg.content))
                                            Toast.makeText(context, "Copied response to clipboard", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.ContentCopy,
                                            contentDescription = "Copy response",
                                            tint = colors.textTertiary,
                                            modifier = Modifier.size(13.dp)
                                        )
                                    }

                                    // Regenerate (available on last AI message)
                                    if (msg == messages.lastOrNull { it.role == "assistant" }) {
                                        IconButton(
                                            onClick = { viewModel.regenerateLastResponse() },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Outlined.Refresh,
                                                contentDescription = "Regenerate response",
                                                tint = colors.textTertiary,
                                                modifier = Modifier.size(13.dp)
                                            )
                                        }
                                    }

                                    Spacer(Modifier.width(4.dp))

                                    // Feedback Thumbs Up
                                    IconButton(
                                        onClick = {
                                            viewModel.setFeedback(index, if (msg.feedback == 1) 0 else 1)
                                            Toast.makeText(context, "Thank you for your feedback!", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (msg.feedback == 1) Icons.Filled.ThumbUp else Icons.Outlined.ThumbUp,
                                            contentDescription = "Helpful",
                                            tint = if (msg.feedback == 1) colors.accent else colors.textTertiary,
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }

                                    // Feedback Thumbs Down
                                    IconButton(
                                        onClick = {
                                            viewModel.setFeedback(index, if (msg.feedback == -1) 0 else -1)
                                            Toast.makeText(context, "Feedback noted for improvement.", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(
                                            imageVector = if (msg.feedback == -1) Icons.Filled.ThumbDown else Icons.Outlined.ThumbDown,
                                            contentDescription = "Unhelpful",
                                            tint = if (msg.feedback == -1) colors.danger else colors.textTertiary,
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── SUGGESTIONS BAR (Dynamic Filtered Chips) ──
        AnimatedVisibility(
            visible = matchingPrompts.isNotEmpty() || (messages.isNotEmpty() && inputText.isBlank()),
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.bgSurface.copy(alpha = 0.95f))
                    .border(width = 0.5.dp, color = colors.borderDefault)
                    .padding(vertical = 6.dp, horizontal = 12.dp)
            ) {
                val promptsToShow = if (matchingPrompts.isNotEmpty()) matchingPrompts else quickPrompts
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(vertical = 2.dp)
                ) {
                    items(promptsToShow) { prompt ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(100.dp))
                                .background(colors.bgSurface2)
                                .border(1.dp, colors.borderDefault, RoundedCornerShape(100.dp))
                                .clickable {
                                    viewModel.sendPrompt(prompt.text)
                                }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(text = prompt.emoji, fontSize = 12.sp)
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = prompt.text,
                                    style = RootXTypography.micro.copy(
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    color = colors.textSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        // ── BOTTOM INPUT COMPOSER WITH IME INSETS PADDING ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(colors.bgSurface)
                .border(1.dp, colors.borderDefault)
                .imePadding()
                .padding(horizontal = 14.dp, vertical = 8.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        RootXField(
                            value = inputText,
                            onValueChange = { viewModel.setInputText(it) },
                            placeholder = "Ask anything about your device security...",
                        )
                    }

                    Spacer(Modifier.width(10.dp))

                    // Solid Send Button with Loading Indicator
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (inputText.isNotBlank() && !isStreaming) colors.accent else colors.accent.copy(alpha = 0.45f))
                            .clickable(enabled = inputText.isNotBlank() && !isStreaming) {
                                viewModel.sendMessage()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isStreaming) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp,
                                color = colors.accentForeground
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Filled.Send,
                                contentDescription = "Send",
                                tint = colors.accentForeground,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(5.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "RootX-AI · Device telemetry & grounded intelligence active",
                        style = RootXTypography.micro.copy(fontSize = 10.sp),
                        color = colors.textTertiary,
                    )

                    if (messages.isNotEmpty()) {
                        Text(
                            text = "Clear Chat",
                            style = RootXTypography.micro.copy(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = colors.accent,
                            modifier = Modifier.clickable { viewModel.clearChat() }
                        )
                    }
                }
            }
        }
    }
}

/**
 * Custom Markdown and Structured Security Card renderer in Jetpack Compose.
 * Strips raw markdown asterisks, formats bold text, headings, lists, and cards.
 */
@Composable
fun RenderMarkdownContent(content: String) {
    val colors = RootXTheme.colors
    val lines = remember(content) { content.split("\n") }

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        var inBulletGroup = false

        lines.forEach { rawLine ->
            val line = rawLine.trimEnd()

            when {
                // Section Header H3 (### ...)
                line.startsWith("### ") -> {
                    val title = line.removePrefix("### ").trim()
                    Spacer(Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(4.dp, 14.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(colors.accent)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = title,
                            style = RootXTypography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                letterSpacing = 0.3.sp
                            ),
                            color = colors.textPrimary
                        )
                    }
                    Spacer(Modifier.height(2.dp))
                }

                // Subheader H4 (#### ...)
                line.startsWith("#### ") -> {
                    val subTitle = line.removePrefix("#### ").trim()
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = subTitle,
                        style = RootXTypography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.5.sp
                        ),
                        color = colors.accent
                    )
                }

                // Bullet point
                line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ") -> {
                    val itemText = line.substring(2).trim()
                    Row(
                        modifier = Modifier.padding(start = 2.dp, top = 1.dp, bottom = 1.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(
                            text = "•",
                            style = RootXTypography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            ),
                            color = colors.accent,
                            modifier = Modifier.padding(end = 6.dp)
                        )
                        FormattedBoldText(
                            text = itemText,
                            textColor = colors.textPrimary,
                            fontSize = 13.sp
                        )
                    }
                }

                // Numbered list item (e.g. "1. ")
                line.matches(Regex("""^\d+\.\s+.*""")) -> {
                    val num = line.substringBefore(".").trim()
                    val itemText = line.substringAfter(".").trim()
                    Row(
                        modifier = Modifier.padding(start = 2.dp, top = 2.dp, bottom = 2.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Box(
                            modifier = Modifier
                                .padding(end = 6.dp, top = 2.dp)
                                .size(16.dp)
                                .clip(CircleShape)
                                .background(colors.accentSoft),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = num,
                                style = RootXTypography.micro.copy(
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = colors.accent
                            )
                        }
                        FormattedBoldText(
                            text = itemText,
                            textColor = colors.textPrimary,
                            fontSize = 13.sp
                        )
                    }
                }

                // Empty line spacer
                line.isBlank() -> {
                    Spacer(Modifier.height(2.dp))
                }

                // Regular paragraph
                else -> {
                    FormattedBoldText(
                        text = line,
                        textColor = colors.textPrimary,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}

/**
 * Parses markdown **bold** and `code` spans into styled Compose AnnotatedString.
 */
@Composable
fun FormattedBoldText(
    text: String,
    textColor: Color,
    fontSize: androidx.compose.ui.unit.TextUnit = 13.sp
) {
    val colors = RootXTheme.colors
    val annotated = remember(text, textColor) {
        buildAnnotatedString {
            var index = 0
            val len = text.length

            while (index < len) {
                val boldStart = text.indexOf("**", index)
                val codeStart = text.indexOf("`", index)

                // Pick the earliest delimiter
                val nextSpecial = when {
                    boldStart != -1 && codeStart != -1 -> Math.min(boldStart, codeStart)
                    boldStart != -1 -> boldStart
                    codeStart != -1 -> codeStart
                    else -> -1
                }

                if (nextSpecial == -1) {
                    append(text.substring(index))
                    break
                }

                // Append text before special marker
                if (nextSpecial > index) {
                    append(text.substring(index, nextSpecial))
                }

                if (nextSpecial == boldStart) {
                    val boldEnd = text.indexOf("**", boldStart + 2)
                    if (boldEnd != -1) {
                        withStyle(
                            SpanStyle(
                                fontWeight = FontWeight.Bold,
                                color = textColor
                            )
                        ) {
                            append(text.substring(boldStart + 2, boldEnd))
                        }
                        index = boldEnd + 2
                    } else {
                        append("**")
                        index = boldStart + 2
                    }
                } else {
                    val codeEnd = text.indexOf("`", codeStart + 1)
                    if (codeEnd != -1) {
                        withStyle(
                            SpanStyle(
                                fontFamily = FontFamily.Monospace,
                                background = colors.bgSurface2,
                                color = colors.accent,
                                fontSize = 11.5.sp
                            )
                        ) {
                            append(" ${text.substring(codeStart + 1, codeEnd)} ")
                        }
                        index = codeEnd + 1
                    } else {
                        append("`")
                        index = codeStart + 1
                    }
                }
            }
        }
    }

    Text(
        text = annotated,
        style = RootXTypography.bodyMedium.copy(
            fontSize = fontSize,
            lineHeight = 19.sp
        ),
        color = textColor
    )
}
