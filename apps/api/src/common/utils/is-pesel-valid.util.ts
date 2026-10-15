export const isPeselValid = (pesel: string): boolean => {
  if (typeof pesel !== 'string' || !/^\d{11}$/.test(pesel)) {
    return false;
  }

  const weights: number[] = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum: number = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(pesel[i], 10) * weights[i];
  }

  let controlDigit: number = 10 - (sum % 10);
  if (controlDigit === 10) {
    controlDigit = 0;
  }

  if (controlDigit !== parseInt(pesel[10], 10)) {
    return false;
  }

  const yearPart: number = parseInt(pesel.substr(0, 2), 10);
  let monthPart: number = parseInt(pesel.substr(2, 2), 10);
  const dayPart: number = parseInt(pesel.substr(4, 2), 10);

  let year: number = 0;

  if (monthPart >= 1 && monthPart <= 12) {
    year = 1900 + yearPart;
  } else if (monthPart >= 21 && monthPart <= 32) {
    year = 2000 + yearPart;
    monthPart -= 20;
  } else if (monthPart >= 41 && monthPart <= 52) {
    year = 2100 + yearPart;
    monthPart -= 40;
  } else if (monthPart >= 61 && monthPart <= 72) {
    year = 2200 + yearPart;
    monthPart -= 60;
  } else if (monthPart >= 81 && monthPart <= 92) {
    year = 1800 + yearPart;
    monthPart -= 80;
  } else {
    return false;
  }

  const date: Date = new Date(year, monthPart - 1, dayPart);
  return (
    date.getFullYear() === year &&
    date.getMonth() === monthPart - 1 &&
    date.getDate() === dayPart
  );
};
