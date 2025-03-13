export function useTheme() {
  const theme = ref('light'); // Default theme

  const setTheme = (newTheme) => {
    theme.value = newTheme;
    document.body.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}