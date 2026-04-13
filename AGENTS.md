# PetVision MVP — Agent Documentation

## Repo Purpose
AI-powered pet health screening application with dual platforms: a React Native mobile app (Expo) for photo capture and pet management, and a web frontend for PDF report generation. Uses AI vision APIs for image analysis and Akave S3-compatible storage.

## Tech Stack
- **Mobile**: React Native + Expo + TypeScript + React Navigation
- **Web**: Next.js + React + TypeScript
- **AI**: ZAI API + Anthropic (vision analysis)
- **Storage**: AWS SDK v3 S3 (Akave-compatible endpoint)
- **PDF**: Custom PDFService (web + mobile)
- **Caching**: Redis (vision cache)
- **Email**: SMTP (nodemailer)

## Module Map

| Directory | Purpose |
|-----------|---------|
| `petvision-mobile/` | React Native mobile app — camera capture, pet profiles, photo analysis |
| `petvision-mobile/screens/` | UI screens — PetList, PetDetail, AddEditPet, PhotoCapture |
| `petvision-mobile/services/` | Data services — PetService (CRUD), MobilePDFService, storageService |
| `petvision-mobile/hooks/` | Custom hooks — useCameraCapture |
| `petvision-mobile/types/` | TypeScript types — pet.ts, camera.ts |
| `petvision-mobile/utils/` | Utilities — imageQualityValidator |
| `petvision-web/` | Web frontend — PDF report generation, PDFService |
| `packages/shared/` | Shared code between web and mobile |
| `docs/` | API docs, integration guides, PDF generation guides |

## Global Standards
- TypeScript throughout (mobile + web)
- React functional components with hooks
- AWS SDK v3 for S3-compatible storage
- AI vision APIs via ZAI + Anthropic
- Vision cache with configurable TTL (Redis)
- Mobile: Expo managed workflow, React Navigation

## Environment Setup
Env vars in `.env.example`. Key groups:
- **AI**: ZAI_API_KEY, ANTHROPIC_API_KEY (vision analysis)
- **Cache**: REDIS_URL, VISION_CACHE_ENABLED, VISION_CACHE_TTL
- **Email**: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
- **App**: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL

## Key Patterns

### Mobile Camera Flow
PhotoCaptureScreen → useCameraCapture hook → imageQualityValidator → upload to S3 → AI analysis.

### Pet Profile CRUD
PetService handles CRUD operations. PetListScreen displays all pets, PetDetailScreen shows analysis history, AddEditPetScreen for create/edit.

### PDF Report Generation
PDFService (web) / MobilePDFService (mobile) generates health screening reports from analysis data.

### Vision Analysis Pipeline
Image upload → S3 storage → ZAI/Anthropic vision API → cached in Redis (TTL configurable) → structured response with riskLevel, findings, recommendations.
