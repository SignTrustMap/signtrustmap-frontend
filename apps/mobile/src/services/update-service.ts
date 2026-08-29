import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface ReleaseAsset {
  name: string;
  downloadUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
}

export interface ReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
  apkAsset: ReleaseAsset | null;
}

export interface UpdateCheckResult {
  isUpdateAvailable: boolean;
  currentVersion: string;
  currentCommit: string;
  latestRelease?: ReleaseInfo;
  error?: string;
}

const GITHUB_REPO = 'SignTrustMap/signtrustmap-frontend';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (isNaN(diffMs)) return 'Recently';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.status === 404) {
    const allReleasesUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases`;
    const fallbackResponse = await fetch(allReleasesUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!fallbackResponse.ok) {
      throw new Error(`GitHub API returned status ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
    }

    const releases = await fallbackResponse.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      return null;
    }
    return parseReleaseData(releases[0]);
  }

  if (!response.ok) {
    throw new Error(`GitHub API returned status ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return parseReleaseData(data);
}

function parseReleaseData(data: any): ReleaseInfo {
  let apkAsset: ReleaseAsset | null = null;

  if (Array.isArray(data.assets)) {
    const apkAssets = data.assets.filter((asset: any) =>
      typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk')
    );

    if (apkAssets.length > 0) {
      const supportedAbis = (Device.supportedCpuArchitectures ?? []).map((abi) => abi.toLowerCase());

      let matched: any = null;
      for (const abi of supportedAbis) {
        matched = apkAssets.find((asset: any) => asset.name.toLowerCase().includes(abi));
        if (matched) break;
      }

      if (!matched) {
        matched =
          apkAssets.find((asset: any) => asset.name.toLowerCase().includes('arm64')) ||
          apkAssets[0];
      }

      apkAsset = {
        name: matched.name,
        downloadUrl: matched.browser_download_url,
        sizeBytes: matched.size,
        sizeFormatted: formatBytes(matched.size),
      };
    }
  }

  return {
    tagName: data.tag_name ?? '',
    name: data.name || data.tag_name || 'Latest Release',
    publishedAt: formatRelativeDate(data.published_at),
    htmlUrl: data.html_url,
    apkAsset,
  };
}

export async function checkAppUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
  const currentCommit = process.env.EXPO_PUBLIC_APP_COMMIT_SHA ?? '';

  try {
    const latestRelease = await fetchLatestRelease();

    if (!latestRelease) {
      return {
        isUpdateAvailable: false,
        currentVersion,
        currentCommit,
      };
    }

    const cleanTag = latestRelease.tagName.replace(/^v/, '').replace(/^build-/, '');
    
    let isUpdateAvailable = false;
    if (currentCommit) {
      const shortCurrent = currentCommit.slice(0, 7);
      const shortTag = cleanTag.slice(0, 7);
      isUpdateAvailable = shortCurrent !== shortTag && !currentCommit.startsWith(cleanTag) && !cleanTag.startsWith(currentCommit);
    } else {
      isUpdateAvailable = cleanTag !== currentVersion && !currentVersion.includes(cleanTag);
    }

    return {
      isUpdateAvailable,
      currentVersion,
      currentCommit,
      latestRelease,
    };
  } catch (error: any) {
    return {
      isUpdateAvailable: false,
      currentVersion,
      currentCommit,
      error: error?.message || 'Failed to connect to update server.',
    };
  }
}
