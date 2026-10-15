export type IUserEntity = {
  id: string;
  name: string;
  surname: string;
  pesel: string;
  email: string;
  password: string;
  accessToken?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ICreateUserDto = Omit<
  IUserEntity,
  'id' | 'createdAt' | 'updatedAt' | 'accessToken'
>;

export type IUpdateUserDto = Partial<ICreateUserDto>;
