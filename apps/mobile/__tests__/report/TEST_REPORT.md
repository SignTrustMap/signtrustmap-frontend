# Automated Test & Coverage Report

> **Generated:** 2026-11-25 02:21:46 UTC  
> **Overall Status:** ✅ PASSED  
> **Execution Duration:** 5.10s  
> **Target Package:** `apps/mobile`  

---

## 1. Test Execution Summary

| Category | Total | Passed | Failed | Skipped | Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Test Suites** | 3 | 3 | 0 | 0 | 100.0% |
| **Tests** | 29 | 29 | 0 | 0 | 100.0% |

## 2. Code Coverage Overview

| Metric | Covered / Total | Percentage | Target Benchmark | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Branches** | 8478 / 12767 | **66.40%** | 80.00% | 🟡 Moderate |
| **Functions** | 2036 / 2583 | **78.82%** | 80.00% | 🟡 Moderate |
| **Lines** | 9151 / 11430 | **80.06%** | 80.00% | 🟢 Pass |
| **Statements** | 9598 / 12274 | **78.19%** | 80.00% | 🟡 Moderate |

### File-by-File Coverage

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `apps/mobile/src/hooks/use-back-button.ts` | 0.00% | 100.00% | 0.00% | 0.00% | - |
| `apps/mobile/src/services/location-permission.ts` | 34.61% | 25.00% | 60.00% | 33.33% | - |
| `apps/mobile/src/feature/navigation/utils/signs.ts` | 32.30% | 17.60% | 71.42% | 33.89% | - |
| `apps/mobile/src/feature/navigation/hooks/use-native-gps.ts` | 34.09% | 27.77% | 80.00% | 35.89% | - |
| `apps/mobile/src/feature/navigation/pages/navigation-start-screen.tsx` | 38.59% | 34.42% | 30.76% | 43.13% | - |
| `apps/mobile/src/api/spatial/spatial.ts` | 46.66% | 51.56% | 75.00% | 47.50% | - |
| `apps/mobile/src/feature/upload/utils/video-processor.ts` | 47.94% | 50.00% | 80.00% | 47.94% | - |
| `apps/mobile/src/feature/navigation/components/navigation-bottom-sheet.tsx` | 51.85% | 62.56% | 45.00% | 50.00% | - |
| `apps/mobile/src/feature/work/components/mission-card-item.tsx` | 54.00% | 52.43% | 100.00% | 54.00% | - |
| `apps/mobile/src/feature/revalidation/pages/revalidation-review-screen.tsx` | 53.77% | 52.39% | 41.53% | 54.54% | - |
| `apps/mobile/src/feature/notifications/hooks/use-notifications.ts` | 51.72% | 58.82% | 53.84% | 55.55% | - |
| `apps/mobile/src/services/maplibre.ts` | 66.66% | 83.33% | 100.00% | 55.55% | - |
| `apps/mobile/src/feature/navigation/utils/navigation-formatters.ts` | 57.89% | 43.75% | 100.00% | 58.06% | - |
| `apps/mobile/src/feature/profile/components/avatar-crop-modal.tsx` | 56.75% | 71.42% | 45.45% | 59.15% | - |
| `apps/mobile/src/feature/navigation/pages/navigation-map-screen.tsx` | 60.07% | 49.24% | 61.85% | 61.47% | - |
| `apps/mobile/src/services/camera-permission.ts` | 50.00% | 50.00% | 100.00% | 61.53% | - |
| `apps/mobile/src/feature/review/components/review-instruction-modal.tsx` | 62.50% | 100.00% | 50.00% | 62.50% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-map-view.web.tsx` | 61.53% | 55.76% | 75.00% | 62.58% | - |
| `apps/mobile/src/feature/auth/hooks/use-google-login.ts` | 62.90% | 38.09% | 83.33% | 62.90% | - |
| `apps/mobile/src/feature/upload/utils/submission-response.ts` | 63.15% | 60.86% | 50.00% | 63.15% | - |
| `apps/mobile/src/feature/revalidation/pages/inspect-revalidate-screen.tsx` | 62.45% | 54.73% | 57.50% | 63.87% | - |
| `apps/mobile/src/feature/notifications/pages/notifications-screen.tsx` | 58.62% | 54.90% | 73.33% | 65.30% | - |
| `apps/mobile/src/feature/navigation/pages/route-search-screen.tsx` | 61.53% | 54.00% | 53.84% | 66.66% | - |
| `apps/mobile/src/feature/work/components/work-daily-tip-card.tsx` | 65.00% | 40.00% | 75.00% | 68.42% | - |
| `apps/mobile/src/api/reviews/catalog-storage.ts` | 63.33% | 43.58% | 100.00% | 68.62% | - |
| `apps/mobile/src/feature/upload/components/survey-scan-modal.tsx` | 64.70% | 58.33% | 45.45% | 68.75% | - |
| `apps/mobile/src/feature/upload/utils/gpx.ts` | 68.96% | 61.53% | 50.00% | 68.96% | - |
| `apps/mobile/src/context/session-provider.tsx` | 66.23% | 48.48% | 70.58% | 70.42% | - |
| `apps/mobile/src/feature/upload/pages/new-survey-record-screen.tsx` | 66.66% | 71.56% | 55.00% | 70.90% | - |
| `apps/mobile/src/feature/work/pages/returned-submission-item-screen.tsx` | 67.46% | 60.75% | 59.03% | 70.92% | - |
| `apps/mobile/src/feature/upload/hooks/use-survey-media-picker.ts` | 69.42% | 68.51% | 43.75% | 70.94% | - |
| `apps/mobile/src/feature/revalidation/hooks/use-revalidation.ts` | 72.83% | 61.79% | 76.31% | 72.15% | - |
| `apps/mobile/src/feature/review/pages/submission-review-screen.tsx` | 71.70% | 64.80% | 69.13% | 72.50% | - |
| `apps/mobile/src/config/env.ts` | 69.56% | 56.75% | 50.00% | 72.72% | - |
| `apps/mobile/src/feature/upload/utils/survey-image.ts` | 69.66% | 61.68% | 100.00% | 72.83% | - |
| `apps/mobile/src/feature/review/components/report-new-sign-type-modal.tsx` | 73.07% | 73.07% | 50.00% | 73.07% | - |
| `apps/mobile/src/feature/work/pages/recapture-camera-screen.tsx` | 72.18% | 66.19% | 93.75% | 73.07% | - |
| `apps/mobile/src/feature/auth/pages/forgot-password.tsx` | 66.25% | 67.00% | 57.57% | 74.12% | - |
| `apps/mobile/src/feature/upload/pages/survey-submission-details-screen.tsx` | 72.31% | 62.30% | 67.44% | 74.37% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-sign-picker-modal.tsx` | 75.55% | 56.81% | 68.75% | 74.41% | - |
| `apps/mobile/src/feature/upload/utils/video-gps.ts` | 74.50% | 56.09% | 83.33% | 74.50% | - |
| `apps/mobile/src/feature/navigation/components/navigation-map-view.tsx` | 73.46% | 61.09% | 74.00% | 75.00% | - |
| `apps/mobile/src/feature/upload/hooks/use-survey-submission.ts` | 68.96% | 44.82% | 87.17% | 75.00% | - |
| `apps/mobile/src/feature/upload/utils/selected-asset-gps.ts` | 74.80% | 66.40% | 100.00% | 75.00% | - |
| `apps/mobile/src/feature/navigation/utils/gps.ts` | 76.11% | 70.76% | 63.63% | 75.80% | - |
| `apps/mobile/src/feature/auth/pages/login.tsx` | 74.69% | 72.15% | 73.91% | 76.71% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-map-view.tsx` | 77.77% | 70.96% | 50.00% | 76.92% | - |
| `apps/mobile/src/feature/upload/utils/video-file-gps.ts` | 77.47% | 62.95% | 83.33% | 77.17% | - |
| `apps/mobile/src/feature/revalidation/pages/revalidation-map-screen.tsx` | 75.97% | 62.99% | 66.26% | 77.43% | - |
| `apps/mobile/src/api/navigation/places.ts` | 68.57% | 46.77% | 92.85% | 77.96% | - |
| `apps/mobile/src/feature/upload/pages/survey-record-details-screen.tsx` | 77.64% | 70.62% | 72.72% | 77.97% | - |
| `apps/mobile/src/feature/navigation/hooks/use-navigation-sheet-gesture.ts` | 79.12% | 68.75% | 86.36% | 78.16% | - |
| `apps/mobile/src/hooks/use-storage.ts` | 78.94% | 75.00% | 100.00% | 78.94% | - |
| `apps/mobile/src/api/revalidation/revalidation.ts` | 77.28% | 70.29% | 75.00% | 79.40% | - |
| `apps/mobile/src/feature/work/pages/missions-screen.tsx` | 80.20% | 59.23% | 92.59% | 79.54% | - |
| `apps/mobile/src/services/update-service.ts` | 78.57% | 53.70% | 88.88% | 79.68% | - |
| `apps/mobile/src/hooks/use-app-update.ts` | 80.00% | 50.00% | 100.00% | 80.00% | - |
| `apps/mobile/src/feature/work/components/surveyor-work.tsx` | 78.20% | 66.66% | 68.42% | 80.55% | - |
| `apps/mobile/src/feature/review/pages/sign-catalog-screen.tsx` | 80.00% | 59.45% | 66.66% | 80.76% | - |
| `apps/mobile/src/feature/navigation/utils/geo.ts` | 81.92% | 68.57% | 90.00% | 81.69% | - |
| `apps/mobile/src/components/badge.tsx` | 81.81% | 80.55% | 100.00% | 81.81% | - |
| `apps/mobile/src/feature/revalidation/context/revalidation-workflow-provider.tsx` | 79.89% | 58.82% | 81.08% | 81.81% | - |
| `apps/mobile/src/feature/work/pages/recaptures-screen.tsx` | 82.50% | 76.36% | 64.28% | 82.05% | - |
| `apps/mobile/src/hooks/use-offline-maps.ts` | 82.81% | 30.00% | 94.44% | 82.25% | - |
| `apps/mobile/src/feature/review/context/review-workflow-provider.tsx` | 79.58% | 54.47% | 87.80% | 82.75% | - |
| `apps/mobile/src/feature/upload/utils/image-file-gps.ts` | 76.88% | 61.29% | 90.90% | 82.96% | - |
| `apps/mobile/src/api/saved-routes/saved-routes.ts` | 76.19% | 61.90% | 100.00% | 83.33% | - |
| `apps/mobile/src/components/offline-map-modal.tsx` | 83.33% | 82.85% | 90.90% | 83.33% | - |
| `apps/mobile/src/feature/profile/pages/edit-profile-screen.tsx` | 83.33% | 65.77% | 74.35% | 83.33% | - |
| `apps/mobile/src/feature/profile/pages/profile-screen.tsx` | 81.44% | 68.75% | 72.97% | 84.04% | - |
| `apps/mobile/src/constants/sign-categories.ts` | 70.83% | 87.32% | 100.00% | 84.21% | - |
| `apps/mobile/src/feature/profile/pages/sign-filters-screen.tsx` | 82.87% | 75.10% | 84.74% | 84.52% | - |
| `apps/mobile/src/feature/navigation/pages/navigation-history-screen.tsx` | 81.34% | 74.07% | 74.19% | 85.12% | - |
| `apps/mobile/src/services/offline-map-service.ts` | 81.65% | 62.20% | 95.45% | 85.57% | - |
| `apps/mobile/src/feature/navigation/components/navigation-upcoming-signs.tsx` | 75.00% | 72.09% | 71.42% | 86.95% | - |
| `apps/mobile/src/feature/auth/hooks/use-forgot-password.ts` | 87.50% | 100.00% | 87.50% | 87.50% | - |
| `apps/mobile/src/feature/credits/pages/custom-amount-screen.tsx` | 82.35% | 50.00% | 71.42% | 87.50% | - |
| `apps/mobile/src/feature/upload/components/android-gallery-modal.tsx` | 83.98% | 65.59% | 88.88% | 87.56% | - |
| `apps/mobile/src/feature/work/pages/work-screen.tsx` | 85.71% | 73.33% | 80.00% | 87.87% | - |
| `apps/mobile/src/feature/upload/utils/image-gps.ts` | 87.12% | 72.22% | 100.00% | 87.95% | - |
| `apps/mobile/src/feature/work/pages/submission-complete-screen.tsx` | 88.46% | 76.81% | 75.00% | 88.46% | - |
| `apps/mobile/src/components/update-modal.tsx` | 80.00% | 72.41% | 66.66% | 88.88% | - |
| `apps/mobile/src/context/sign-filter-provider.tsx` | 88.88% | 57.43% | 82.05% | 89.13% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-sign-details-card.tsx` | 87.91% | 84.04% | 76.19% | 89.53% | - |
| `apps/mobile/src/components/navigation-sign-verify-card.tsx` | 84.78% | 59.45% | 84.61% | 89.74% | - |
| `apps/mobile/src/feature/upload/utils/high-res-cropper.ts` | 90.27% | 75.67% | 90.90% | 90.27% | - |
| `apps/mobile/src/feature/profile/components/sign-filter-manager.tsx` | 88.54% | 75.91% | 86.27% | 90.54% | - |
| `apps/mobile/src/components/credit-balance-card.tsx` | 90.90% | 62.50% | 100.00% | 90.90% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-sign-marker.tsx` | 90.90% | 90.69% | 66.66% | 90.90% | - |
| `apps/mobile/src/feature/upload/schemas/survey-record.schema.ts` | 89.13% | 75.00% | 100.00% | 90.90% | - |
| `apps/mobile/src/components/date-filter-sort-list.tsx` | 91.30% | 90.21% | 88.88% | 91.30% | - |
| `apps/mobile/src/feature/navigation/components/bookmark-route-modal.tsx` | 91.42% | 77.55% | 100.00% | 91.30% | - |
| `apps/mobile/src/feature/review/pages/reviewer-stats-screen.tsx` | 87.01% | 71.05% | 76.47% | 91.42% | - |
| `apps/mobile/src/components/error-boundary.tsx` | 88.70% | 76.78% | 88.23% | 91.52% | - |
| `apps/mobile/src/feature/navigation/utils/demo-route-signs.ts` | 93.10% | 78.57% | 100.00% | 92.59% | - |
| `apps/mobile/src/feature/credits/pages/credit-history-screen.tsx` | 93.33% | 75.00% | 100.00% | 92.85% | - |
| `apps/mobile/src/feature/navigation/components/navigation-top-controls.tsx` | 92.85% | 60.00% | 80.00% | 92.85% | - |
| `apps/mobile/src/api/survey-submission/survey-submission.ts` | 88.88% | 80.00% | 100.00% | 93.02% | - |
| `apps/mobile/src/feature/navigation/components/navigation-map-view.web.tsx` | 90.83% | 71.32% | 96.00% | 93.22% | - |
| `apps/mobile/src/api/navigation/navigation.ts` | 93.47% | 55.88% | 100.00% | 93.33% | - |
| `apps/mobile/src/components/virtual-list.tsx` | 93.75% | 73.33% | 100.00% | 93.75% | - |
| `apps/mobile/src/feature/work/pages/returned-submissions-list-screen.tsx` | 91.89% | 59.37% | 86.66% | 94.28% | - |
| `apps/mobile/src/hooks/use-date-filter-sort.ts` | 93.91% | 95.77% | 100.00% | 94.33% | - |
| `apps/mobile/src/feature/credits/pages/top-up-screen.tsx` | 93.68% | 84.12% | 86.95% | 94.38% | - |
| `apps/mobile/src/feature/work/components/work-missions-section.tsx` | 90.47% | 63.63% | 87.50% | 94.44% | - |
| `apps/mobile/src/feature/upload/components/location-picker-modal.tsx` | 92.22% | 74.19% | 86.95% | 95.12% | - |
| `apps/mobile/src/feature/auth/pages/register.tsx` | 92.00% | 84.00% | 78.57% | 95.55% | - |
| `apps/mobile/src/feature/review/pages/reviewer-history-screen.tsx` | 92.59% | 50.00% | 91.66% | 95.83% | - |
| `apps/mobile/src/feature/upload/pages/survey-history-screen.tsx` | 96.00% | 87.62% | 90.90% | 95.83% | - |
| `apps/mobile/src/feature/navigation/hooks/use-auto-reroute.ts` | 94.23% | 89.47% | 100.00% | 95.91% | - |
| `apps/mobile/src/feature/navigation/utils/route-progress.ts` | 96.42% | 66.66% | 100.00% | 96.29% | - |
| `apps/mobile/src/feature/review/components/review-history-item-card.tsx` | 89.65% | 79.16% | 100.00% | 96.29% | - |
| `apps/mobile/src/feature/saved-routes/hooks/use-saved-routes.ts` | 88.23% | 62.50% | 94.11% | 96.77% | - |
| `apps/mobile/src/feature/upload/hooks/use-save-survey-draft.ts` | 93.15% | 54.54% | 100.00% | 97.01% | - |
| `apps/mobile/src/feature/upload/pages/survey-route-map-screen.tsx` | 93.50% | 88.34% | 94.11% | 97.10% | - |
| `apps/mobile/src/constants/message.ts` | 95.45% | 100.00% | 44.44% | 97.22% | - |
| `apps/mobile/src/feature/work/hooks/use-daily-tasks.ts` | 95.00% | 74.54% | 100.00% | 97.43% | - |
| `apps/mobile/src/feature/review/hooks/use-reviewer-sign-navigation.ts` | 97.50% | 81.81% | 100.00% | 97.50% | - |
| `apps/mobile/src/feature/upload/utils/crop-sync-manager.ts` | 98.48% | 93.33% | 100.00% | 98.48% | - |
| `apps/mobile/src/api/api-client.ts` | 100.00% | 79.31% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/api.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/query-client.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/auth/auth.ts` | 100.00% | 85.71% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/daily-tasks/daily-tasks.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/navigation/hazards.ts` | 100.00% | 95.65% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/navigation/saved-routes.ts` | 100.00% | 47.61% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/navigation/signs.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/notifications/notifications.ts` | 100.00% | 25.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/reviews/catalog.ts` | 100.00% | 85.71% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/reviews/review-workflow.ts` | 100.00% | 94.26% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/reviews/review.ts` | 100.00% | 64.70% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/sign-map/sign-map.ts` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/spatial/offline-tiles.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/api/wallet/wallet.ts` | 100.00% | 77.77% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/app-bottom-tabs.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/button.tsx` | 100.00% | 90.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/divider.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/image-inspection-modal.tsx` | 100.00% | 80.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/input.tsx` | 98.07% | 86.86% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/navigation-maneuver-banner.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/navigation-sign-alert-banner.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/screen-container.tsx` | 100.00% | 91.66% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/skeleton.tsx` | 100.00% | 89.28% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/themed-text.tsx` | 100.00% | 95.23% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/themed-view.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/components/toast.tsx` | 100.00% | 63.63% | 100.00% | 100.00% | - |
| `apps/mobile/src/constants/const.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/constants/revalidation.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/constants/theme.ts` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/context/navigation-active-provider.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/auth/hooks/use-login.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/auth/hooks/use-register.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/components/credit-flow-state.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/components/credit-screen-header.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/components/transaction-list.tsx` | 100.00% | 76.92% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/hooks/use-wallet.ts` | 100.00% | 90.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/credits/pages/credits-overview-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
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
| `apps/mobile/src/feature/profile/schemas/edit-profile.schema.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-decision-badge.tsx` | 100.00% | 53.75% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/revalidation/components/revalidation-voted-result-card.tsx` | 100.00% | 56.25% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/components/review-bottom-tabs.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/components/reviewer-work-panel.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/components/submission-voted-result-card.tsx` | 100.00% | 68.57% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/hooks/use-recapture.ts` | 100.00% | 66.66% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/hooks/use-review.ts` | 100.00% | 76.66% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/pages/submission-finished-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/review/pages/submission-summary-screen.tsx` | 100.00% | 75.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/saved-routes/utils/polyline.ts` | 100.00% | 58.33% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/splash/pages/splash-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/components/surveyor-work-panel.tsx` | 100.00% | 83.33% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/hooks/use-reverse-geocode.ts` | 100.00% | 84.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/pages/survey-finish-screen.tsx` | 100.00% | 50.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/types/survey-media.ts` | 100.00% | 87.50% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/upload/utils/chunk-upload-manager.ts` | 100.00% | 75.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/components/driver-work.tsx` | 90.47% | 56.25% | 71.42% | 100.00% | - |
| `apps/mobile/src/feature/work/components/reviewer-work.tsx` | 92.85% | 65.21% | 80.00% | 100.00% | - |
| `apps/mobile/src/feature/work/components/work-action-badge.tsx` | 100.00% | 93.33% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/components/work-action-card.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/feature/work/pages/recorded-signs-screen.tsx` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-authentication.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-debounce.ts` | 100.00% | 0.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-theme.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/hooks/use-work-route.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/services/api-client.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/services/speech.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/utils/format-date.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/utils/freshness.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |
| `apps/mobile/src/utils/responsive.ts` | 100.00% | 100.00% | 100.00% | 100.00% | - |

## 4. Test Suites Breakdown

| Test Suite | Tests | Duration | Status |
| :--- | :---: | :---: | :---: |
| `apps/mobile/__tests__/unit/splash/splash-screen.test.tsx` | 5 / 5 | 2.27s | ✅ Pass |
| `apps/mobile/__tests__/unit/ui/app-layouts.test.tsx` | 11 / 11 | 2.90s | ✅ Pass |
| `apps/mobile/__tests__/unit/navigation/navigation-utils-and-services.test.ts` | 13 / 13 | 3.19s | ✅ Pass |

