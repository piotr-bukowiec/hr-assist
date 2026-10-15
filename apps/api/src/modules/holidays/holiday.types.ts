export interface NagerApiResponse {
  date: string;
  name: string;
  countryCode: string;
  nationalHoliday: boolean;
  subdivisionCodes: string[] | null;
  holidayTypes: string[];
}

export type IHolidayDto = Pick<NagerApiResponse, 'name' | 'date'>;

export type IHolidayEntity = Pick<IHolidayDto, 'name'> & {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};
