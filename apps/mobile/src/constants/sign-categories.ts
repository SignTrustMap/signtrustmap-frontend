import { MaterialCommunityIcons } from '@expo/vector-icons';

export type SignCategory = 'WARNING' | 'MANDATORY' | 'PROHIBITORY' | 'INFORMATION' | 'TEMPORARY';

export type SignCategoryItem = {
  id: SignCategory;
  label: string;
  sublabel: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
};

export const SIGN_CATEGORIES: SignCategoryItem[] = [
  {
    id: 'PROHIBITORY',
    label: 'Prohibitory',
    sublabel: 'No entry, turns, speed limits',
    icon: 'cancel',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.14)',
  },
  {
    id: 'WARNING',
    label: 'Warning',
    sublabel: 'Curves, hazards, crossings',
    icon: 'alert',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.14)',
  },
  {
    id: 'MANDATORY',
    label: 'Mandatory',
    sublabel: 'Required direction, min speed',
    icon: 'arrow-right-circle',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.14)',
  },
  {
    id: 'INFORMATION',
    label: 'Information',
    sublabel: 'Priority road, one-way, facilities',
    icon: 'information-outline',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.14)',
  },
  {
    id: 'TEMPORARY',
    label: 'Temporary',
    sublabel: 'Roadworks, detours, repairs',
    icon: 'traffic-cone',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.14)',
  },
];

export function getSignCategory(sign: { signCode?: string; name?: string }): SignCategory {
  const code = (sign.signCode ?? '').toUpperCase().trim();
  const name = (sign.name ?? '').toUpperCase().trim();

  if (
    code.startsWith('T.') ||
    code.startsWith('T-') ||
    code.startsWith('TEMP') ||
    name.includes('TEMP') ||
    name.includes('ROADWORK') ||
    name.includes('CONSTRUCTION') ||
    name.includes('TẠM THỜI')
  ) {
    return 'TEMPORARY';
  }

  if (
    code.startsWith('P.') ||
    code.startsWith('P-') ||
    code === 'STOP' ||
    code.startsWith('PROHIB') ||
    name.includes('STOP') ||
    name.includes('NO ENTRY') ||
    name.includes('PROHIB') ||
    name.includes('SPEED LIMIT') ||
    name.includes('CẤM')
  ) {
    return 'PROHIBITORY';
  }

  if (
    code.startsWith('W.') ||
    code.startsWith('W-') ||
    code.startsWith('WARN') ||
    name.includes('WARN') ||
    name.includes('DANGER') ||
    name.includes('HAZARD') ||
    name.includes('CURVE') ||
    name.includes('CROSSING') ||
    name.includes('INTERSECTION') ||
    name.includes('NGUY HIỂM') ||
    name.includes('CẢNH BÁO')
  ) {
    return 'WARNING';
  }

  if (
    code.startsWith('R.') ||
    code.startsWith('R-') ||
    code.startsWith('MAND') ||
    name.includes('MAND') ||
    name.includes('COMPULSORY') ||
    name.includes('ROUNDABOUT') ||
    name.includes('HIỆU LỆNH')
  ) {
    return 'MANDATORY';
  }

  if (
    code.startsWith('I.') ||
    code.startsWith('I-') ||
    code.startsWith('G.') ||
    code.startsWith('G-') ||
    code.startsWith('INFO') ||
    name.includes('INFO') ||
    name.includes('GUIDE') ||
    name.includes('PARKING') ||
    name.includes('PRIORITY') ||
    name.includes('ONE WAY') ||
    name.includes('CHỈ DẪN')
  ) {
    return 'INFORMATION';
  }

  if (code.startsWith('W')) return 'WARNING';
  if (code.startsWith('P')) return 'PROHIBITORY';
  if (code.startsWith('R')) return 'MANDATORY';
  if (code.startsWith('I') || code.startsWith('G')) return 'INFORMATION';
  if (code.startsWith('T')) return 'TEMPORARY';

  return 'WARNING';
}
