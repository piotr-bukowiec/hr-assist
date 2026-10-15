import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Fraction } from 'fraction.js';
import { upperFirst } from 'lodash';
import { AbsenceType } from '../../attendance/attendance.types';
import { ContractType, Location } from '../../employees/employee.types';
import { AddressEntity } from '../../companies/entities/address.entity';
import { getEmployeeSheetName } from './reports.utils';
import {
  applyBordersToRange,
  columnNumber,
  forEachColumn,
  formatTimestamp,
  getSolidFill,
  styleHeaderCell,
} from './excel-helpers';
import {
  Company,
  DailyTimesheetRow,
  Employee,
  MonthlyTimesheetData,
  OvertimeHours,
  ReportStyleConfig,
} from './timesheet-report.types';

// ---------------------------------------------------------------------------
// Layout configuration: every row index and column letter used in the report
// ---------------------------------------------------------------------------

/** Columns of the main table, left to right. */
const COLUMNS = {
  date: 'A',
  dayOfMonth: 'B',
  dayLabel: 'C',
  workHoursRange: 'D',
  nominalHours: 'E',
  actualHours: 'F',
  overtimeDay: 'G',
  overtimeNight: 'H',
  saturdays: 'I',
  sundaysAndHolidays: 'J',
  nightTime: 'K',
  vacationLeave: 'L',
  onDemandLeave: 'M',
  maternityLeave: 'N',
  parentalLeave: 'O',
  unpaidLeave: 'P',
  sickLeave: 'Q',
  care: 'R',
  paidExcusedAbsence: 'S',
  unpaidExcusedAbsence: 'T',
  unexcusedAbsence: 'U',
  military: 'V',
} as const;

const REPORT_LAYOUT = {
  rows: {
    title: 1,
    subtitle: 2,
    detailsStart: 5,
    groupHeader: 10,
    columnHeaderTop: 11,
    columnHeaderBottom: 12,
    firstData: 13,
  },
  table: {
    first: COLUMNS.date,
    last: COLUMNS.military,
    /** Hour cells: numbers that render 0 as '-' */
    firstHours: COLUMNS.workHoursRange,
    /** On workdays these hour columns show a plain 0 instead of '-' */
    firstWorkedHours: COLUMNS.nominalHours,
    lastWorkedHours: COLUMNS.nightTime,
    firstAbsence: COLUMNS.vacationLeave,
    /** The RAZEM label spans the columns before the first summed one */
    totalsLabelEnd: COLUMNS.workHoursRange,
    firstSummed: COLUMNS.nominalHours,
  },
  topHeader: {
    titleEnd: 'H',
    subtitleEnd: 'F',
    month: 'G',
    year: 'H',
    generatedAtStart: 'R',
    generatedAtEnd: 'V',
  },
  employeeDetails: {
    labelEnd: 'E',
    valueStart: 'F',
    valueEnd: 'M',
  },
  companyDetails: {
    start: 'O',
    end: 'S',
  },
  columnWidths: {
    [COLUMNS.date]: 12,
    [COLUMNS.dayOfMonth]: 8,
    // Fits 'Poniedziałek'; longer holiday labels wrap onto a second line
    [COLUMNS.dayLabel]: 18,
    [COLUMNS.workHoursRange]: 14,
    [COLUMNS.nominalHours]: 11,
    [COLUMNS.actualHours]: 12,
    // Also holds the month name in the top header, wide enough for 'październik'
    [COLUMNS.overtimeDay]: 14,
    [COLUMNS.overtimeNight]: 6,
    [COLUMNS.saturdays]: 6,
    [COLUMNS.sundaysAndHolidays]: 6,
    [COLUMNS.nightTime]: 6,
    [COLUMNS.vacationLeave]: 7,
    [COLUMNS.onDemandLeave]: 7,
    [COLUMNS.maternityLeave]: 7,
    [COLUMNS.parentalLeave]: 7,
    [COLUMNS.unpaidLeave]: 7,
    [COLUMNS.sickLeave]: 7,
    [COLUMNS.care]: 7,
    [COLUMNS.paidExcusedAbsence]: 7,
    [COLUMNS.unpaidExcusedAbsence]: 7,
    [COLUMNS.unexcusedAbsence]: 7,
    [COLUMNS.military]: 7,
  } as Record<string, number>,
  // Rows 11-12 hold rotated labels, so together they must fit the longest word
  headerRowHeights: {
    10: 30,
    11: 60,
    12: 65,
  } as Record<number, number>,
} as const;

const COLORS: ReportStyleConfig['colors'] = {
  leave: 'FF9FCE63',
  unpaidLeave: 'FFC2D6EC',
  sickLeave: 'FFF5C242',
  dayOff: 'FFD9D9D9',
  zeroValueFont: 'FF888888',
  generatedAtFont: 'FF555555',
};

const REPORT_STYLE: ReportStyleConfig = {
  colors: COLORS,
  borders: {
    thin: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  },
  alignments: {
    center: { vertical: 'middle', horizontal: 'center' },
    wrappedCenter: { vertical: 'middle', horizontal: 'center', wrapText: true },
    rotated: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
      textRotation: 90,
    },
  },
  fonts: {
    bold: { bold: true },
    title: { bold: true, size: 16 },
    generatedAt: {
      name: 'Calibri',
      size: 9,
      italic: true,
      color: { argb: COLORS.generatedAtFont },
    },
  },
  numberFormats: {
    dashZero: '0;-0;"-"',
    number: '0',
  },
};

const A4_PAPER_SIZE: number = 9;

/**
 * Column that receives the hours of each absence type. Keyed by every
 * AbsenceType, so a new type without a column fails to compile.
 */
const ABSENCE_STATUS_COLUMNS: Record<AbsenceType, string> = {
  [AbsenceType.VACATION_LEAVE]: COLUMNS.vacationLeave,
  [AbsenceType.ON_DEMAND_LEAVE]: COLUMNS.onDemandLeave,
  [AbsenceType.MATERNITY_LEAVE]: COLUMNS.maternityLeave,
  [AbsenceType.PARENTAL_LEAVE]: COLUMNS.parentalLeave,
  [AbsenceType.PARENTAL_CHILD_LEAVE]: COLUMNS.parentalLeave,
  [AbsenceType.PATERNITY_LEAVE]: COLUMNS.parentalLeave,
  [AbsenceType.UNPAID_LEAVE]: COLUMNS.unpaidLeave,
  [AbsenceType.SICK_LEAVE]: COLUMNS.sickLeave,
  [AbsenceType.REHABILITATION_BENEFIT]: COLUMNS.sickLeave,
  [AbsenceType.CARE]: COLUMNS.care,
  [AbsenceType.PAID_EXCUSED_ABSENCE]: COLUMNS.paidExcusedAbsence,
  [AbsenceType.CIRCUMSTANTIAL_LEAVE]: COLUMNS.paidExcusedAbsence,
  [AbsenceType.DAY_OFF_FOR_HOLIDAY]: COLUMNS.paidExcusedAbsence,
  [AbsenceType.UNPAID_EXCUSED_ABSENCE]: COLUMNS.unpaidExcusedAbsence,
  [AbsenceType.UNEXCUSED_ABSENCE]: COLUMNS.unexcusedAbsence,
};

const OVERTIME_COLUMNS: Record<keyof OvertimeHours, string> = {
  day: COLUMNS.overtimeDay,
  night: COLUMNS.overtimeNight,
  saturdays: COLUMNS.saturdays,
  sundaysAndHolidays: COLUMNS.sundaysAndHolidays,
  nightTime: COLUMNS.nightTime,
};

/** Background of selected absence columns, in the header and on workdays. */
const ABSENCE_COLUMN_COLORS: Record<string, string> = {
  [COLUMNS.vacationLeave]: REPORT_STYLE.colors.leave,
  [COLUMNS.onDemandLeave]: REPORT_STYLE.colors.leave,
  [COLUMNS.unpaidLeave]: REPORT_STYLE.colors.unpaidLeave,
  [COLUMNS.sickLeave]: REPORT_STYLE.colors.sickLeave,
};

interface GroupHeader {
  from: string;
  to: string;
  label: string;
}

interface ColumnHeader {
  column: string;
  label: string;
  rotated: boolean;
}

const GROUP_HEADERS: GroupHeader[] = [
  {
    from: COLUMNS.date,
    to: COLUMNS.actualHours,
    label: 'Czas pracy do rozliczenia',
  },
  {
    from: COLUMNS.overtimeDay,
    to: COLUMNS.nightTime,
    label: 'Godziny przepracowane',
  },
  {
    from: COLUMNS.vacationLeave,
    to: COLUMNS.military,
    label: 'Nieobecności w pracy określone w godzinach',
  },
];

/** Labels merged across both column header rows (11-12). */
const COLUMN_HEADERS: ColumnHeader[] = [
  { column: COLUMNS.date, label: 'Data', rotated: false },
  { column: COLUMNS.dayOfMonth, label: 'Dzień miesiąca', rotated: false },
  { column: COLUMNS.dayLabel, label: 'Dzień tygodnia', rotated: false },
  {
    column: COLUMNS.workHoursRange,
    label: 'Godziny pracy od - do',
    rotated: false,
  },
  {
    column: COLUMNS.nominalHours,
    label: 'Nominalny czas pracy',
    rotated: false,
  },
  {
    column: COLUMNS.actualHours,
    label: 'Faktyczny czas pracy w godz.',
    rotated: false,
  },
  { column: COLUMNS.overtimeDay, label: 'Nadliczbowe w dzień', rotated: true },
  { column: COLUMNS.overtimeNight, label: 'Nadliczbowe w nocy', rotated: true },
  { column: COLUMNS.saturdays, label: 'Soboty', rotated: true },
  {
    column: COLUMNS.sundaysAndHolidays,
    label: 'Niedziele i święta',
    rotated: true,
  },
  { column: COLUMNS.nightTime, label: 'Pora nocna', rotated: true },
  { column: COLUMNS.vacationLeave, label: 'Urlop wypoczynkowy', rotated: true },
  { column: COLUMNS.onDemandLeave, label: 'Urlop na żądanie', rotated: true },
  {
    column: COLUMNS.maternityLeave,
    label: 'Urlop macierzyński',
    rotated: true,
  },
  { column: COLUMNS.parentalLeave, label: 'Urlop wychowawczy', rotated: true },
  { column: COLUMNS.unpaidLeave, label: 'Urlop bezpłatny', rotated: true },
  { column: COLUMNS.sickLeave, label: 'Choroba', rotated: true },
  { column: COLUMNS.care, label: 'Opieka', rotated: true },
  {
    column: COLUMNS.unexcusedAbsence,
    label: 'Nieobecność nieusprawiedliwiona',
    rotated: true,
  },
  { column: COLUMNS.military, label: 'Służba wojskowa', rotated: true },
];

/** 'Zwolnienia' spans two columns in row 11 with paid / unpaid below it. */
const EXCUSED_ABSENCE_HEADER = {
  label: 'Zwolnienia',
  paid: { column: COLUMNS.paidExcusedAbsence, label: 'Płatne' },
  unpaid: { column: COLUMNS.unpaidExcusedAbsence, label: 'Niepłatne' },
} as const;

// ---------------------------------------------------------------------------

@Injectable()
export class ReportEngine {
  /**
   * Builds a workbook with one timesheet worksheet per employee and returns
   * it as an XLSX file buffer.
   */
  async generateReportBuffer(data: MonthlyTimesheetData[]): Promise<Buffer> {
    const workbook = new Workbook();

    data.forEach((timesheet) => {
      this.buildEmployeeWorksheet(workbook, timesheet);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /** Adds the worksheet of a single employee and renders all its sections. */
  private buildEmployeeWorksheet(
    workbook: Workbook,
    { year, month, employee, company, rows }: MonthlyTimesheetData,
  ): Worksheet {
    const sheet = workbook.addWorksheet(getEmployeeSheetName(employee));
    const totalsRow: number = REPORT_LAYOUT.rows.firstData + rows.length;
    const monthName: string = format(new Date(year, month - 1, 1), 'LLLL', {
      locale: pl,
    });

    this.configureColumns(sheet);
    this.configurePageSetup(sheet, totalsRow);
    this.renderTopHeader(sheet, monthName, year);
    this.renderEmployeeDetails(sheet, employee);
    this.renderCompanyDetails(sheet, company);
    this.renderTableHeaders(sheet);
    this.renderTableDataRows(sheet, rows);
    this.renderTableTotalsRow(sheet, totalsRow);

    return sheet;
  }

  /** Sets the width of every column used by the report. */
  private configureColumns(sheet: Worksheet): void {
    Object.entries(REPORT_LAYOUT.columnWidths).forEach(([column, width]) => {
      sheet.getColumn(column).width = width;
    });
  }

  /**
   * Prints the report on a single landscape A4 page. The print area ends at
   * the totals row, whose index depends on the length of the month.
   */
  private configurePageSetup(sheet: Worksheet, lastRow: number): void {
    sheet.pageSetup = {
      orientation: 'landscape',
      paperSize: A4_PAPER_SIZE,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      printArea: `A1:${REPORT_LAYOUT.table.last}${lastRow}`,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    };
  }

  /** Renders the title, the month / year boxes and the generation timestamp. */
  private renderTopHeader(
    sheet: Worksheet,
    monthName: string,
    year: number,
  ): void {
    const { rows, table, topHeader } = REPORT_LAYOUT;

    sheet.mergeCells(
      `${table.first}${rows.title}:${topHeader.titleEnd}${rows.title}`,
    );
    const titleCell = sheet.getCell(`${table.first}${rows.title}`);
    titleCell.value = 'Miesięczna ewidencja czasu pracy';
    titleCell.font = REPORT_STYLE.fonts.title;
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells(
      `${table.first}${rows.subtitle}:${topHeader.subtitleEnd}${rows.subtitle}`,
    );
    sheet.getCell(`${table.first}${rows.subtitle}`).value = 'za miesiąc';

    const monthCell = sheet.getCell(`${topHeader.month}${rows.subtitle}`);
    monthCell.value = monthName;
    const yearCell = sheet.getCell(`${topHeader.year}${rows.subtitle}`);
    yearCell.value = year;

    [monthCell, yearCell].forEach((cell) => {
      styleHeaderCell(cell, {
        fill: REPORT_STYLE.colors.dayOff,
        font: REPORT_STYLE.fonts.bold,
        alignment: REPORT_STYLE.alignments.center,
      });
    });

    applyBordersToRange(
      sheet,
      rows.title,
      columnNumber(table.first),
      rows.subtitle,
      columnNumber(topHeader.titleEnd),
    );

    sheet.mergeCells(
      `${topHeader.generatedAtStart}${rows.title}:${topHeader.generatedAtEnd}${rows.title}`,
    );
    styleHeaderCell(
      sheet.getCell(`${topHeader.generatedAtStart}${rows.title}`),
      {
        font: REPORT_STYLE.fonts.generatedAt,
        alignment: REPORT_STYLE.alignments.center,
      },
    );
    sheet.getCell(`${topHeader.generatedAtStart}${rows.title}`).value =
      `Wygenerowano: ${formatTimestamp(new Date())}`;
  }

  /** Renders the employee box: name, PESEL, contract and position. */
  private renderEmployeeDetails(sheet: Worksheet, employee: Employee): void {
    const { rows, table, employeeDetails } = REPORT_LAYOUT;
    const details: [string, string][] = [
      ['Pracownik', `${employee.name} ${employee.surname}`],
      ['Pesel', employee.pesel],
      ['Umowa', getContractTypeLabel(employee)],
      ['Stanowisko', getPositionLabel(employee)],
    ];

    details.forEach(([label, value], index) => {
      const row: number = rows.detailsStart + index;

      sheet.mergeCells(
        `${table.first}${row}:${employeeDetails.labelEnd}${row}`,
      );
      const labelCell = sheet.getCell(`${table.first}${row}`);
      labelCell.value = label;
      labelCell.font = REPORT_STYLE.fonts.bold;

      sheet.mergeCells(
        `${employeeDetails.valueStart}${row}:${employeeDetails.valueEnd}${row}`,
      );
      const valueCell = sheet.getCell(`${employeeDetails.valueStart}${row}`);
      valueCell.value = value;
      valueCell.alignment = { horizontal: 'center' };
    });

    applyBordersToRange(
      sheet,
      rows.detailsStart,
      columnNumber(table.first),
      rows.detailsStart + details.length - 1,
      columnNumber(employeeDetails.valueEnd),
    );
  }

  /** Renders the company box: name, address and NIP. */
  private renderCompanyDetails(sheet: Worksheet, company: Company): void {
    const { rows, companyDetails } = REPORT_LAYOUT;
    const lines: string[] = [
      company.name,
      getAddressLabel(company.address),
      `NIP: ${company.nip}`,
    ];

    lines.forEach((line, index) => {
      const row: number = rows.detailsStart + index;

      sheet.mergeCells(
        `${companyDetails.start}${row}:${companyDetails.end}${row}`,
      );
      const cell = sheet.getCell(`${companyDetails.start}${row}`);
      cell.value = line;
      cell.alignment = { horizontal: 'center' };
    });

    applyBordersToRange(
      sheet,
      rows.detailsStart,
      columnNumber(companyDetails.start),
      rows.detailsStart + lines.length - 1,
      columnNumber(companyDetails.end),
    );
  }

  /**
   * Renders the three header rows of the table: the section groups, the
   * column labels (rotated in narrow columns) and the excused absence split.
   */
  private renderTableHeaders(sheet: Worksheet): void {
    const { rows, table, headerRowHeights } = REPORT_LAYOUT;
    const { columnHeaderTop: top, columnHeaderBottom: bottom } = rows;
    const { bold } = REPORT_STYLE.fonts;
    const { wrappedCenter, rotated } = REPORT_STYLE.alignments;

    Object.entries(headerRowHeights).forEach(([row, height]) => {
      sheet.getRow(Number(row)).height = height;
    });

    GROUP_HEADERS.forEach(({ from, to, label }) => {
      sheet.mergeCells(`${from}${rows.groupHeader}:${to}${rows.groupHeader}`);
      const cell = sheet.getCell(`${from}${rows.groupHeader}`);
      cell.value = label;
      styleHeaderCell(cell, { font: bold, alignment: wrappedCenter });
    });

    COLUMN_HEADERS.forEach(({ column, label, rotated: isRotated }) => {
      sheet.mergeCells(`${column}${top}:${column}${bottom}`);
      const cell = sheet.getCell(`${column}${top}`);
      cell.value = label;
      styleHeaderCell(cell, {
        font: bold,
        alignment: isRotated ? rotated : wrappedCenter,
      });
    });

    const { paid, unpaid } = EXCUSED_ABSENCE_HEADER;
    sheet.mergeCells(`${paid.column}${top}:${unpaid.column}${top}`);
    const excusedCell = sheet.getCell(`${paid.column}${top}`);
    excusedCell.value = EXCUSED_ABSENCE_HEADER.label;
    styleHeaderCell(excusedCell, { font: bold, alignment: wrappedCenter });

    [paid, unpaid].forEach(({ column, label }) => {
      const cell = sheet.getCell(`${column}${bottom}`);
      cell.value = label;
      styleHeaderCell(cell, { font: bold, alignment: rotated });
    });

    Object.entries(ABSENCE_COLUMN_COLORS).forEach(([column, color]) => {
      sheet.getCell(`${column}${top}`).fill = getSolidFill(color);
    });

    applyBordersToRange(
      sheet,
      rows.groupHeader,
      columnNumber(table.first),
      bottom,
      columnNumber(table.last),
    );
  }

  /** Renders one row per day of the month and greys out zero absences. */
  private renderTableDataRows(
    sheet: Worksheet,
    rows: DailyTimesheetRow[],
  ): void {
    const { firstData } = REPORT_LAYOUT.rows;

    rows.forEach((day, index) => {
      this.renderDayRow(sheet, firstData + index, day);
    });

    this.applyZeroValueFormatting(sheet, firstData + rows.length - 1);
  }

  /**
   * Renders a single day. Hour cells always hold numbers so the SUM formulas
   * work; the number format decides whether a zero shows as '0' or '-'.
   */
  private renderDayRow(
    sheet: Worksheet,
    rowNumber: number,
    day: DailyTimesheetRow,
  ): void {
    const { table } = REPORT_LAYOUT;
    const { numberFormats, colors } = REPORT_STYLE;
    const row = sheet.getRow(rowNumber);

    row.getCell(COLUMNS.date).value = format(day.date, 'dd/MM/yyyy');
    row.getCell(COLUMNS.dayOfMonth).value = day.date.getDate();
    row.getCell(COLUMNS.dayLabel).value = day.dayLabel;

    forEachColumn(table.firstHours, table.last, (column) => {
      const cell = row.getCell(column);
      cell.value = 0;
      cell.numFmt = numberFormats.dashZero;
    });

    if (!day.isDayOff) {
      forEachColumn(table.firstWorkedHours, table.lastWorkedHours, (column) => {
        row.getCell(column).numFmt = numberFormats.number;
      });

      row.getCell(COLUMNS.workHoursRange).value = day.workHoursRange;
      row.getCell(COLUMNS.nominalHours).value = day.nominalHours;
      row.getCell(COLUMNS.actualHours).value = day.actualHours;

      Object.entries(OVERTIME_COLUMNS).forEach(([key, column]) => {
        row.getCell(column).value = day.overtime[key as keyof OvertimeHours];
      });

      if (day.absence) {
        row.getCell(ABSENCE_STATUS_COLUMNS[day.absence.status]).value =
          day.absence.hours;
      }
    }

    forEachColumn(table.first, table.last, (column) => {
      const color: string | undefined = day.isDayOff
        ? colors.dayOff
        : ABSENCE_COLUMN_COLORS[column];

      styleHeaderCell(row.getCell(column), {
        fill: color,
        alignment:
          column === COLUMNS.dayLabel
            ? REPORT_STYLE.alignments.wrappedCenter
            : REPORT_STYLE.alignments.center,
        border: REPORT_STYLE.borders.thin,
      });
    });
  }

  /** Shows zeros in the absence columns in a subtle grey font. */
  private applyZeroValueFormatting(
    sheet: Worksheet,
    lastDataRow: number,
  ): void {
    const { rows, table } = REPORT_LAYOUT;

    sheet.addConditionalFormatting({
      ref: `${table.firstAbsence}${rows.firstData}:${table.last}${lastDataRow}`,
      rules: [
        {
          type: 'cellIs',
          operator: 'equal',
          formulae: ['0'],
          priority: 1,
          style: {
            font: { color: { argb: REPORT_STYLE.colors.zeroValueFont } },
          },
        },
      ],
    });
  }

  /** Renders the RAZEM row with a SUM formula for every hour column. */
  private renderTableTotalsRow(sheet: Worksheet, totalsRow: number): void {
    const { rows, table } = REPORT_LAYOUT;
    const lastDataRow: number = totalsRow - 1;

    sheet.mergeCells(
      `${table.first}${totalsRow}:${table.totalsLabelEnd}${totalsRow}`,
    );
    sheet.getCell(`${table.first}${totalsRow}`).value = 'RAZEM';

    forEachColumn(table.firstSummed, table.last, (column) => {
      const cell = sheet.getCell(`${column}${totalsRow}`);
      cell.value = {
        formula: `SUM(${column}${rows.firstData}:${column}${lastDataRow})`,
      };
      cell.numFmt = REPORT_STYLE.numberFormats.number;
    });

    forEachColumn(table.first, table.last, (column) => {
      styleHeaderCell(sheet.getCell(`${column}${totalsRow}`), {
        font: REPORT_STYLE.fonts.bold,
        alignment: REPORT_STYLE.alignments.center,
      });
    });

    applyBordersToRange(
      sheet,
      totalsRow,
      columnNumber(table.first),
      totalsRow,
      columnNumber(table.last),
    );
  }
}

const getAddressLabel = ({
  street,
  houseNumber,
  postCode,
  city,
}: AddressEntity): string => `${street} ${houseNumber}, ${postCode} ${city}`;

const getContractTypeLabel = ({
  contractType,
  workHours,
}: Pick<Employee, 'contractType' | 'workHours'>): string => {
  let label: string = `${contractType === ContractType.EMPLOYMENT_CONTRACT ? 'Umowa o pracę' : ''} `;

  if (workHours / 8 === 1) {
    label += '1 etat';
  } else {
    const fraction = new Fraction(workHours, 8);
    label += `${fraction.toString()} etatu`;
  }

  return label;
};

const getPositionLabel = ({
  location,
  position,
}: Pick<Employee, 'position' | 'location'>): string => {
  let label: string = 'Pracownik ';

  if (location === Location.OFFICE) {
    label += 'biurowy';
  } else if (location === Location.PRODUCTION) {
    label += 'produkcji';
  }

  label += ' - ';
  label += upperFirst(position);

  return label;
};
