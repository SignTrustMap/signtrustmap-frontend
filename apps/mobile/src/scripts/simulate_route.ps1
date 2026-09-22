<#
.SYNOPSIS
    Simulates GPS movement along the route returned by the backend API 
    from Crescent Mall (District 7) to Bitexco Financial Tower (District 1).

.DESCRIPTION
    Origin: Crescent Mall (Lat: 10.728561, Lon: 106.717336)
    Destination: Bitexco Financial Tower (Lat: 10.771674, Lon: 106.704688)
    Backend API: POST /routing/directions
    Total route points: 188
    Whenever cancelled (Ctrl+C) or finished, location automatically resets to Crescent Mall.

.PARAMETER IntervalSeconds
    Interval between location updates in seconds. Default is 1.0.

.PARAMETER Step
    Step increment through route points (1 = every point, 2 = every 2nd point, etc.). Default is 1.

.PARAMETER LiveApi
    If set, dynamically queries the backend API to fetch the latest route.
#>

param (
    [double]$IntervalSeconds = 1.0,
    [int]$Step = 1,
    [switch]$LiveApi,
    [string]$ApiUrl = "https://api.signmap.site/api/v1/routing/directions"
)

$CrescentMallLat = "10.728561"
$CrescentMallLon = "106.717336"
$BitexcoLat = "10.77171"
$BitexcoLon = "106.704676"

Write-Host "[Simulation] Preparing mock location providers on emulator..." -ForegroundColor Cyan
adb shell appops set 2000 android:mock_location allow
adb shell appops set com.anonymous.mobile android:mock_location allow
adb shell cmd location providers add-test-provider gps
adb shell cmd location providers set-test-provider-enabled gps true
adb shell cmd location providers add-test-provider fused
adb shell cmd location providers set-test-provider-enabled fused true

$points = @()

if ($LiveApi) {
    Write-Host "[Simulation] Querying backend API: $ApiUrl" -ForegroundColor Cyan
    $body = @{
        originLatitude = [double]$CrescentMallLat
        originLongitude = [double]$CrescentMallLon
        destinationLatitude = [double]$BitexcoLat
        destinationLongitude = [double]$BitexcoLon
        maxAlternatives = 0
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
        if ($response.shortestPath -and $response.shortestPath.geometry) {
            $points = $response.shortestPath.geometry
            Write-Host "[Simulation] Fetched $($points.Count) points dynamically from backend." -ForegroundColor Green
        }
    } catch {
        Write-Host "[Simulation] Failed to query API: $_. Using embedded route points." -ForegroundColor Yellow
    }
}

if ($points.Count -eq 0) {
    $embeddedJson = @'
[{"latitude":10.728561,"longitude":106.717336},{"latitude":10.728644,"longitude":106.717278},{"latitude":10.728689,"longitude":106.71727},{"latitude":10.729031,"longitude":106.717361},{"latitude":10.729184,"longitude":106.717714},{"latitude":10.72922,"longitude":106.717792},{"latitude":10.729255,"longitude":106.717866},{"latitude":10.729357,"longitude":106.718068},{"latitude":10.729394,"longitude":106.71814},{"latitude":10.729518,"longitude":106.718386},{"latitude":10.729564,"longitude":106.718477},{"latitude":10.729591,"longitude":106.718529},{"latitude":10.729622,"longitude":106.718579},{"latitude":10.729743,"longitude":106.718772},{"latitude":10.730178,"longitude":106.719361},{"latitude":10.730571,"longitude":106.719808},{"latitude":10.730639,"longitude":106.719895},{"latitude":10.730884,"longitude":106.720147},{"latitude":10.730957,"longitude":106.720226},{"latitude":10.731033,"longitude":106.720309},{"latitude":10.731179,"longitude":106.720443},{"latitude":10.731351,"longitude":106.720381},{"latitude":10.731363,"longitude":106.720395},{"latitude":10.731413,"longitude":106.720451},{"latitude":10.731453,"longitude":106.72049},{"latitude":10.731505,"longitude":106.720535},{"latitude":10.731976,"longitude":106.72086},{"latitude":10.732049,"longitude":106.720908},{"latitude":10.732115,"longitude":106.720946},{"latitude":10.732439,"longitude":106.72112},{"latitude":10.733002,"longitude":106.721352},{"latitude":10.733423,"longitude":106.721475},{"latitude":10.733923,"longitude":106.721582},{"latitude":10.734421,"longitude":106.721661},{"latitude":10.735765,"longitude":106.72173},{"latitude":10.736354,"longitude":106.721766},{"latitude":10.736964,"longitude":106.721768},{"latitude":10.737531,"longitude":106.721772},{"latitude":10.737827,"longitude":106.721775},{"latitude":10.737974,"longitude":106.721776},{"latitude":10.73807,"longitude":106.721776},{"latitude":10.740596,"longitude":106.721733},{"latitude":10.742402,"longitude":106.721773},{"latitude":10.743217,"longitude":106.721791},{"latitude":10.745398,"longitude":106.721833},{"latitude":10.746724,"longitude":106.72187},{"latitude":10.747082,"longitude":106.721894},{"latitude":10.747391,"longitude":106.721929},{"latitude":10.74773,"longitude":106.721983},{"latitude":10.748014,"longitude":106.722043},{"latitude":10.748276,"longitude":106.722105},{"latitude":10.748531,"longitude":106.722179},{"latitude":10.748774,"longitude":106.722263},{"latitude":10.74902,"longitude":106.72236},{"latitude":10.749253,"longitude":106.722462},{"latitude":10.749466,"longitude":106.722565},{"latitude":10.749717,"longitude":106.722701},{"latitude":10.749944,"longitude":106.722837},{"latitude":10.750163,"longitude":106.722981},{"latitude":10.750365,"longitude":106.723126},{"latitude":10.750554,"longitude":106.723276},{"latitude":10.750721,"longitude":106.723417},{"latitude":10.750858,"longitude":106.723567},{"latitude":10.751293,"longitude":106.72408},{"latitude":10.751298,"longitude":106.724227},{"latitude":10.751532,"longitude":106.724527},{"latitude":10.75164,"longitude":106.724671},{"latitude":10.751697,"longitude":106.724737},{"latitude":10.751768,"longitude":106.724804},{"latitude":10.751837,"longitude":106.724842},{"latitude":10.751938,"longitude":106.724803},{"latitude":10.752,"longitude":106.724778},{"latitude":10.752091,"longitude":106.724705},{"latitude":10.75218,"longitude":106.724584},{"latitude":10.752202,"longitude":106.724511},{"latitude":10.752365,"longitude":106.724276},{"latitude":10.753757,"longitude":106.722416},{"latitude":10.756724,"longitude":106.718403},{"latitude":10.757074,"longitude":106.717977},{"latitude":10.7578,"longitude":106.71645},{"latitude":10.757916,"longitude":106.716252},{"latitude":10.759788,"longitude":106.713073},{"latitude":10.759876,"longitude":106.712924},{"latitude":10.759917,"longitude":106.712851},{"latitude":10.760301,"longitude":106.712196},{"latitude":10.760327,"longitude":106.712152},{"latitude":10.760359,"longitude":106.712098},{"latitude":10.760406,"longitude":106.712017},{"latitude":10.7614,"longitude":106.710323},{"latitude":10.76166,"longitude":106.709878},{"latitude":10.76173,"longitude":106.70976},{"latitude":10.761787,"longitude":106.709663},{"latitude":10.761935,"longitude":106.70941},{"latitude":10.762494,"longitude":106.708496},{"latitude":10.762566,"longitude":106.708407},{"latitude":10.762666,"longitude":106.708334},{"latitude":10.763309,"longitude":106.708048},{"latitude":10.763356,"longitude":106.708025},{"latitude":10.764028,"longitude":106.707729},{"latitude":10.764221,"longitude":106.707642},{"latitude":10.764608,"longitude":106.707473},{"latitude":10.764781,"longitude":106.707394},{"latitude":10.764955,"longitude":106.707308},{"latitude":10.765002,"longitude":106.707284},{"latitude":10.765102,"longitude":106.707241},{"latitude":10.765222,"longitude":106.707192},{"latitude":10.765198,"longitude":106.707133},{"latitude":10.765155,"longitude":106.707032},{"latitude":10.765003,"longitude":106.706674},{"latitude":10.764828,"longitude":106.706261},{"latitude":10.764809,"longitude":106.706217},{"latitude":10.764608,"longitude":106.705742},{"latitude":10.764509,"longitude":106.705508},{"latitude":10.764494,"longitude":106.705473},{"latitude":10.764403,"longitude":106.705263},{"latitude":10.764357,"longitude":106.705159},{"latitude":10.764286,"longitude":106.704996},{"latitude":10.764161,"longitude":106.70472},{"latitude":10.764141,"longitude":106.704679},{"latitude":10.764118,"longitude":106.704642},{"latitude":10.764043,"longitude":106.704539},{"latitude":10.763845,"longitude":106.704282},{"latitude":10.76376,"longitude":106.704148},{"latitude":10.763563,"longitude":106.703897},{"latitude":10.763446,"longitude":106.703749},{"latitude":10.763549,"longitude":106.703736},{"latitude":10.763654,"longitude":106.703604},{"latitude":10.763847,"longitude":106.70334},{"latitude":10.764128,"longitude":106.702927},{"latitude":10.76413,"longitude":106.702925},{"latitude":10.764211,"longitude":106.70281},{"latitude":10.764574,"longitude":106.70229},{"latitude":10.764795,"longitude":106.701986},{"latitude":10.765039,"longitude":106.701681},{"latitude":10.765249,"longitude":106.701457},{"latitude":10.765655,"longitude":106.701095},{"latitude":10.765688,"longitude":106.701082},{"latitude":10.765752,"longitude":106.70108},{"latitude":10.765805,"longitude":106.701101},{"latitude":10.76601,"longitude":106.701259},{"latitude":10.766139,"longitude":106.701349},{"latitude":10.766694,"longitude":106.701686},{"latitude":10.766771,"longitude":106.701768},{"latitude":10.767182,"longitude":106.702082},{"latitude":10.767548,"longitude":106.702385},{"latitude":10.767781,"longitude":106.702602},{"latitude":10.767923,"longitude":106.702784},{"latitude":10.768032,"longitude":106.702935},{"latitude":10.768137,"longitude":106.703106},{"latitude":10.768206,"longitude":106.703193},{"latitude":10.768287,"longitude":106.703262},{"latitude":10.768375,"longitude":106.703313},{"latitude":10.768484,"longitude":106.70336},{"latitude":10.768614,"longitude":106.70341},{"latitude":10.768631,"longitude":106.703434},{"latitude":10.768655,"longitude":106.703451},{"latitude":10.768683,"longitude":106.70346},{"latitude":10.768715,"longitude":106.703459},{"latitude":10.768744,"longitude":106.703447},{"latitude":10.768767,"longitude":106.703425},{"latitude":10.768782,"longitude":106.703397},{"latitude":10.769217,"longitude":106.7032},{"latitude":10.769533,"longitude":106.703057},{"latitude":10.769627,"longitude":106.703019},{"latitude":10.769728,"longitude":106.702978},{"latitude":10.769852,"longitude":106.702928},{"latitude":10.770468,"longitude":106.702683},{"latitude":10.77065,"longitude":106.70261},{"latitude":10.770737,"longitude":106.702575},{"latitude":10.770734,"longitude":106.702639},{"latitude":10.770707,"longitude":106.703235},{"latitude":10.770693,"longitude":106.703518},{"latitude":10.770686,"longitude":106.703665},{"latitude":10.770656,"longitude":106.704327},{"latitude":10.770647,"longitude":106.704535},{"latitude":10.770749,"longitude":106.704496},{"latitude":10.77088,"longitude":106.704445},{"latitude":10.770975,"longitude":106.704409},{"latitude":10.771031,"longitude":106.704411},{"latitude":10.771138,"longitude":106.704355},{"latitude":10.771166,"longitude":106.704309},{"latitude":10.771223,"longitude":106.704434},{"latitude":10.771258,"longitude":106.704484},{"latitude":10.771278,"longitude":106.704512},{"latitude":10.771362,"longitude":106.704596},{"latitude":10.771578,"longitude":106.704795},{"latitude":10.771763,"longitude":106.704962},{"latitude":10.771674,"longitude":106.704688}]
'@
    $points = $embeddedJson | ConvertFrom-Json
}

Write-Host "[Simulation] Loaded $($points.Count) route points from Crescent Mall to Bitexco." -ForegroundColor Green
Write-Host "[Simulation] Starting simulation (interval: ${IntervalSeconds}s, step: $Step)..." -ForegroundColor Green
Write-Host "[Simulation] Press Ctrl+C at any time to cancel and reset location to Crescent Mall." -ForegroundColor Yellow

try {
    for ($i = 0; $i -lt $points.Count; $i += $Step) {
        $pt = $points[$i]
        $lat = $pt.latitude
        $lon = $pt.longitude
        Write-Host "[$($i + 1)/$($points.Count)] Setting location to Lat: $lat, Lon: $lon" -ForegroundColor Gray
        adb shell cmd location providers set-test-provider-location gps --location "$lat,$lon" --accuracy 5
        adb shell cmd location providers set-test-provider-location fused --location "$lat,$lon" --accuracy 5
        Start-Sleep -Seconds $IntervalSeconds
    }
    Write-Host "[Simulation] Route playback completed successfully!" -ForegroundColor Green
} finally {
    Write-Host "`n[Simulation] Setting location back to Crescent Mall ($CrescentMallLat, $CrescentMallLon)..." -ForegroundColor Yellow
    adb shell cmd location providers set-test-provider-location gps --location "$CrescentMallLat,$CrescentMallLon" --accuracy 5
    adb shell cmd location providers set-test-provider-location fused --location "$CrescentMallLat,$CrescentMallLon" --accuracy 5
    Start-Sleep -Milliseconds 800
    Write-Host "[Simulation] Cleaning up mock location providers..." -ForegroundColor Yellow
    adb shell cmd location providers remove-test-provider gps
    adb shell cmd location providers remove-test-provider fused
    Write-Host "[Simulation] Done. Device location is now at Crescent Mall." -ForegroundColor Green
}
