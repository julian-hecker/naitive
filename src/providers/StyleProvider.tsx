import { ThemeProvider } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import {
  CombinedDarkTheme,
  CombinedLightTheme,
} from '../constants/theme';

// https://reactnavigation.org/blog/2020/01/29/using-react-navigation-5-with-react-native-paper/#theming
// https://callstack.github.io/react-native-paper/docs/guides/theming-with-react-navigation/#material-design-3
export function StyleProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  const theme =
    colorScheme === 'dark' ? CombinedDarkTheme : CombinedLightTheme;
  return (
    <PaperProvider theme={theme}>
      <ThemeProvider value={theme}>{children}</ThemeProvider>
    </PaperProvider>
  );
}
