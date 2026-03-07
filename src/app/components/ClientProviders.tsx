"use client";

import { ThemeProvider } from "@/lib/themeContext";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ReactNode } from "react";

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            {children}
            <ThemeSwitcher />
        </ThemeProvider>
    );
}
