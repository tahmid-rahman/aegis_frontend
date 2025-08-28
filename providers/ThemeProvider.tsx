import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

type Theme = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  effectiveTheme: "light",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(
    Appearance.getColorScheme() || "light"
  );

  // Update effectiveTheme when system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === "system") {
        setEffectiveTheme(colorScheme || "light");
      }
    });
    return () => subscription.remove();
  }, [theme]);

  // Sync effectiveTheme when manual theme is selected
  useEffect(() => {
    if (theme !== "system") {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);