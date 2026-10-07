# @shared/map — Shared GIS & Leaflet Foundation

Shared Leaflet map infrastructure, geospatial algorithms, collision thinning, and marker rendering primitives for **SignTrustMap** (`apps/web` and `apps/ops`).

---

## 1. Mục Đích & Phạm Vi (Purpose & Scope)

- **Đóng gói cơ sở hạ tầng GIS dùng chung:** Loại bỏ sự phân mảnh và duplicate code giữa `apps/web` (Cổng cộng đồng/tài xế) và `apps/ops` (Trung tâm điều hành/kiểm duyệt).
- **Thuật toán Collision Thinning:** Lọc thưa biển báo theo phân cấp ưu tiên QCVN 41:2019 và độ thu phóng (Zoom-level adaptive) để giữ bản đồ mượt mà (60 FPS) và không bị chồng chập.
- **Tính toán tọa độ & Không gian:** Haversine formula (khoảng cách thực), Bearing (góc xoay la bàn), định dạng mét/km.
- **Khung bản đồ chuẩn `<BaseMapContainer />`:** Vòng đời Leaflet chuẩn hóa, tự động invalidateSize khi thay đổi kích thước, chuyển đổi linh hoạt giữa các Tile Provider (OSM, Esri Voyager, CartoDB).

---

## 2. Các Thành Phần Cốt Lõi

### Thuật toán Collision Thinning
```ts
import { filterSignsByCollision, getTrafficSignPriority } from '@shared/map'

// Tự động giữ biển ưu tiên cao (P.102, P.103, P.127...) và loại bỏ biển bị đè
const visibleSigns = filterSignsByCollision(allSigns, mapInstance, activeMarkers, focusedSignId)
```

### Tiện ích Toán học Địa lý
```ts
import { calculateHaversineDistance, formatDistance, calculateBearing, formatBearing } from '@shared/map'

const distanceMeters = calculateHaversineDistance(lat1, lon1, lat2, lon2)
const formatted = formatDistance(distanceMeters) // "350 m" hoặc "1.4 km"
```

### Component Khung Bản Đồ
```tsx
import { BaseMapContainer } from '@shared/map'

<BaseMapContainer
  center={[10.7769, 106.7009]}
  zoom={15}
  tileMode={tileMode} // 'osm' | 'voyager'
  onMapReady={(map) => setMap(map)}
  onBoundsChange={(bounds, zoom) => fetchViewportSigns(bounds)}
>
  {/* Custom UI Overlays / Floating Panels */}
</BaseMapContainer>
```
