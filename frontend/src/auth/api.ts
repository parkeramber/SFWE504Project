import api from "../api/client";
import type {
  User,
  UserLoginInput,
  UserRegisterInput,
  Tokens,
  UserUpdateInput,
  PasswordChangeInput,
} from "./types";

export async function registerUser(payload: UserRegisterInput): Promise<void> {
  await api.post("/auth/register", {
    email: payload.email,
    password: payload.password,
    first_name: payload.firstName || undefined,
    last_name: payload.lastName || undefined,
    role: payload.role,
  });
}

export async function loginUser(payload: UserLoginInput): Promise<Tokens> {
  const res = await api.post("/auth/login", {
    email: payload.email,
    password: payload.password,
  });
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
  };
}

export async function refreshSession(refreshToken: string): Promise<Tokens> {
  const res = await api.post("/auth/refresh", { token: refreshToken });
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
  };
}

export async function fetchMe(accessToken: string): Promise<User> {
  const res = await api.get<User>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function updateProfile(accessToken: string, payload: UserUpdateInput): Promise<User> {
  const res = await api.patch<User>("/auth/me", payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
}

export async function changePassword(accessToken: string, payload: PasswordChangeInput): Promise<void> {
  await api.post(
    "/auth/change-password",
    {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}
