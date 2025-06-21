// Always return 'light' to force light theme regardless of system setting
export function useColorScheme() {
  return 'light' as const;
}
