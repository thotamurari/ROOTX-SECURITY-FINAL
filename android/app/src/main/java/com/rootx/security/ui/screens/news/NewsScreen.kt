package com.rootx.security.ui.screens.news

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rootx.security.data.model.NewsItem
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.NewsViewModel

@Composable
fun NewsScreen(
    onBack: () -> Unit,
    viewModel: NewsViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val context = LocalContext.current
    val news by viewModel.filteredNews.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val activeCategory by viewModel.activeCategory.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val isLive by viewModel.isLive.collectAsState()
    val selectedNews by viewModel.selectedNews.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .statusBarsPadding()
    ) {
        // Top action / header bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            RootXButton(
                text = "Dashboard",
                onClick = onBack,
                variant = ButtonVariant.GHOST,
                size = ButtonSize.SMALL,
                fullWidth = false,
                leadingIcon = {
                    Icon(Icons.Filled.ChevronLeft, "Back", Modifier.size(18.dp), tint = colors.textSecondary)
                }
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                if (isLive) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(colors.successSoft)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(colors.success)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text("Live Intel", style = RootXTypography.micro, color = colors.success)
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                }

                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.bgSurface2)
                        .clickable(enabled = !isRefreshing) { viewModel.refresh() },
                    contentAlignment = Alignment.Center,
                ) {
                    if (isRefreshing) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = colors.accent, strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Outlined.Refresh, "Refresh", Modifier.size(18.dp), tint = colors.textPrimary)
                    }
                }
            }
        }

        // Title Header
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
            Text("Cyber Threat Intelligence", style = RootXTypography.headlineSmall, color = colors.textPrimary)
            Spacer(Modifier.height(2.dp))
            Text("Real-time telemetry and zero-day vulnerabilities", style = RootXTypography.bodySmall, color = colors.textTertiary)
        }

        Spacer(Modifier.height(10.dp))

        // Categories horizontally scrollable
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categories.forEach { cat ->
                val isSelected = cat == activeCategory
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isSelected) colors.accent else colors.bgSurface2)
                        .clickable { viewModel.setCategory(cat) }
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = cat.replaceFirstChar { it.uppercase() },
                        style = RootXTypography.labelSmall,
                        color = if (isSelected) colors.accentForeground else colors.textSecondary
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // News Feed list
        if (isLoading && news.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                LoadingSpinner(text = "Fetching intelligence reports...")
            }
        } else if (news.isEmpty()) {
            EmptyState(
                title = "No stories found",
                message = "No advisories recorded under this category.",
                action = {
                    RootXButton(
                        text = "Refresh Feed",
                        onClick = { viewModel.refresh() },
                        variant = ButtonVariant.SECONDARY,
                        size = ButtonSize.SMALL,
                        fullWidth = false,
                    )
                }
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 90.dp)
            ) {
                items(news, key = { it.id }) { item ->
                    NewsCard(item = item, onClick = { viewModel.selectNews(item) })
                }
            }
        }
    }

    // Detail Modal Dialog
    selectedNews?.let { item ->
        AlertDialog(
            onDismissRequest = { viewModel.selectNews(null) },
            containerColor = colors.bgSurface,
            shape = RoundedCornerShape(20.dp),
            title = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        SeverityBadge(item.severity)
                        Text(item.date, style = RootXTypography.micro, color = colors.textTertiary)
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(item.title, style = RootXTypography.titleLarge, color = colors.textPrimary)
                }
            },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Source, null, Modifier.size(16.dp), tint = colors.textTertiary)
                        Spacer(Modifier.width(6.dp))
                        Text("Source: ${item.source}", style = RootXTypography.bodySmall, color = colors.textSecondary)
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = item.content.ifEmpty { item.summary },
                        style = RootXTypography.bodyMedium,
                        color = colors.textSecondary,
                        lineHeight = RootXTypography.bodyMedium.lineHeight
                    )
                }
            },
            confirmButton = {
                if (!item.url.isNullOrEmpty()) {
                    RootXButton(
                        text = "Read Full Article",
                        onClick = {
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(item.url))
                            context.startActivity(browserIntent)
                        },
                        size = ButtonSize.SMALL,
                        fullWidth = false,
                    )
                }
            },
            dismissButton = {
                RootXButton(
                    text = "Close",
                    onClick = { viewModel.selectNews(null) },
                    variant = ButtonVariant.GHOST,
                    size = ButtonSize.SMALL,
                    fullWidth = false,
                )
            }
        )
    }
}

@Composable
private fun NewsCard(item: NewsItem, onClick: () -> Unit) {
    val colors = RootXTheme.colors
    RootXCard(onClick = onClick, padding = 16.dp) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            SeverityBadge(item.severity)
            Text(item.date, style = RootXTypography.micro, color = colors.textTertiary)
        }

        Spacer(Modifier.height(10.dp))

        Text(
            text = item.title,
            style = RootXTypography.titleMedium,
            color = colors.textPrimary,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(Modifier.height(6.dp))

        Text(
            text = item.summary,
            style = RootXTypography.bodySmall,
            color = colors.textSecondary,
            maxLines = 3,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(item.source, style = RootXTypography.micro, color = colors.textTertiary)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Inspect", style = RootXTypography.labelSmall, color = colors.accent)
                Spacer(Modifier.width(2.dp))
                Icon(Icons.Filled.ArrowForward, null, Modifier.size(12.dp), tint = colors.accent)
            }
        }
    }
}

@Composable
private fun SeverityBadge(severity: String) {
    val colors = RootXTheme.colors
    val (bg, fg) = when (severity.lowercase()) {
        "critical" -> colors.dangerSoft to colors.danger
        "high" -> colors.warningSoft to colors.warning
        "medium" -> colors.infoSoft to colors.info
        else -> colors.successSoft to colors.success
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bg)
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = severity.uppercase(),
            style = RootXTypography.micro,
            color = fg
        )
    }
}
