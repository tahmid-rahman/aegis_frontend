import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance } from "react-native";

type Theme = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // helper
};

// ✅ default value so useTheme never crashes
const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  effectiveTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
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
    if (theme === "system") {
      setEffectiveTheme(Appearance.getColorScheme() || "light");
    } else {
      setEffectiveTheme(theme as EffectiveTheme);
    }
  }, [theme]);

  // Cycle helper: light → dark → system → light
  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "light" ? "dark" : prev === "dark" ? "system" : "light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
