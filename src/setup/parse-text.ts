import { describe, expect, it, jest } from '@jest/globals';
import { parseCsv, parseJson } from './parse.js';

describe('parse', () => {
  describe('parseJson', () => {
    it('returns empty array for invalid input', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      expect(parseJson(undefined)).toStrictEqual([]);
      expect(spy).toHaveBeenCalledWith(
        'error parsing JSON',
        expect.any(SyntaxError)
      );
    });

    it('returns empty array for valid JSON that is not an array', () => {
      expect(parseJson(null)).toStrictEqual([]);
    });

    it('returns data for valid input', () => {
      const item = [
        {
          title: 'title',
          description: 'description',
          csv: 'csv',
          html: 'csv.html',
        },
      ];
      const input = JSON.stringify(item);

      expect(parseJson(input)).toStrictEqual(item);
    });

    it('returns empty array for array with invalid data', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      expect(parseJson('[1]')).toStrictEqual([]);
      expect(spy).toHaveBeenCalledWith('missing required properties in JSON');
    });
  });

  describe('parseCsv', () => {
    it('returns empty array for invalid input', () => {
      expect(parseCsv(undefined)).toStrictEqual([]);
    });

    it('parses correct data', () => {
      const data = `Númer;Heiti;Einingar;Kennslumisseri;Námstig;
ID;Title;8;Haust;Grunnám;https://ugla.hi.is/kennsluskra/`;

      const result = parseCsv(data);

      expect(result).toStrictEqual([
        {
          id: 'ID',
          title: 'Title',
          units: 8,
          semester: 'Haust',
          level: 'Grunnám',
          url: 'https://ugla.hi.is/kennsluskra/',
        },
      ]);
    });

    it('skip course without a title', () => {
      const data = `Númer;Heiti;Einingar;Kennslumisseri;Námstig;
x;;;;;`;

      const result = parseCsv(data);

      expect(result).toStrictEqual([]);
    });

    it('parses correct data but skips invalid fields', () => {
      const data = `Númer;Heiti;Einingar;Kennslumisseri;Námstig;
;Title;8.5;foo;;x`;

      const result = parseCsv(data);

      expect(result).toStrictEqual([
        {
          id: undefined,
          title: 'Title',
          units: undefined,
          semester: undefined,
          level: undefined,
          url: undefined,
        },
      ]);
    });

    it('handles invalid data', () => {
      const data = `Númer;Heiti;Einingar;Kennslumisseri;Námstig;
;Title`;

      const result = parseCsv(data);

      expect(result).toStrictEqual([
        {
          id: undefined,
          title: 'Title',
          units: undefined,
          semester: undefined,
          level: undefined,
          url: undefined,
        },
      ]);
    });
  });
});