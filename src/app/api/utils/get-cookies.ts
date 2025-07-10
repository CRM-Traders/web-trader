"use server";

import { cookies } from "next/headers";

export const getTokens = async () => {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const rememberMe = cookieStore.get("rememberMe")?.value === "true";

  return {
    accessToken,
    refreshToken,
    rememberMe,
  };
};

export const getAccessToken = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  return {
    accessToken,
  };
};

export const getCookiesForHeaders = async () => {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get("accessToken")?.value,
    refreshToken: cookieStore.get("refreshToken")?.value,
    session: cookieStore.get("session")?.value,
  };
};
