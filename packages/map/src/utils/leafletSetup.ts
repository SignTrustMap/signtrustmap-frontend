import L from 'leaflet'

/**
 * Configure Leaflet default icon paths to use local public assets
 * rather than attempting to resolve external CDN URLs or broken bundled assets.
 */
export function setupLeafletDefaultIcons(): void {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  })
}
