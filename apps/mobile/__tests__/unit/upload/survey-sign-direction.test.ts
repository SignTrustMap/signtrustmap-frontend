import {
  formatNoteWithDirection,
  getCardinalDirectionLabel,
} from '@/feature/upload/pages/survey-record-details-screen';

describe('Sign Direction (Hướng biển báo) Utilities', () => {
  describe('getCardinalDirectionLabel', () => {
    it('returns correct cardinal direction labels across 360 degrees', () => {
      expect(getCardinalDirectionLabel(0)).toBe('Bắc');
      expect(getCardinalDirectionLabel(360)).toBe('Bắc');
      expect(getCardinalDirectionLabel(15)).toBe('Bắc');
      expect(getCardinalDirectionLabel(350)).toBe('Bắc');

      expect(getCardinalDirectionLabel(45)).toBe('Đông Bắc');
      expect(getCardinalDirectionLabel(90)).toBe('Đông');
      expect(getCardinalDirectionLabel(135)).toBe('Đông Nam');
      expect(getCardinalDirectionLabel(180)).toBe('Nam');
      expect(getCardinalDirectionLabel(225)).toBe('Tây Nam');
      expect(getCardinalDirectionLabel(270)).toBe('Tây');
      expect(getCardinalDirectionLabel(315)).toBe('Tây Bắc');
    });

    it('handles negative or overflow degrees gracefully', () => {
      expect(getCardinalDirectionLabel(-90)).toBe('Tây');
      expect(getCardinalDirectionLabel(450)).toBe('Đông');
    });

    it('returns "Chưa chọn" when direction is undefined or null', () => {
      expect(getCardinalDirectionLabel(undefined)).toBe('Chưa chọn');
      expect(getCardinalDirectionLabel(null as any)).toBe('Chưa chọn');
      expect(getCardinalDirectionLabel(NaN)).toBe('Chưa chọn');
    });
  });

  describe('formatNoteWithDirection', () => {
    it('returns note as-is without tag when direction is undefined or null', () => {
      expect(formatNoteWithDirection('Biển báo', undefined)).toBe('Biển báo');
      expect(formatNoteWithDirection('Biển báo', null as any)).toBe('Biển báo');
    });

    it('strips existing direction tag when direction is undefined', () => {
      expect(formatNoteWithDirection('Biển báo\n[TrafficDirection: 45°]', undefined)).toBe('Biển báo');
      expect(formatNoteWithDirection('[TrafficDirection: 45°]', undefined)).toBe('');
    });

    it('appends [TrafficDirection: <deg>°] to an empty note', () => {
      const result = formatNoteWithDirection('', 90);
      expect(result).toBe('[TrafficDirection: 90°]');
    });

    it('appends [TrafficDirection: <deg>°] to existing note with newline', () => {
      const result = formatNoteWithDirection('Biển báo cấm dừng đỗ', 180);
      expect(result).toBe('Biển báo cấm dừng đỗ\n[TrafficDirection: 180°]');
    });

    it('replaces existing direction tag if already present', () => {
      const initial = 'Biển báo\n[TrafficDirection: 45°]';
      const updated = formatNoteWithDirection(initial, 270);
      expect(updated).toBe('Biển báo\n[TrafficDirection: 270°]');
    });

    it('replaces legacy heading tags if present', () => {
      const initial = 'Biển báo\n[Heading: 100°]';
      const updated = formatNoteWithDirection(initial, 0);
      expect(updated).toBe('Biển báo\n[TrafficDirection: 0°]');
    });
  });
});
