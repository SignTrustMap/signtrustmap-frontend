# Automated Test & Coverage Report

> **Generated:** 2026-11-07 11:05:17 UTC  
> **Overall Status:** ❌ FAILED  
> **Execution Duration:** 12.82s  
> **Target Package:** `apps/mobile`  

---

## 1. Test Execution Summary

| Category | Total | Passed | Failed | Skipped | Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Test Suites** | 111 | 101 | 10 | 0 | 91.0% |
| **Tests** | 884 | 884 | 0 | 0 | 100.0% |

## 2. Code Coverage Overview

| Metric | Covered / Total | Percentage | Target Benchmark | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Branches** | 5604 / 10089 | **55.54%** | 80.00% | 🟡 Moderate |
| **Functions** | 1448 / 2216 | **65.34%** | 80.00% | 🟡 Moderate |
| **Lines** | 6207 / 9383 | **66.15%** | 80.00% | 🟡 Moderate |
| **Statements** | 6518 / 10104 | **64.50%** | 80.00% | 🟡 Moderate |

### File-by-File Coverage

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `apps/mobile/src/feature/review/hooks/use-review.ts` | 3.50% | 0.00% | 2.85% | 3.70% | - |
| `apps/mobile/src/feature/navigation/utils/route-progress.ts` | 3.70% | 0.00% | 0.00% | 4.00% | - |
| `apps/mobile/src/feature/upload/hooks/use-survey-submission.ts` | 7.81% | 0.00% | 11.76% | 8.62% | - |
| `apps/mobile/src/feature/upload/utils/chunk-upload-manager.ts` | 8.43% | 10.71% | 11.11% | 9.09% | - |
| `apps/mobile/src/feature/upload/hooks/use-save-survey-draft.ts` | 19.17% | 10.38% | 50.00% | 17.91% | - |
| `apps/mobile/src/feature/navigation/components/navigation-map-view.tsx` | 23.60% | 11.04% | 23.52% | 24.56% | - |
| `apps/mobile/src/feature/upload/components/location-picker-modal.tsx` | 31.11% | 17.74% | 17.39% | 32.92% | - |
| `apps/mobile/src/components/navigation-maneuver-banner.tsx` | 33.33% | 100.00% | 0.00% | 33.33% | - |
| `apps/mobile/src/feature/work/pages/recapture-camera-screen.tsx` | 34.30% | 30.98% | 56.25% | 34.32% | - |
| `apps/mobile/src/feature/navigation/utils/navigation-formatters.ts` | 34.21% | 9.37% | 62.50% | 35.48% | - |
| `apps/mobile/src/feature/navigation/hooks/use-native-gps.ts` | 34.09% | 27.77% | 80.00% | 35.89% | - |
| `apps/mobile/src/feature/upload/utils/high-res-cropper.ts` | 37.50% | 32.43% | 36.36% | 37.50% | - |
| `apps/mobile/src/feature/revalidation/context/revalidation-workflow-provider.tsx` | 37.03% | 29.54% | 20.00% | 40.40% | - |
| `apps/mobile/src/feature/revalidation/pages/inspect-revalidate-screen.tsx` | 40.00% | 45.16% | 28.57% | 40.77% | - |
| `apps/mobile/src/services/offline-map-service.ts` | 38.53% | 30.70% | 45.45% | 40.79% | - |
| `apps/mobile/src/feature/upload/utils/submission-response.ts` | 42.10% | 39.13% | 33.33% | 42.10% | - |
| `apps/mobile/src/feature/navigation/components/navigation-map-view.web.tsx` | 40.08% | 19.40% | 44.00% | 42.39% | - |
| `apps/mobile/src/services/location-permission.ts` | 44.44% | 25.00% | 100.00% | 42.85% | - |
| `apps/mobile/src/feature/navigation/pages/navigation-start-screen.tsx` | 38.59% | 34.42% | 30.76% | 43.13% | - |
| `apps/mobile/src/services/maplibre.ts` | 50.00% | 66.66% | 50.00% | 44.44% | - |
| `apps/mobile/src/feature/profile/components/sign-filter-manager.tsx` | 44.05% | 46.59% | 47.05% | 45.04% | - |
| `apps/mobile/src/feature/navigation/pages/navigation-map-screen.tsx` | 44.91% | 32.90% | 41.11% | 46.59% | - |
| `apps/mobile/src/api/spatial/spatial.ts` | 46.66% | 51.56% | 75.00% | 47.50% | - |
| `apps/mobile/src/feature/upload/utils/video-processor.ts` | 47.94% | 50.00% | 80.00% | 47.94% | - |
| `apps/mobile/src/feature/upload/utils/selected-asset-gps.ts` | 47.43% | 45.45% | 60.00% | 48.64% | - |
| `apps/mobile/src/feature/navigation/components/navigation-bottom-sheet.tsx` | 51.85% | 60.93% | 45.00% | 50.00% | - |
| `apps/mobile/src/feature/navigation/components/navigation-upcoming-signs.tsx` | 60.00% | 10.00% | 50.00% | 50.00% | - |
| `apps/mobile/src/feature/upload/pages/survey-submission-details-screen.tsx` | 50.84% | 44.01% | 41.86% | 52.86% | - |
| `apps/mobile/src/components/offline-map-modal.tsx` | 53.33% | 48.57% | 18.18% | 53.33% | - |
| `apps/mobile/src/feature/work/components/mission-card-item.tsx` | 54.00% | 52.43% | 100.00% | 54.00% | - |
| `apps/mobile/src/feature/upload/utils/video-file-gps.ts` | 54.05% | 46.88% | 61.11% | 54.01% | - |
| `apps/mobile/src/feature/revalidation/pages/revalidation-review-screen.tsx` | 54.28% | 46.00% | 35.08% | 54.97% | - |
| `apps/mobile/src/feature/notifications/hooks/use-notifications.ts` | 51.72% | 58.82% | 53.84% | 55.55% | - |
| `apps/mobile/src/feature/upload/utils/survey-image.ts` | 52.23% | 42.16% | 100.00% | 55.93% | - |
| `apps/mobile/src/feature/navigation/hooks/use-navigation-sheet-gesture.ts` | 58.90% | 50.00% | 63.15% | 56.52% | - |
| `apps/mobile/src/feature/profile/components/avatar-crop-modal.tsx` | 56.75% | 71.42% | 45.45% | 59.15% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-sign-details-card.tsx` | 57.31% | 47.32% | 16.66% | 60.25% | - |
| `apps/mobile/src/feature/navigation/pages/navigation-history-screen.tsx` | 58.33% | 51.42% | 55.17% | 62.18% | - |
| `apps/mobile/src/feature/review/context/review-workflow-provider.tsx` | 59.58% | 46.87% | 60.00% | 62.20% | - |
| `apps/mobile/src/feature/review/components/review-instruction-modal.tsx` | 62.50% | 100.00% | 50.00% | 62.50% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-map-view.web.tsx` | 61.53% | 55.76% | 75.00% | 62.58% | - |
| `apps/mobile/src/feature/auth/hooks/use-google-login.ts` | 62.90% | 38.09% | 83.33% | 62.90% | - |
| `apps/mobile/src/hooks/use-offline-maps.ts` | 60.93% | 10.00% | 44.44% | 62.90% | - |
| `apps/mobile/src/feature/revalidation/pages/revalidation-map-screen.tsx` | 62.15% | 50.90% | 53.01% | 63.84% | - |
| `apps/mobile/src/feature/upload/pages/survey-record-details-screen.tsx` | 63.73% | 58.34% | 52.94% | 64.46% | - |
| `apps/mobile/src/feature/navigation/utils/geo.ts` | 65.06% | 51.42% | 90.00% | 64.78% | - |
| `apps/mobile/src/feature/notifications/pages/notifications-screen.tsx` | 58.62% | 54.90% | 73.33% | 65.30% | - |
| `apps/mobile/src/feature/navigation/pages/route-search-screen.tsx` | 61.53% | 51.06% | 53.84% | 66.66% | - |
| `apps/mobile/src/hooks/use-back-button.ts` | 71.42% | 100.00% | 75.00% | 66.66% | - |
| `apps/mobile/src/api/reviews/catalog-storage.ts` | 60.00% | 38.46% | 100.00% | 68.62% | - |
| `apps/mobile/src/feature/upload/components/survey-scan-modal.tsx` | 64.70% | 58.33% | 45.45% | 68.75% | - |
| `apps/mobile/src/feature/upload/utils/gpx.ts` | 68.96% | 61.53% | 50.00% | 68.96% | - |
| `apps/mobile/src/feature/review/pages/submission-review-screen.tsx` | 69.63% | 62.27% | 61.97% | 70.86% | - |
| `apps/mobile/src/feature/upload/hooks/use-survey-media-picker.ts` | 69.42% | 68.51% | 43.75% | 70.94% | - |
| `apps/mobile/src/feature/upload/pages/new-survey-record-screen.tsx` | 66.66% | 72.91% | 57.89% | 71.15% | - |
| `apps/mobile/src/context/session-provider.tsx` | 68.25% | 51.61% | 75.00% | 72.41% | - |
| `apps/mobile/src/config/env.ts` | 69.56% | 56.75% | 50.00% | 72.72% | - |
| `apps/mobile/src/feature/review/components/report-new-sign-type-modal.tsx` | 73.07% | 73.07% | 50.00% | 73.07% | - |
| `apps/mobile/src/utils/freshness.ts` | 73.33% | 73.91% | 50.00% | 73.33% | - |
| `apps/mobile/src/api/revalidation/revalidation.ts` | 72.35% | 64.67% | 70.83% | 73.97% | - |
| `apps/mobile/src/feature/auth/pages/forgot-password.tsx` | 66.25% | 67.00% | 57.57% | 74.12% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-sign-picker-modal.tsx` | 75.55% | 56.81% | 68.75% | 74.41% | - |
| `apps/mobile/src/feature/work/components/surveyor-work.tsx` | 75.00% | 58.82% | 70.00% | 74.46% | - |
| `apps/mobile/src/feature/upload/utils/video-gps.ts` | 74.50% | 56.09% | 83.33% | 74.50% | - |
| `apps/mobile/src/feature/navigation/utils/signs.ts` | 76.92% | 38.09% | 80.00% | 75.00% | - |
| `apps/mobile/src/feature/auth/pages/login.tsx` | 74.69% | 72.15% | 73.91% | 76.71% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-map-view.tsx` | 77.77% | 70.96% | 50.00% | 76.92% | - |
| `apps/mobile/src/app/_layout.tsx` | 80.00% | 40.00% | 63.63% | 77.27% | - |
| `apps/mobile/src/api/navigation/places.ts` | 68.57% | 46.77% | 92.85% | 77.96% | - |
| `apps/mobile/src/feature/navigation/utils/gps.ts` | 80.00% | 84.09% | 100.00% | 78.00% | - |
| `apps/mobile/src/feature/profile/pages/profile-screen.tsx` | 75.78% | 60.41% | 64.10% | 78.65% | - |
| `apps/mobile/src/hooks/use-storage.ts` | 78.94% | 75.00% | 100.00% | 78.94% | - |
| `apps/mobile/src/services/update-service.ts` | 78.57% | 53.70% | 88.88% | 79.68% | - |
| `apps/mobile/src/feature/navigation/components/navigation-top-controls.tsx` | 80.00% | 35.29% | 66.66% | 80.00% | - |
| `apps/mobile/src/hooks/use-app-update.ts` | 80.00% | 50.00% | 100.00% | 80.00% | - |
| `apps/mobile/src/feature/work/pages/missions-screen.tsx` | 81.30% | 57.14% | 90.90% | 80.41% | - |
| `apps/mobile/src/feature/streaming/pages/livestream-screen.tsx` | 76.92% | 75.00% | 77.77% | 80.55% | - |
| `apps/mobile/src/feature/profile/pages/edit-profile-screen.tsx` | 79.48% | 63.52% | 71.42% | 80.82% | - |
| `apps/mobile/src/feature/work/pages/recaptures-screen.tsx` | 81.57% | 76.36% | 64.28% | 81.08% | - |
| `apps/mobile/src/constants/sign-categories.ts` | 70.83% | 87.32% | 100.00% | 84.21% | - |
| `apps/mobile/src/components/skeleton.tsx` | 86.66% | 35.71% | 75.00% | 85.71% | - |
| `apps/mobile/src/feature/review/pages/sign-catalog-screen.tsx` | 84.44% | 67.18% | 78.57% | 85.71% | - |
| `apps/mobile/src/hooks/use-debounce.ts` | 85.71% | 0.00% | 75.00% | 85.71% | - |
| `apps/mobile/src/feature/work/pages/work-screen.tsx` | 85.10% | 75.00% | 68.75% | 86.66% | - |
| `apps/mobile/src/feature/upload/utils/image-file-gps.ts` | 79.01% | 61.59% | 90.00% | 87.31% | - |
| `apps/mobile/src/components/toast.tsx` | 88.88% | 88.88% | 75.00% | 87.50% | - |
| `apps/mobile/src/feature/auth/hooks/use-forgot-password.ts` | 87.50% | 100.00% | 87.50% | 87.50% | - |
| `apps/mobile/src/feature/credits/pages/custom-amount-screen.tsx` | 82.35% | 50.00% | 71.42% | 87.50% | - |
| `apps/mobile/src/feature/upload/components/android-gallery-modal.tsx` | 83.03% | 70.52% | 81.25% | 87.50% | - |
| `apps/mobile/src/feature/review/pages/reviewer-stats-screen.tsx` | 84.72% | 70.19% | 73.33% | 87.69% | - |
| `apps/mobile/src/components/input.tsx` | 84.21% | 77.14% | 66.66% | 88.23% | - |
| `apps/mobile/src/feature/work/pages/submission-complete-screen.tsx` | 88.46% | 76.81% | 75.00% | 88.46% | - |
| `apps/mobile/src/components/update-modal.tsx` | 80.00% | 72.41% | 66.66% | 88.88% | - |
| `apps/mobile/src/components/navigation-sign-verify-card.tsx` | 84.78% | 59.45% | 84.61% | 89.74% | - |
| `apps/mobile/src/context/sign-filter-provider.tsx` | 90.90% | 63.30% | 82.85% | 90.74% | - |
| `apps/mobile/src/components/badge.tsx` | 90.90% | 83.33% | 100.00% | 90.90% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-sign-marker.tsx` | 90.90% | 90.69% | 66.66% | 90.90% | - |
| `apps/mobile/src/feature/upload/schemas/survey-record.schema.ts` | 89.13% | 75.00% | 100.00% | 90.90% | - |
| `apps/mobile/src/api/survey-submission/survey-submission.ts` | 88.57% | 80.00% | 100.00% | 91.17% | - |
| `apps/mobile/src/feature/navigation/components/bookmark-route-modal.tsx` | 91.42% | 77.55% | 100.00% | 91.30% | - |
| `apps/mobile/src/components/error-boundary.tsx` | 88.70% | 76.78% | 88.23% | 91.52% | - |
| `apps/mobile/src/feature/navigation/utils/demo-route-signs.ts` | 93.10% | 78.57% | 100.00% | 92.59% | - |
| `apps/mobile/src/feature/credits/pages/top-up-screen.tsx` | 91.95% | 85.59% | 78.94% | 92.77% | - |
| `apps/mobile/src/types/savedRouteType.ts` | 94.73% | 93.10% | 100.00% | 92.85% | - |
| `apps/mobile/src/api/navigation/navigation.ts` | 93.47% | 55.88% | 100.00% | 93.33% | - |
| `apps/mobile/src/feature/work/components/work-missions-section.tsx` | 90.47% | 63.63% | 87.50% | 94.44% | - |
| `apps/mobile/src/constants/message.ts` | 93.63% | 100.00% | 22.22% | 95.37% | - |
| `apps/mobile/src/feature/upload/pages/survey-history-screen.tsx` | 95.65% | 87.35% | 90.00% | 95.45% | - |
| `apps/mobile/src/feature/auth/pages/register.tsx` | 92.00% | 84.00% | 78.57% | 95.55% | - |
| `apps/mobile/src/feature/navigation/hooks/use-auto-reroute.ts` | 94.23% | 89.47% | 100.00% | 95.91% | - |
| `apps/mobile/src/feature/revalidation/pages/recheck-evidence-screen.tsx` | 96.42% | 45.45% | 90.00% | 96.42% | - |
| `apps/mobile/src/feature/saved-routes/hooks/use-saved-routes.ts` | 88.23% | 62.50% | 94.11% | 96.77% | - |
| `apps/mobile/src/feature/upload/pages/survey-route-map-screen.tsx` | 93.50% | 88.34% | 94.11% | 97.10% | - |
| `apps/mobile/src/feature/work/hooks/use-daily-tasks.ts` | 95.00% | 74.54% | 100.00% | 97.43% | - |
| `apps/mobile/src/feature/upload/utils/image-gps.ts` | 94.52% | 83.50% | 100.00% | 98.21% | - |
| `apps/mobile/src/feature/upload/utils/crop-sync-manager.ts` | 98.48% | 93.33% | 100.00% | 98.48% | - |
| `apps/mobile/src/api/api-client.ts` | 100.00% | 79.31% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/api.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/query-client.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/auth/auth.ts` | 100.00% | 85.71% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/daily-tasks/daily-tasks.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/navigation/hazards.ts` | 100.00% | 95.65% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/navigation/saved-routes.ts` | 100.00% | 58.82% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/navigation/signs.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/notifications/notifications.ts` | 100.00% | 25.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/reviews/catalog.ts` | 100.00% | 85.71% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/reviews/review-workflow.ts` | 100.00% | 98.14% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/reviews/review.ts` | 100.00% | 46.66% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/saved-routes/saved-routes.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/sign-map/sign-map.ts` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/spatial/offline-tiles.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/wallet/wallet.ts` | 100.00% | 77.77% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/index.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/_layout.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/notifications.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/_layout.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/livestream.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/credits/custom-amount.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/credits/history.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/credits/index.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/credits/top-up.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/home/index.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/home/notifications.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/home/search.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/home/start.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/profile/edit.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/profile/index.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/_layout.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/index.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/inspect-revalidate.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/missions.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/navigation-history.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/new-survey.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/recapture-camera.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/recaptures.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/recorded-signs.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/revalidation-map.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/revalidation-review.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/revalidation-summary.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/reviewer-stats.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/sign-catalog.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/submission-complete.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/submission-finish.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/submission-review.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/submission-summary.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/survey-finish.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/survey-history.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/survey-submission-details.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/new-survey/details.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(authenticated)/(tabs)/work/new-survey/route-map.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(public)/forgot-password.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(public)/login.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/app/(public)/register.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/app-bottom-tabs.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/button.tsx` | 100.00% | 90.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/divider.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/image-inspection-modal.tsx` | 100.00% | 80.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/navigation-sign-alert-banner.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/themed-text.tsx` | 100.00% | 95.23% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/themed-view.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/constants/const.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/constants/theme.ts` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/context/navigation-active-provider.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/auth/hooks/use-login.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/auth/hooks/use-register.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/components/credit-flow-state.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/components/credit-screen-header.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/components/transaction-list.tsx` | 100.00% | 84.61% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/hooks/use-wallet.ts` | 100.00% | 89.47% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/pages/credit-history-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/pages/credits-overview-screen.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/components/home-sign-filter-card.tsx` | 100.00% | 72.91% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/components/map-location-pin.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/components/navigation-complete-modal.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/hooks/use-navigation.ts` | 88.67% | 65.62% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/hooks/use-places.ts` | 95.23% | 68.75% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/hooks/use-saved-routes.ts` | 100.00% | 83.33% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/hooks/use-sign-proximity-alert.ts` | 100.00% | 90.32% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/hooks/use-signs.ts` | 94.44% | 92.30% | 90.90% | 100.00% | - |
| `apps/mobile/src/feature/navigation/styles/navigation-map-screen.styles.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/navigation/utils/location.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/profile/pages/profile-detail-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-decision-badge.tsx` | 100.00% | 60.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/revalidation/hooks/use-revalidation.ts` | 100.00% | 83.07% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/revalidation/pages/sign-catalog-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/components/review-bottom-tabs.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/components/reviewer-work-panel.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/hooks/use-recapture.ts` | 100.00% | 66.66% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/pages/submission-finished-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/pages/submission-summary-screen.tsx` | 100.00% | 75.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/saved-routes/utils/polyline.ts` | 100.00% | 58.33% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/splash/pages/splash-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/streaming/components/livestream-bottom-banner.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/streaming/components/livestream-record-control.tsx` | 100.00% | 90.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/streaming/components/livestream-top-bar.tsx` | 100.00% | 75.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/components/surveyor-work-panel.tsx` | 100.00% | 83.33% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/hooks/use-reverse-geocode.ts` | 100.00% | 84.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/pages/survey-finish-screen.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/types/survey-media.ts` | 100.00% | 87.50% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/components/driver-work.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/components/reviewer-work.tsx` | 100.00% | 57.89% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/components/work-action-card.tsx` | 100.00% | 81.81% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/pages/recorded-signs-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-authentication.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-theme.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-work-route.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/services/api-client.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/services/speech.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/dailyTaskType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/hazardType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/navigationType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/notificationType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/revalidationType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/reviewsType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/signMapType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/types/surveySubmissionType.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/utils/format-date.ts` | 88.88% | 62.50% | 100.00% | 100.00% | - |

## 4. Test Suites Breakdown

| Test Suite | Tests | Duration | Status |
| :--- | :---: | :---: | :---: |
| `apps/mobile/__tests__/unit/revalidation/use-revalidation-hooks.test.ts` | 5 / 5 | 2.85s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-utils-and-services.test.ts` | 13 / 13 | 3.86s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/work-roles.test.tsx` | 21 / 21 | 4.26s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/top-up-screen.test.tsx` | 6 / 6 | 4.39s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-submission-details-screen.test.tsx` | 6 / 6 | 4.57s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/livestream-flow.test.tsx` | 9 / 9 | 1.65s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-map-screen.test.tsx` | 7 / 7 | 4.78s | ✅ Pass |
| `apps/mobile/__tests__/unit/auth/forgot-password-flow.test.tsx` | 5 / 5 | 5.17s | ✅ Pass |
| `apps/mobile/__tests__/unit/profile/profile-flow.test.tsx` | 11 / 11 | 5.02s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/error-boundary.test.tsx` | 11 / 11 | 0.93s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/missions-screen.test.tsx` | 9 / 9 | 1.08s | ✅ Pass |
| `apps/mobile/__tests__/unit/credits/use-wallet.test.tsx` | 12 / 12 | 0.99s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-details-route-navigation.test.tsx` | 5 / 5 | 5.57s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-flow.test.tsx` | 6 / 6 | 5.71s | ✅ Pass |
| `apps/mobile/__tests__/unit/profile/edit-profile-avatar.test.tsx` | 7 / 7 | 6.10s | ✅ Pass |
| `apps/mobile/__tests__/intergration/upload.intergration.test.tsx` | 7 / 7 | 6.32s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/use-recapture-and-instruction.test.tsx` | 5 / 5 | 0.90s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/component.test.tsx` | 8 / 8 | 0.68s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/android-gallery-modal.test.tsx` | 7 / 7 | 1.35s | ✅ Pass |
| `apps/mobile/__tests__/intergration/auth.integration.test.tsx` | 10 / 10 | 6.73s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/inspect-revalidate-screen.test.tsx` | 7 / 7 | 1.55s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/recheck-evidence-screen.test.tsx` | 4 / 4 | 2.00s | ✅ Pass |
| `apps/mobile/__tests__/unit/profile/sign-filter-manager.test.tsx` | 6 / 6 | 0.92s | ✅ Pass |
| `apps/mobile/__tests__/unit/credits/wallet-flow.test.tsx` | 12 / 12 | 1.21s | ✅ Pass |
| `apps/mobile/__tests__/unit/auth/auth-flow.test.tsx` | 16 / 16 | 6.94s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/reviewer-stats-screen.test.tsx` | 7 / 7 | 2.86s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/app-layouts.test.tsx` | 12 / 12 | 1.33s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/daily-tasks-and-mission-card.test.tsx` | 6 / 6 | 0.65s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/bookmark-route-modal.test.tsx` | 6 / 6 | 0.89s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/notification-flow.test.tsx` | 8 / 8 | 0.81s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/review-submission-address.test.tsx` | 3 / 3 | 0.80s | ✅ Pass |
| `apps/mobile/__tests__/intergration/review.integration.test.tsx` | 10 / 10 | 7.58s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/upload-flow.test.tsx` | 28 / 28 | 7.61s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/review-skip-summary-flow.test.tsx` | 8 / 8 | 0.97s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/offline-map-modal.test.tsx` | 1 / 1 | 1.38s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-map-views.test.tsx` | 3 / 3 | 1.17s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-flow.test.tsx` | 20 / 20 | 7.89s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-screens-and-views.test.tsx` | 6 / 6 | 0.91s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/map-location-pin.test.tsx` | 3 / 3 | 0.62s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-route-map.test.tsx` | 5 / 5 | 0.49s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/home-sign-filter-card.test.tsx` | 4 / 4 | 0.31s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/submission-complete-screen.test.tsx` | 5 / 5 | 0.67s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-history-screen.test.tsx` | 8 / 8 | 0.90s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-review-screen.test.tsx` | 7 / 7 | 1.32s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/work-features.test.tsx` | 7 / 7 | 0.83s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-sign-verify-card.test.tsx` | 7 / 7 | 0.58s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-bottom-sheet-and-gestures.test.tsx` | 7 / 7 | 0.59s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/update-service-and-storage.test.tsx` | 10 / 10 | 0.43s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/work-routes.test.tsx` | 30 / 30 | 0.51s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/crop-sync-manager.test.ts` | 15 / 15 | 0.31s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/image-file-gps.test.ts` | 10 / 10 | 0.40s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/review-flow.test.tsx` | 25 / 25 | 8.79s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/location-picker-modal.test.tsx` | 1 / 1 | 0.60s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/image-inspection-modal.test.tsx` | 2 / 2 | 0.57s | ✅ Pass |
| `apps/mobile/__tests__/unit/profile/profile-routes.test.tsx` | 2 / 2 | 0.36s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-scan-modal.test.tsx` | 2 / 2 | 0.65s | ✅ Pass |
| `apps/mobile/__tests__/unit/splash/splash-screen.test.tsx` | 5 / 5 | 0.51s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/surveyor-work-panel.test.tsx` | 5 / 5 | 0.46s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-complete-modal.test.tsx` | 7 / 7 | 0.56s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/saved-routes-wishlist-sync.test.tsx` | 3 / 3 | 0.44s | ✅ Pass |
| `apps/mobile/__tests__/unit/credits/credits-routes-and-flow-state.test.tsx` | 7 / 7 | 0.55s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-decision-badge.test.tsx` | 8 / 8 | 0.61s | ✅ Pass |
| `apps/mobile/__tests__/unit/profile/offline-map-service.test.ts` | 8 / 8 | 0.32s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/upload-hooks-and-utils.test.ts` | 10 / 10 | 0.57s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/home-routes-and-active-provider.test.tsx` | 6 / 6 | 0.40s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-provider-gating.test.tsx` | 3 / 3 | 0.35s | ✅ Pass |
| `apps/mobile/__tests__/unit/auth/use-authentication.test.ts` | 3 / 3 | 0.38s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/review-workflow-api.test.ts` | 8 / 8 | 0.29s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/sign-proximity-alert.test.tsx` | 18 / 18 | 0.51s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/high-res-cropper.test.ts` | 6 / 6 | 0.47s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/places-api.test.ts` | 6 / 6 | 0.26s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/auto-reroute.test.ts` | 10 / 10 | 0.41s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/sign-filter-provider.test.tsx` | 3 / 3 | 0.47s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/signs-api.test.ts` | 1 / 1 | 0.21s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/catalog-api.test.ts` | 12 / 12 | 0.39s | ✅ Pass |
| `apps/mobile/__tests__/unit/auth/api-client.test.ts` | 12 / 12 | 0.38s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-api.test.ts` | 11 / 11 | 0.32s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-submission-api.test.ts` | 13 / 13 | 0.30s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/survey-record-schema.test.ts` | 9 / 9 | 0.33s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/video-processor.test.ts` | 9 / 9 | 0.29s | ✅ Pass |
| `apps/mobile/__tests__/unit/revalidation/revalidation-api.test.ts` | 35 / 35 | 0.53s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/notifications-api.test.ts` | 5 / 5 | 0.23s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/speech-service.test.ts` | 17 / 17 | 0.30s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/saved-routes-api.test.ts` | 6 / 6 | 0.24s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/spatial.test.ts` | 7 / 7 | 0.20s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/offline-tiles-api.test.ts` | 5 / 5 | 0.25s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/hazards-api.test.ts` | 5 / 5 | 0.21s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/video-gpx-detection.test.ts` | 10 / 10 | 0.20s | ✅ Pass |
| `apps/mobile/__tests__/unit/review/review-api.test.ts` | 12 / 12 | 0.19s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/saved-routes.test.tsx` | 11 / 11 | 0.19s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/demo-route-signs.test.ts` | 10 / 10 | 0.18s | ✅ Pass |
| `apps/mobile/__tests__/unit/work/daily-tasks-api.test.ts` | 4 / 4 | 0.21s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/video-gps.test.ts` | 7 / 7 | 0.19s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/video-file-gps.test.ts` | 15 / 15 | 0.23s | ✅ Pass |
| `apps/mobile/__tests__/unit/upload/image-gps.test.ts` | 15 / 15 | 0.20s | ✅ Pass |
| `apps/mobile/__tests__/unit/credits/wallet-api.test.ts` | 10 / 10 | 0.31s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/sign-map-api.test.ts` | 6 / 6 | 0.22s | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/fixtures/submission.fixtures.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/saved-routes-match.test.ts` | 4 / 4 | 0.18s | ✅ Pass |
| `apps/mobile/__tests__/unit/auth/auth-api.test.ts` | 13 / 13 | 0.20s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/saved-routes-standalone-api.test.ts` | 7 / 7 | 0.23s | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/fixtures/review.fixtures.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/fixtures/navigation.fixtures.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/fixtures/auth.fixtures.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/handlers/auth.handlers.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/handlers/submission.handlers.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/handlers/review.handlers.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/handlers/navigation.handlers.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/index.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/mocks/msw/server.ts` | 0 / 0 | - | ✅ Pass |
| `apps/mobile/__tests__/intergration/navigation.integration.test.tsx` | 14 / 14 | 11.00s | ✅ Pass |

