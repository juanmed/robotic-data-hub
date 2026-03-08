import { mockUser } from "@/data/mockData";
import type { User } from "@/types";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const authService = {
  async login(_email: string, _password: string): Promise<User> {
    await delay();
    return mockUser;
  },
  async logout(): Promise<void> {
    await delay(100);
  },
  async getCurrentUser(): Promise<User> {
    await delay();
    return mockUser;
  },
  async register(_email: string, _password: string, _name: string): Promise<User> {
    await delay(500);
    return { ...mockUser, id: "usr_new" };
  },
};
