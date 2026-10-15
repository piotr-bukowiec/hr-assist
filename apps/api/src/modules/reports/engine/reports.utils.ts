import { join } from 'path';
import { EmployeeEntity } from '../../employees/entities/employee.entity';

const REPORTS_DIR: string = 'reports';

export const getEmployeeSheetName = ({
  name,
  surname,
}: Pick<EmployeeEntity, 'name' | 'surname'>) => {
  return `${surname.toUpperCase()} ${name.charAt(0).toUpperCase()}.`;
};

/**
 * Lowercase ASCII slug for file names: Polish letters lose their diacritics,
 * spaces and underscores become '-', anything else that is not a letter,
 * digit or '-' is dropped ('Śliwowski_Nowak' -> 'sliwowski-nowak').
 */
export const normalizeFileNamePart = (value: string): string =>
  value
    .toLowerCase()
    // 'ł' has no decomposed form; NFD splits the other Polish letters into a
    // base letter and a combining mark (\p{M}), which is then dropped
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const formatMonth = (month: number): string =>
  month.toString().padStart(2, '0');

/** e.g. '89012345678-andrzej-sliwowski-09-2026.xlsx' */
export const getReportFileName = (
  { pesel, name, surname }: Pick<EmployeeEntity, 'pesel' | 'name' | 'surname'>,
  year: number,
  month: number,
): string => {
  const parts: string[] = [
    pesel.replace(/\D/g, ''),
    normalizeFileNamePart(name),
    normalizeFileNamePart(surname),
    formatMonth(month),
    year.toString(),
  ];

  return `${parts.join('-')}.xlsx`;
};

/** e.g. 'reports/2026/09/89012345678-andrzej-sliwowski-09-2026.xlsx' */
export const getReportRelativePath = (
  employee: Pick<EmployeeEntity, 'pesel' | 'name' | 'surname'>,
  year: number,
  month: number,
): string =>
  join(
    REPORTS_DIR,
    year.toString(),
    formatMonth(month),
    getReportFileName(employee, year, month),
  );
