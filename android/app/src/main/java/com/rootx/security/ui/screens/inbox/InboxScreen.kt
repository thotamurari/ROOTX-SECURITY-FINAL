package com.rootx.security.ui.screens.inbox

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

data class SecurityAlertItem(
    val id: String,
    val title: String,
    val summary: String,
    val content: String,
    val date: String,
    val source: String,
    val severity: String,
    val category: String,
    var read: Boolean = false,
    val iconType: String = "cve",
)

@Composable
fun InboxScreen(onBack: () -> Unit) {
    val colors = RootXTheme.colors

    var selectedTab by remember { mutableStateOf("All") }
    var expandedId by remember { mutableStateOf<String?>("1") }

    val alerts = remember {
        mutableStateListOf(
            SecurityAlertItem(
                id = "1",
                title = "Critical RCE in Apache Struts — Active Exploitation Detected",
                summary = "CVE-2024-53677 allows unauthenticated remote code execution. CVSS 9.8. Patches available.",
                content = "Apache has released an emergency security update to address CVE-2024-53677, a critical remote code execution vulnerability affecting Apache Struts versions 2.0.0 through 6.3.0.2.\n\nThe vulnerability exists in the file upload mechanism and allows an unauthenticated attacker to execute arbitrary code on affected servers. Proof-of-concept exploits are already circulating.\n\nImpact: Full server compromise\nAction: Update to Struts 6.4.0 immediately",
                date = "2h ago",
                source = "BleepingComputer",
                severity = "critical",
                category = "CVE",
                read = false,
                iconType = "bug",
            ),
            SecurityAlertItem(
                id = "2",
                title = "LockBit 4.0 Targets Indian Banking Infrastructure",
                summary = "New ransomware campaign targeting Indian financial institutions via spear-phishing emails disguised as RBI communications.",
                content = "CERT-In has issued a critical advisory warning Indian banks about a new wave of LockBit 4.0 ransomware attacks. The threat actors are leveraging spear-phishing emails disguised as Reserve Bank of India communications.\n\nThe new variant features improved encryption speeds, anti-analysis techniques, and can exfiltrate data before encrypting systems. At least three cooperative banks have been affected.\n\nMitigation: Implement network segmentation, maintain offline backups, enable MFA on all critical systems.",
                date = "4h ago",
                source = "CERT-In",
                severity = "critical",
                category = "Ransomware",
                read = false,
                iconType = "flame",
            ),
            SecurityAlertItem(
                id = "3",
                title = "Google Patches Actively Exploited Chrome Zero-Day",
                summary = "Type confusion vulnerability in V8 JavaScript engine allows remote code execution via crafted HTML page.",
                content = "Google has released Chrome version 125.0.6422.112 to address CVE-2024-5274, a type confusion vulnerability in V8 being actively exploited in targeted attacks against journalists and activists.\n\nThe exploit allows remote attackers to execute arbitrary code via a specially crafted HTML page. Update Chrome immediately.\n\nAffected: All Chrome versions prior to 125.0.6422.112\nSeverity: High\nExploit: In the wild",
                date = "6h ago",
                source = "The Hacker News",
                severity = "high",
                category = "Zero-Day",
                read = false,
                iconType = "bolt",
            ),
            SecurityAlertItem(
                id = "4",
                title = "Massive UPI Fraud Ring — 50,000 Victims Across India",
                summary = "Police dismantle sophisticated phishing network targeting UPI users with fake payment confirmation pages.",
                content = "Cybercrime division has arrested 12 members of a UPI fraud ring that operated across 8 states. The group used fake payment pages mimicking PhonePe, Google Pay, and Paytm.\n\nVictims received SMS messages claiming their UPI accounts would be suspended. The fraud ring processed over ₹15 crore in unauthorized transactions.\n\nProtection: Never share UPI PINs via any link. Use RootX Scan to verify suspicious URLs.",
                date = "10h ago",
                source = "CyberScoop",
                severity = "high",
                category = "Phishing",
                read = true,
                iconType = "phishing",
            ),
            SecurityAlertItem(
                id = "5",
                title = "New Android Spyware \"DragonEgg\" Found Pre-Installed",
                summary = "Pre-installed spyware discovered on budget Android phones with capability to record calls and exfiltrate personal data.",
                content = "Lookout Security has discovered \"DragonEgg\" spyware pre-installed on several budget smartphone models sold in India. The spyware can record calls, capture screenshots, access camera/microphone.\n\nAn estimated 2 million devices may be affected. The spyware communicates with C2 servers in China.\n\nAction: Factory reset with a clean ROM or replace the device. Run RootX AndroidSEC scan to check your device.",
                date = "14h ago",
                source = "SecurityWeek",
                severity = "critical",
                category = "Malware",
                read = true,
                iconType = "bug",
            ),
            SecurityAlertItem(
                id = "6",
                title = "WhatsApp Vulnerability — Silent Message Interception",
                summary = "Critical flaw allows attackers to intercept encrypted messages through a malicious GIF exploit.",
                content = "Check Point researchers disclosed a critical WhatsApp vulnerability that could allow attackers to intercept end-to-end encrypted messages via a crafted GIF image.\n\nWhen the victim opens the GIF in chat preview, the exploit executes silently, granting access to message databases.\n\nAffected: WhatsApp versions prior to 2.24.8.77\nAction: Update WhatsApp immediately from Play Store.",
                date = "18h ago",
                source = "The Hacker News",
                severity = "high",
                category = "Vulnerability",
                read = true,
                iconType = "warning",
            ),
        )
    }

    val unreadCount = alerts.count { !it.read }
    val criticalCount = alerts.count { it.severity == "critical" }

    val filteredAlerts = alerts.filter { alert ->
        when (selectedTab) {
            "Unread (3)", "Unread" -> !alert.read
            "Critical (3)", "Critical" -> alert.severity == "critical"
            "High" -> alert.severity == "high"
            else -> true
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // ── 1. Back to Dashboard ──
        item {
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onBack() }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.ChevronLeft,
                    contentDescription = "Back",
                    tint = colors.accent,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "Dashboard",
                    style = RootXTypography.bodyMedium.copy(
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    ),
                    color = colors.accent
                )
            }
        }

        // ── 2. Header & Action Row ──
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.accentSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Inbox,
                            contentDescription = "Inbox",
                            tint = colors.accent,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Tactical Inbox",
                            style = RootXTypography.titleLarge.copy(
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            color = colors.textPrimary,
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "$unreadCount unread · $criticalCount critical · ${alerts.size} total",
                            style = RootXTypography.bodySmall.copy(fontSize = 12.sp),
                            color = colors.textTertiary,
                        )
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Refresh Button
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.bgSurface2)
                        .border(1.dp, colors.borderDefault, RoundedCornerShape(10.dp))
                        .clickable { /* Refresh alerts */ },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Refresh,
                        contentDescription = "Refresh",
                        tint = colors.textSecondary,
                        modifier = Modifier.size(18.dp)
                    )
                }

                // Mark All Read
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable {
                            alerts.indices.forEach { i ->
                                alerts[i] = alerts[i].copy(read = true)
                            }
                        }
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.MailOutline,
                        contentDescription = null,
                        tint = colors.textSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "Mark all read",
                        style = RootXTypography.bodySmall.copy(
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Medium
                        ),
                        color = colors.textSecondary
                    )
                }
            }
        }

        // ── 3. Filter Tabs (All, Unread (3), Critical (3), High) ──
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                val tabLabels = listOf("All", "Unread ($unreadCount)", "Critical ($criticalCount)", "High")
                tabLabels.forEach { tab ->
                    val isActive = selectedTab.startsWith(tab.take(4)) || selectedTab == tab
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(100.dp))
                            .background(if (isActive) colors.accent else colors.bgSurface2)
                            .border(
                                1.dp,
                                if (isActive) colors.accent else colors.borderDefault,
                                RoundedCornerShape(100.dp)
                            )
                            .clickable { selectedTab = tab }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = tab,
                            style = RootXTypography.labelSmall.copy(
                                fontSize = 12.sp,
                                fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
                            ),
                            color = if (isActive) colors.accentForeground else colors.textSecondary,
                        )
                    }
                }
            }
        }

        // ── 4. Alert Cards ──
        items(filteredAlerts, key = { it.id }) { alert ->
            val isExpanded = expandedId == alert.id
            val isCritical = alert.severity == "critical"
            val isHigh = alert.severity == "high"

            val iconBg = if (isCritical) colors.dangerSoft else colors.warningSoft
            val iconTint = if (isCritical) colors.danger else colors.warning
            val iconVector: ImageVector = when (alert.iconType) {
                "flame" -> Icons.Outlined.LocalFireDepartment
                "bolt" -> Icons.Outlined.Bolt
                "warning" -> Icons.Outlined.Warning
                else -> Icons.Outlined.BugReport
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.bgSurface)
                    .border(
                        1.dp,
                        if (!alert.read) colors.accent.copy(alpha = 0.35f) else colors.borderDefault,
                        RoundedCornerShape(16.dp)
                    )
                    .clickable {
                        expandedId = if (isExpanded) null else alert.id
                        val idx = alerts.indexOfFirst { it.id == alert.id }
                        if (idx != -1) {
                            alerts[idx] = alerts[idx].copy(read = true)
                        }
                    }
                    .padding(16.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top,
                    ) {
                        Row(verticalAlignment = Alignment.Top, modifier = Modifier.weight(1f)) {
                            // Icon Box
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(iconBg),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = iconVector,
                                    contentDescription = null,
                                    tint = iconTint,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(Modifier.width(12.dp))

                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (!alert.read) {
                                        Box(
                                            modifier = Modifier
                                                .size(6.dp)
                                                .clip(CircleShape)
                                                .background(colors.accent)
                                        )
                                        Spacer(Modifier.width(6.dp))
                                    }
                                    Text(
                                        text = alert.title,
                                        style = RootXTypography.titleSmall.copy(
                                            fontSize = 13.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            lineHeight = 18.sp
                                        ),
                                        color = colors.textPrimary,
                                    )
                                }

                                Spacer(Modifier.height(6.dp))

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    // Severity Chip
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isCritical) colors.dangerSoft else colors.warningSoft)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = alert.severity.replaceFirstChar { it.uppercase() },
                                            style = RootXTypography.micro.copy(
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            color = if (isCritical) colors.danger else colors.warning
                                        )
                                    }

                                    Spacer(Modifier.width(8.dp))

                                    // Category
                                    Text(
                                        text = alert.category,
                                        style = RootXTypography.micro.copy(fontSize = 11.sp),
                                        color = colors.textTertiary
                                    )

                                    Spacer(Modifier.width(8.dp))

                                    // Date
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Outlined.Schedule,
                                            contentDescription = null,
                                            tint = colors.textTertiary,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(Modifier.width(3.dp))
                                        Text(
                                            text = alert.date,
                                            style = RootXTypography.micro.copy(fontSize = 10.5.sp),
                                            color = colors.textTertiary
                                        )
                                    }
                                }
                            }
                        }

                        Icon(
                            imageVector = if (isExpanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                            contentDescription = "Expand",
                            tint = colors.textSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    Text(
                        text = alert.summary,
                        style = RootXTypography.bodySmall.copy(
                            fontSize = 12.sp,
                            lineHeight = 17.sp
                        ),
                        color = colors.textSecondary,
                    )

                    AnimatedVisibility(visible = isExpanded) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 10.dp)
                        ) {
                            androidx.compose.material3.HorizontalDivider(color = colors.borderDefault, thickness = 1.dp)
                            Spacer(Modifier.height(10.dp))
                            Text(
                                text = alert.content,
                                style = RootXTypography.bodySmall.copy(
                                    fontSize = 11.5.sp,
                                    lineHeight = 16.5.sp
                                ),
                                color = colors.textTertiary,
                            )
                        }
                    }
                }
            }
        }
    }
}
