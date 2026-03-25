import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/hooks/useAuth";

/**
 * Render a component with AuthProvider wrapper for tests that require authentication context
 * This ensures components using useAuth hook can be tested properly
 */
export function renderWithAuth(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
