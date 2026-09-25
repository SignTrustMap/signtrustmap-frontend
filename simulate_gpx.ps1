param (
    [string]$GpxPath = "C:\Users\ADMIN\Downloads\bitex_to_cresent_with_time.gpx",
    [double]$IntervalSeconds = 1.0,
    [int]$Step = 1
)

Write-Host "[Simulation] Preparing mock location providers on emulator..." -ForegroundColor Cyan
adb shell appops set 2000 android:mock_location allow
adb shell appops set com.anonymous.mobile android:mock_location allow
adb shell cmd location providers add-test-provider gps
adb shell cmd location providers set-test-provider-enabled gps true
adb shell cmd location providers add-test-provider fused
adb shell cmd location providers set-test-provider-enabled fused true

if (-not (Test-Path $GpxPath)) {
    Write-Host "[Simulation] GPX file not found: $GpxPath" -ForegroundColor Red
    exit 1
}

Write-Host "[Simulation] Parsing GPX file: $GpxPath" -ForegroundColor Cyan
[xml]$gpx = Get-Content $GpxPath
$trkpts = $gpx.gpx.trk.trkseg.trkpt

if (-not $trkpts -or $trkpts.Count -eq 0) {
    Write-Host "[Simulation] No trackpoints found in GPX file." -ForegroundColor Red
    exit 1
}

Write-Host "[Simulation] Loaded $($trkpts.Count) trackpoints. Starting playback (interval: ${IntervalSeconds}s, step: $Step)..." -ForegroundColor Green
Write-Host "[Simulation] Press Ctrl+C to stop simulation at any time." -ForegroundColor Yellow

try {
    for ($i = 0; $i -lt $trkpts.Count; $i += $Step) {
        $pt = $trkpts[$i]
        $lat = $pt.lat
        $lon = $pt.lon
        Write-Host "[$($i + 1)/$($trkpts.Count)] Setting location to Lat: $lat, Lon: $lon" -ForegroundColor Gray
        adb shell cmd location providers set-test-provider-location gps --location "$lat,$lon" --accuracy 5
        adb shell cmd location providers set-test-provider-location fused --location "$lat,$lon" --accuracy 5
        Start-Sleep -Seconds $IntervalSeconds
    }
    Write-Host "[Simulation] Route playback completed successfully!" -ForegroundColor Green
}
finally {
    Write-Host "`n[Simulation] Cleaning up mock location providers..." -ForegroundColor Yellow
    adb shell cmd location providers remove-test-provider gps
    adb shell cmd location providers remove-test-provider fused
    Write-Host "[Simulation] Done." -ForegroundColor Green
}
