# PetVision MVP - AI-Powered Pet Health Screening

<div align="center">
  
  **[🌐 Web Demo](https://petvision-mvp-product.vercel.app)** • **[📱 Mobile Demo](https://exp.host/@petvision/app)** • **[📚 Documentation](./docs/)**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
  [![React Native](https://img.shields.io/badge/React%20Native-Expo%2054-61DAFB)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  
</div>

---

## 🐾 Overview

PetVision is a **revolutionary AI-powered pet health screening application** that enables pet owners to perform comprehensive health checks using just their smartphone camera. By leveraging advanced computer vision (Z.AI GLM-4.7 model), PetVision analyzes pets' eyes, skin, teeth, gait, and overall health to provide instant, professional-grade health assessments.

### ✨ Key Features

- 📸 **AI-Powered Vision Analysis** - Multi-scan type analysis (eye, skin, teeth, gait, multi)
- 📊 **Health Severity Ratings** - Color-coded system (green/yellow/red) with confidence scores
- 📑 **Professional PDF Reports** - Generate, download, and share comprehensive health reports
- 🐕 **Pet Profiles** - Track multiple pets with medical history
- 📈 **Timeline & Trends** - Monitor health changes over time with visual comparisons
- 🩺 **Vet Recommendations** - AI-generated veterinary consultation suggestions
- 🔐 **Secure Authentication** - OAuth (Google, GitHub) + Email/password with biometrics
- ☁️ **Cloud-Native** - Supabase backend with real-time synchronization

---

## 🎯 Use Cases

| Scenario | Solution |
|----------|----------|
| **Routine Health Checks** | Quick scans to monitor pet health between vet visits |
| **Early Detection** | Identify potential health issues before they become serious |
| **Multi-Pet Households** | Track health histories for all pets in one place |
| **Pre-Vet Consultation** | Generate reports to share with veterinarians |
| **Travel & Emergencies** | Quick health assessments when away from usual vet |

---

## 🏗️ Tech Stack

### Frontend
- **Web:** Next.js 16.1.6, React 18, Tailwind CSS
- **Mobile:** React Native, Expo 54
- **Shared:** TypeScript 5.0

### Backend & Services
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with OAuth
- **Storage:** Supabase Storage with RLS
- **Caching:** Redis (optional)

### AI & Vision
- **Vision Model:** Z.AI GLM-4.7
- **Image Processing:** Sharp, Puppeteer
- **PDF Generation:** Puppeteer, Handlebars templates
- **QR Codes:** qrcode library

### Development
- **Package Manager:** npm
- **Testing:** Jest, React Native Testing Library
- **Code Quality:** ESLint, Prettier, TypeScript

---

## 📱 Platforms

| Platform | Status | Link |
|----------|--------|------|
| **Web App** | ✅ Production Ready | [petvision-mvp-product.vercel.app](https://petvision-mvp-product.vercel.app) |
| **Mobile App** | ✅ Production Ready | [Expo Go](https://expo.dev/@petvision/app) |
| **Docker** | ✅ Available | See [akash-sdl-deployment](https://github.com/ToXMon/petvision-mvp-product/tree/akash-sdl-deployment) branch |
| **Akash Network** | ✅ Available | See [akash-sdl-deployment](https://github.com/ToXMon/petvision-mvp-product/tree/akash-sdl-deployment) branch |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Supabase account (free)
- Z.AI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/ToXMon/petvision-mvp-product.git
cd petvision-mvp-product

# Install web app dependencies
cd petvision-web
npm install

# Install mobile app dependencies
cd ../petvision-mobile
npm install
```

### Environment Setup

For detailed environment configuration, see the [fullstack-env-setup branch](https://github.com/ToXMon/petvision-mvp-product/tree/fullstack-env-setup).

**Quick Setup:**

```bash
# Copy environment example files
cp petvision-web/.env.example petvision-web/.env.local
cp petvision-mobile/.env.example petvision-mobile/.env

# Edit with your credentials
nano petvision-web/.env.local
nano petvision-mobile/.env
```

### Run Locally

```bash
# Web App
cd petvision-web
npm run dev
# Visit: http://localhost:3000

# Mobile App
cd petvision-mobile
npm start
# Scan QR code with Expo Go app
```

---

## 📁 Project Structure

```
petvision-mvp-product/
├── petvision-web/              # Next.js web application
│   ├── app/                    # App router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and helpers
│   ├── services/               # API services
│   └── __tests__/              # Unit tests
│
├── petvision-mobile/           # React Native mobile app
│   ├── components/             # React Native components
│   ├── screens/                # App screens
│   ├── services/               # API services
│   ├── hooks/                  # Custom React hooks
│   └── tests/                  # Unit tests
│
├── packages/shared/            # Shared TypeScript packages
│   ├── src/
│   │   ├── services/           # Shared services
│   │   │   ├── vision/         # Z.AI Vision Service
│   │   │   ├── PDFService.ts   # PDF Generation
│   │   │   ├── ReportService.ts
│   │   │   ├── QRCodeService.ts
│   │   │   ├── VetRecommendationService.ts
│   │   │   ├── TimelineService.ts
│   │   │   └── ComparisonService.ts
│   │   ├── templates/          # HTML templates for PDF
│   │   └── types/              # TypeScript interfaces
│   └── docs/                   # Service documentation
│
├── docs/                       # Project documentation
│   ├── API_DOCUMENTATION.md
│   ├── INTEGRATION_GUIDE.md
│   └── ...
│
└── database/                   # Database schema and migrations
    └── schema.sql
```

---

## 🎨 Core Features

### 1. AI Vision Analysis

Supports **5 scan types** with comprehensive analysis:

| Scan Type | Analyzes | Key Indicators |
|-----------|---------|----------------|
| 👁️ **Eye** | Ocular health | Redness, discharge, cloudiness, pupils, corneal health |
| 🐾 **Skin** | Dermatological condition | Redness, irritation, lesions, hair loss, parasites, lumps |
| 🦷 **Teeth** | Oral cavity | Plaque, tartar, gum health, loose/broken teeth, tumors |
| 🚶 **Gait** | Mobility & posture | Limping, stiffness, reduced mobility, walking pattern |
| 🔄 **Multi** | Full-body assessment | Comprehensive analysis across all areas |

**Severity Ratings:**
- 🟢 **Green** - No concerns, routine checkup sufficient
- 🟡 **Yellow** - Monitor closely, vet consultation recommended within 1-2 weeks
- 🔴 **Red** - Immediate veterinary attention required

### 2. PDF Report Generation

Generate professional health reports with:
- 📊 Cover page with pet profile
- 🔍 Detailed findings with confidence scores
- 💡 AI-generated recommendations
- 📈 Trend analysis comparing previous scans
- 🖼️ Annotated scan images
- 🔗 QR codes for digital access

### 3. Timeline & Health Tracking

- 📅 Chronological view of all scans
- 📊 Visual trend indicators (improving, stable, declining)
- 🔍 Before/after image comparisons
- 📈 Health statistics and change metrics
- 🏷️ Filter by scan type, date, severity

### 4. Pet Profiles

- 🐕 Multiple pet management
- 📝 Medical history tracking
- 🏷️ Breed, age, weight information
- 🖼️ Pet avatars
- 📊 Health summary dashboard

---

## 🔐 Security

- **Authentication:** Supabase Auth with OAuth providers
- **Authorization:** Row Level Security (RLS) policies
- **Storage:** Encrypted Supabase Storage
- **API Keys:** Environment-based configuration
- **Data Privacy:** No data sharing with third parties
- **Biometrics:** Face ID/Touch ID support (mobile)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Full Stack Setup Guide](https://github.com/ToXMon/petvision-mvp-product/blob/fullstack-env-setup/docs/FULLSTACK_ENVIRONMENT_SETUP.md) | Complete environment configuration guide |
| [Akash Deployment Guide](https://github.com/ToXMon/petvision-mvp-product/blob/akash-sdl-deployment/docs/AKASH_DEPLOYMENT_GUIDE.md) | Deploy to Akash Network |
| [Vision Service API](https://github.com/ToXMon/petvision-mvp-product/blob/main/packages/shared/src/services/vision/documentation/API.md) | Z.AI Vision API reference |
| [PDF Generation API](https://github.com/ToXMon/petvision-mvp-product/blob/main/docs/PDF_GENERATION_API.md) | PDF generation endpoints |
| [Supabase Schema](https://github.com/ToXMon/petvision-mvp-product/blob/main/database/schema.sql) | Database schema and migrations |

---

## 🌍 Branches

| Branch | Purpose | Link |
|--------|---------|------|
| **main** | Production-ready MVP code | [View](https://github.com/ToXMon/petvision-mvp-product/tree/main) |
| **akash-sdl-deployment** | Docker & Akash Network deployment | [View](https://github.com/ToXMon/petvision-mvp-product/tree/akash-sdl-deployment) |
| **fullstack-env-setup** | Environment variable configuration | [View](https://github.com/ToXMon/petvision-mvp-product/tree/fullstack-env-setup) |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Z.AI** - For the GLM-4.7 vision model
- **Supabase** - For the backend infrastructure
- **Expo** - For React Native tooling
- **Vercel** - For web hosting
- **Akash Network** - For decentralized cloud computing

---

## 📞 Support

- 📧 Email: [support@petvision.app](mailto:support@petvision.app)
- 💬 Discord: [Join Community](https://discord.gg/petvision)
- 🐛 Issue Tracker: [GitHub Issues](https://github.com/ToXMon/petvision-mvp-product/issues)
- 📚 Docs: [Documentation](https://docs.petvision.app)

---

<div align="center">
  <strong>Built with ❤️ for pet parents everywhere</strong>
  
  [⭐ Star this repo](https://github.com/ToXMon/petvision-mvp-product) • [🐛 Report a bug](https://github.com/ToXMon/petvision-mvp-product/issues) • [💡 Suggest a feature](https://github.com/ToXMon/petvision-mvp-product/discussions)
</div>
