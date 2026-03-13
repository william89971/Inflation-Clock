"use client";

import { createContext, useContext } from "react";
import { CountryCode } from "@/data/inflation";

export interface UserData {
  country: CountryCode;
  age: number;
  income: number;
  birthYear: number;
}

const DEFAULT_USER: UserData = {
  country: "US",
  age: 30,
  income: 5000,
  birthYear: new Date().getFullYear() - 30,
};

export function saveUserData(data: Partial<UserData>) {
  if (typeof window === "undefined") return;
  const existing = getUserData();
  const merged = { ...existing, ...data };
  localStorage.setItem("user_data", JSON.stringify(merged));
}

export function getUserData(): UserData {
  if (typeof window === "undefined") return DEFAULT_USER;
  const raw = localStorage.getItem("user_data");
  if (!raw) return DEFAULT_USER;
  try {
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER;
  }
}

export const UserDataContext = createContext<UserData>(DEFAULT_USER);
export const useUserData = () => useContext(UserDataContext);
