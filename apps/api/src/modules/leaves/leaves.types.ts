export interface ILeaveDto {
  overdue: ILeaveDetailsDto;
  current: ILeaveDetailsDto;
}

export interface ILeaveDetailsDto {
  base: number;
  used: number;
}
