import { Alignment, Borders, Cell, Fill, Font, Worksheet } from 'exceljs';
import { format } from 'date-fns';

const THIN_BORDER: Partial<Borders> = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
};

/**
 * Sets the border on every cell of the range. ExcelJS keeps borders per cell,
 * so a merged area only renders a full frame when all its cells have one.
 */
export const applyBordersToRange = (
  worksheet: Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  borderStyle: Partial<Borders> = THIN_BORDER,
): void => {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      worksheet.getCell(row, col).border = borderStyle;
    }
  }
};

/** Formats a date as `DD.MM.YYYY HH:mm:ss` in the server's local time. */
export const formatTimestamp = (date: Date): string =>
  format(date, 'dd.MM.yyyy HH:mm:ss');

export interface HeaderCellOptions {
  /** ARGB color, e.g. 'FFD9D9D9' */
  fill?: string;
  font?: Partial<Font>;
  alignment?: Partial<Alignment>;
  border?: Partial<Borders>;
}

/** Applies the given fill, font, alignment and border to a single cell. */
export const styleHeaderCell = (
  cell: Cell,
  { fill, font, alignment, border }: HeaderCellOptions,
): void => {
  if (fill) {
    cell.fill = getSolidFill(fill);
  }
  if (font) {
    cell.font = font;
  }
  if (alignment) {
    cell.alignment = alignment;
  }
  if (border) {
    cell.border = border;
  }
};

/** Solid background fill; ExcelJS reads the color of solid fills from fgColor. */
export const getSolidFill = (argb: string): Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

/** Converts a single column letter to its 1-based index ('A' -> 1). */
export const columnNumber = (column: string): number =>
  column.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

/** Calls `callback` for every column letter from `from` to `to`, inclusive. */
export const forEachColumn = (
  from: string,
  to: string,
  callback: (column: string) => void,
): void => {
  for (let code = from.charCodeAt(0); code <= to.charCodeAt(0); code++) {
    callback(String.fromCharCode(code));
  }
};
