package com.rootx.security.ui.screens.community

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

data class CommunityChannel(
    val id: String,
    val name: String,
    val tag: String,
    val url: String,
    val description: String,
    val badge: String,
    val accentColor: Color,
    val icon: ImageVector,
    val metrics: String,
    val buttonText: String,
)

@Composable
fun CommunityScreen(onBack: () -> Unit) {
    val colors = RootXTheme.colors
    val context = LocalContext.current

    val channels = listOf(
        CommunityChannel(
            id = "discord",
            name = "Discord Cyber Command",
            tag = "@RootXSecurity",
            url = "https://discord.com/channels/1540071910627614844/1540071911848022029",
            description = "Join real-time incident analysis rooms, live malware discussions, reverse engineering sessions, and security intelligence exchanges.",
            badge = "Active Hub",
            accentColor = Color(0xFF5865F2),
            icon = Icons.Outlined.Chat,
            metrics = "24/7 Security Ops & Chat",
            buttonText = "Join Discord Room",
        ),
        CommunityChannel(
            id = "instagram",
            name = "Instagram Intelligence",
            tag = "@murari_tech_world_75",
            url = "https://www.instagram.com/murari_tech_world_75/",
            description = "Daily cybersecurity awareness reels, scam exposure breakdowns, privacy tips, and modern cyber defense tutorials for mobile & web.",
            badge = "Official Creator",
            accentColor = Color(0xFFE1306C),
            icon = Icons.Outlined.CameraAlt,
            metrics = "Daily Cyber Tips & Updates",
            buttonText = "Follow on Instagram",
        ),
        CommunityChannel(
            id = "youtube",
            name = "YouTube Defense Labs",
            tag = "@Ethical.Hacker.Murari",
            url = "https://www.youtube.com/@Ethical.Hacker.Murari",
            description = "Comprehensive video tutorials on ethical hacking, zero-day threat analysis, APK security audits, and penetration testing.",
            badge = "Video Masterclasses",
            accentColor = Color(0xFFFF0000),
            icon = Icons.Outlined.PlayCircle,
            metrics = "In-Depth Hacking Tutorials",
            buttonText = "Watch Tutorials",
        ),
        CommunityChannel(
            id = "whatsapp",
            name = "WhatsApp Incident Alerts",
            tag = "RootX Cyber Defense Group",
            url = "https://chat.whatsapp.com/DaPw8TGiNHQHf3jEwCag7W",
            description = "Instant alerts on active phishing campaigns, high-risk malware APKs, scam numbers, and direct guidance from security researchers.",
            badge = "Instant Alerts",
            accentColor = Color(0xFF25D366),
            icon = Icons.Outlined.Forum,
            metrics = "Fastest Breaking Alert Network",
            buttonText = "Join WhatsApp Channel",
        ),
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .statusBarsPadding()
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(8.dp))

        // Back button
        RootXButton(
            text = "Dashboard",
            onClick = onBack,
            variant = ButtonVariant.GHOST,
            size = ButtonSize.SMALL,
            fullWidth = false,
            leadingIcon = {
                Icon(Icons.Filled.ChevronLeft, "Dashboard", Modifier.size(18.dp), tint = colors.textSecondary)
            },
        )

        Spacer(Modifier.height(8.dp))

        // Header
        PageHeader(
            title = "RootX Community & Research Network",
            description = "Connect with cybersecurity researchers, stream video breakdowns, join live discord threat rooms, and access official guidance.",
            icon = { Icon(Icons.Outlined.Group, null, Modifier.size(22.dp), tint = colors.accent) },
        )

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(bottom = 60.dp),
        ) {
            // Hero Hub Overview Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(colors.accentSoft, colors.bgSurface)
                            )
                        )
                        .border(1.dp, colors.accent.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(colors.accentSoft),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Filled.AutoAwesome, null, Modifier.size(24.dp), tint = colors.accent)
                        }
                        Spacer(Modifier.width(14.dp))
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    "Official Research Channels",
                                    style = RootXTypography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = colors.textPrimary,
                                )
                                Spacer(Modifier.width(8.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(colors.accentSoft)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("VERIFIED", style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold), color = colors.accent)
                                }
                            }
                            Spacer(Modifier.height(2.dp))
                            Text(
                                "RootX security research is published daily across verified official networks.",
                                style = RootXTypography.bodySmall,
                                color = colors.textSecondary,
                            )
                        }
                    }
                }
            }

            // 4 Channel Cards
            items(channels) { channel ->
                RootXCard(
                    padding = 16.dp,
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(channel.url))
                        context.startActivity(intent)
                    }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(channel.accentColor.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(channel.icon, channel.name, Modifier.size(22.dp), tint = channel.accentColor)
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(channel.name, style = RootXTypography.titleSmall.copy(fontWeight = FontWeight.Bold), color = colors.textPrimary)
                                Text(channel.tag, style = RootXTypography.micro, color = channel.accentColor)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(colors.bgSurface3)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(channel.badge, style = RootXTypography.micro, color = colors.textSecondary)
                        }
                    }

                    Spacer(Modifier.height(10.dp))
                    Text(channel.description, style = RootXTypography.bodySmall, color = colors.textSecondary)

                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(channel.metrics, style = RootXTypography.micro, color = colors.textTertiary)

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(channel.accentColor)
                                .clickable {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(channel.url))
                                    context.startActivity(intent)
                                }
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                        ) {
                            Text(
                                channel.buttonText,
                                style = RootXTypography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White,
                            )
                            Spacer(Modifier.width(4.dp))
                            Icon(Icons.Filled.ArrowOutward, null, Modifier.size(12.dp), tint = Color.White)
                        }
                    }
                }
            }

            // Community Guidelines
            item {
                RootXCard(padding = 16.dp) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Gavel, null, Modifier.size(18.dp), tint = colors.accent)
                        Spacer(Modifier.width(8.dp))
                        Text("Community Guidelines", style = RootXTypography.titleSmall.copy(fontWeight = FontWeight.Bold), color = colors.textPrimary)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "• Zero-Tolerance for malicious attacks or unauthorized exploitation\n• Responsible vulnerability disclosure policy\n• Respect researcher anonymity and user privacy\n• Keep discussions focused on ethical security engineering",
                        style = RootXTypography.bodySmall,
                        color = colors.textTertiary,
                    )
                }
            }
        }
    }
}
