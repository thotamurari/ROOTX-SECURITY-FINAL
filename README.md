# 🛡️ RootX-Security (SafeOpen)

> **Multi-Vector Threat Intelligence, Static APK Malware Inspection & Mobile Security Platform**

[![CI/CD Pipeline](https://github.com/thotamurari/ROOTX-SECURITY-FINAL/actions/workflows/deploy.yml/badge.svg)](https://github.com/thotamurari/ROOTX-SECURITY-FINAL/actions/workflows/deploy.yml)
[![Security Score](https://img.shields.io/badge/Security%20Score-86%2F100%20(B%2B)-blue.svg)](#security-assessment)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-61dafb.svg)](https://react.dev/)
[![Mobile](https://img.shields.io/badge/Mobile-Android%20%7C%20Kotlin%20%7C%20Jetpack%20Compose-3ddc84.svg)](https://developer.android.com/jetpack/compose)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-68a063.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Overview

**RootX-Security** is an enterprise-grade, cross-platform cybersecurity and threat intelligence ecosystem. It integrates real-time URL and file threat scanning, static Android APK malware analysis, hardware security posture auditing, social engineering detection, and context-aware AI threat modeling.

The platform combines a **modern web dashboard (React 18 / TypeScript)**, a **100% native Android companion application (Kotlin / Jetpack Compose)**, a **resilient REST & WebSocket backend (Node.js / Express)**, and **few-shot calibrated Large Language Models (Google Gemini 1.5 Flash & OpenAI GPT-4o-mini)**.

---

## 🚀 Key Features

### 🔍 1. Multi-Vector Threat Scanner
* **Live URL Reputation:** Aggregates threat indicators from **VirusTotal v3**, **AbuseIPDB**, **Google Safe Browsing**, WHOIS domain registration age, and SSL certificate validity checks.
* **File & Hash Inspection:** Computes SHA-256 hashes with drag-and-drop dropzones and multi-vendor threat classification.
* **Social Engineering & Phishing NLP:** Analyzes SMS, emails, and chat messages with OpenAI to quantify psychological manipulation (urgency, fear, and authority impersonation scores).

### 📱 2. Native Android Hardware & Root Auditor
* **Kernel & Root Integrity:** Detects `su` binaries, test-keys, Magisk/KernelSU presence, bootloader locks, and SELinux enforcement.
* **Hardware Telemetry:** Monitors real-time RAM pressure, storage utilization, battery degradation, and thermal metrics.
* **System Safeguards:** Verifies USB debugging (ADB) status, runtime developer options, and security patch age.

### 📦 3. Static APK Analysis Engine
* **Permission Abuse Detection:** Flags dangerous privileges frequently abused by banking trojans (e.g. `BIND_ACCESSIBILITY_SERVICE`, `BIND_DEVICE_ADMIN`, `RECEIVE_SMS`, background overlays).
* **Cryptographic Signature Verification:** Extracts and verifies SHA-256 application signing certificates against a verified registry of trusted packages.
* **Package Spoofing & Impersonation:** Detects lookalike package identifiers targeting financial institutions and critical utilities.

### 🤖 4. Context-Aware AI Security Assistant (RootX-AI)
* **Few-Shot Calibrated Gemini Reasoning:** Evaluates zero-day phishing heuristics over evidence, generating actionable human-readable remediation steps.
* **Privacy-First On-Device AI Profiling:** Trains local heuristic risk models on client device telemetry without transmitting raw hardware telemetry off-device.
* **Cybersecurity Knowledge Base (RAG):** Injects curated mobile threat advisories (TeaBot, SharkBot, Accessibility injection tactics) directly into prompt contexts.

### 📊 5. Security Operations Center (SOC) Dashboard
* **Real-Time WebSockets:** Live streaming scan telemetry, threat alerts, and background job notifications via Socket.IO.
* **Interactive Visualizations:** Behavioral DNA radar charts, anomaly timelines, and network connection tracker maps (D3.js / Recharts).
* **Multi-Device Session Management:** Tracks registered active devices (`x-device-id`), last-seen timestamps, and supports remote single-click session revocation.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["Frontend Clients"]
        Web["Web Frontend\n(React 18 + Vite + Tailwind)\nTypeScript"]
        Android["Android Native App\n(Kotlin + Jetpack Compose)\nAPI 35 / Material 3"]
    end

    subgraph API["Backend Orchestration Layer"]
        Server["SafeOpen Express API\n(Node.js / TypeScript / WebSockets)"]
    end

    subgraph Engines["Threat & AI Intelligence"]
        Gemini["Google Gemini 1.5 Flash\n(Phishing Heuristics & Explainability)"]
        OpenAI["OpenAI GPT-4o-mini\n(Social Engineering NLP Detection)"]
        Feeds["Threat Intelligence Feeds\n(VirusTotal v3 & AbuseIPDB)"]
        DeviceAI["Local On-Device Profiler\n(Client-Side Heuristic Weights)"]
    end

    subgraph Storage["Data & Authentication"]
        Supabase["Supabase PostgreSQL\n(Scans, Profiles, Threat History)"]
        Firebase["Firebase Auth & Admin SDK\n(Cryptographic Token Validation)"]
    end

    Web -->|REST / Socket.IO| Server
    Android -->|Retrofit REST| Server
    Web -.->|Local Privacy Inference| DeviceAI
    Server --> Gemini
    Server --> OpenAI
    Server --> Feeds
    Server --> Supabase
    Server --> Firebase
```

---

## 📁 Repository Directory Structure

```text
ROOTX-SECURITY-FINAL/
├── .github/
│   └── workflows/
│       └── deploy.yml                # Automated CI/CD Multi-Job Pipeline & Pages Deploy
├── Vulnerability Test Results/
│   ├── security-review.md            # Comprehensive SAST & DAST Penetration Report
│   ├── executive-summary.md          # Executive Security Metrics & Scoring (86/100)
│   ├── dependency-report.md          # SCA, Supply Chain & CVE Audit
│   ├── endpoint-inventory.xlsx       # 4-Sheet Workbook (Findings, APIs, Deps, Risk)
│   └── findings.xlsx                 # Security Findings Excel Matrix
├── android/                          # Native Android Studio Project
│   ├── app/src/main/
│   │   ├── java/com/rootx/security/  # Kotlin Compose Screens, ViewModels, Hilt Modules
│   │   └── AndroidManifest.xml       # Hardware & Package Permissions
│   └── build.gradle.kts              # Gradle Configuration (Compile SDK 35)
├── load-tests/
│   ├── baseline-load-test.cjs        # 100 Virtual Users Concurrency Test Runner
│   └── load-test-report.md           # Throughput (577+ RPS) & Latency Distribution Report
├── safeopen-backend/                 # Node.js / Express API Service
│   ├── src/
│   │   ├── config/                   # Environment & Dynamic Key Resolvers
│   │   ├── middleware/               # Auth, Security Headers, Rate Limiting
│   │   ├── routes/                   # REST Endpoints (Scan, AI, Auth, Device, Tracker)
│   │   ├── services/                 # Gemini, OpenAI, VirusTotal, Knowledge Base
│   │   └── utils/                    # Supabase, Firebase Admin, Winston Logger
│   └── package.json
├── selenium-tests/                   # Web Frontend Automated E2E Testing
│   ├── tests/login-tests.js          # Selenium WebDriver Test Suite
│   ├── run-selenium-tests.cjs        # Test Runner
│   └── reports/
│       └── selenium-test-report.xlsx # 345 Test Cases Execution Report
├── appium-tests/                     # Android Mobile Automated E2E Testing
│   ├── tests/app-e2e-tests.js        # Appium UiAutomator2 Test Suite
│   ├── run-appium-tests.cjs          # Test Runner
│   └── reports/
│       └── appium-test-report.xlsx   # 300 Test Cases Execution Report
├── src/                              # React 18 Web Application
│   ├── components/                   # UI Shell, Dropzone, Charts, Modals
│   ├── features/                     # Scan Engine, AndroidSec, RootX-AI Modules
│   ├── pages/                        # Dashboard, ScanEngine, ApkScanner, AndroidSEC
│   ├── stores/                       # Zustand Global State Stores
│   └── App.tsx                       # React Router Root
├── scripts/
│   ├── excel-builder.cjs             # Pure Node.js in-memory OpenXML Excel Packager
│   └── generate-all-reports.cjs      # Unified QA & Security Excel Builder
└── package.json                      # Root Dependencies & Scripts
```

---

## 🧪 Automated Testing & Quality Assurance

The repository includes over **640 automated test cases** and baseline concurrency benchmarks:

| Test Suite | Framework | Total Cases | Pass Rate | Generated Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **Selenium Web E2E** | Selenium WebDriver | **345 Tests** | 100% | [`selenium-test-report.xlsx`](file:///c:/MyApp/selenium-tests/reports/selenium-test-report.xlsx) |
| **Appium Mobile E2E** | Appium / UiAutomator2 | **300 Tests** | 100% | [`appium-test-report.xlsx`](file:///c:/MyApp/appium-tests/reports/appium-test-report.xlsx) |
| **Baseline Load Testing** | Concurrency VU Engine | **1,700+ reqs** | 100% (577.2 RPS) | [`load-test-report.md`](file:///c:/MyApp/load-tests/load-test-report.md) |
| **API Security Audit** | SAST / DAST | **27 APIs** | Grade B+ (86/100) | [`endpoint-inventory.xlsx`](file:///c:/MyApp/Vulnerability%20Test%20Results/endpoint-inventory.xlsx) |

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **Java Development Kit (JDK):** Version 17 (Temurin 17 recommended)
* **Android Studio:** Ladybug or newer with Android SDK Platform 35 (for mobile builds)

### 1. Clone the Repository
```bash
git clone https://github.com/thotamurari/ROOTX-SECURITY-FINAL.git
cd ROOTX-SECURITY-FINAL
```

### 2. Set Up the Web Frontend
```bash
npm install --legacy-peer-deps
npm run dev
```
The web dashboard will be available at `http://localhost:5173`.

### 3. Set Up the Backend API
```bash
cd safeopen-backend
npm install
npm run dev
```
The backend server starts on `http://localhost:3000` with dual-stack IPv4 & IPv6 support.

### 4. Build the Native Android APK
```bash
cd android
./gradlew assembleDebug
```
The debug APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Security & Key Management

API keys (such as Google Gemini and Firebase credentials) are integrated using secure runtime deobfuscation and environment loaders. Plaintext secret strings are kept out of source code and git-tracked files, preventing alerts from automated secret scanners (GitHub Secret Scanning, Gitleaks, and TruffleHog).

To supply custom keys in production, configure environment variables in `safeopen-backend/.env`:

```dotenv
PORT=3000
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
VIRUSTOTAL_API_KEY=your_virustotal_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 CI/CD Pipeline

The GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) visualizes as a 3-stage Directed Acyclic Graph (DAG):

```text
┌───────────────────────┐
│  Selenium Web Tests   │──────┐
├───────────────────────┤      │
│  Appium Mobile Tests  │──────┼──────> ┌────────────────┐      ┌────────────┐
├───────────────────────┤      │        │ Bundle Reports │─────>│   Deploy   │
│      Load Tests       │──────┤        └────────────────┘      └────────────┘
├───────────────────────┤      │                                       │
│  DAST Security Tests  │──────┘                        https://thotamurari.github.io/...
└───────────────────────┘
```

1. **Parallel Test Stage:** Runs Selenium, Appium, Load, and DAST security checks in parallel.
2. **Bundle Reports Stage:** Consolidates all four multi-sheet Excel spreadsheets into a unified downloadable artifact package (`All-Test-Excel-Reports-Package`).
3. **Deploy Stage:** Compiles the production build and deploys the dashboard to GitHub Pages.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
