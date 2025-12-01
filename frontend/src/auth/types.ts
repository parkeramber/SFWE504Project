export type UserRole = "applicant" | "reviewer" | "sponsor_donor" | "steward" | "engr_admin";

export type User = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: UserRole;
  is_active: boolean;
};

export type UserLoginInput = {
  email: string;
  password: string;
};

export type UserRegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  needsProfileSetup?: boolean;
};

export type UserUpdateInput = {
  first_name?: string;
  last_name?: string;
};

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};
