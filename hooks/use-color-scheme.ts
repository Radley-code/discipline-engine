import { useThemeContext } from '@/contexts/theme-context';

export function useColorScheme() {
  const { theme } = useThemeContext();
  return theme;
}
