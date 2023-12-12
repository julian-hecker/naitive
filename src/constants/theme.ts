import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme,
} from '@react-navigation/native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
  adaptNavigationTheme,
} from 'react-native-paper';

const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

// https://m3.material.io/styles/color/static/baseline
export const CombinedLightTheme: Theme & MD3Theme = {
  ...MD3LightTheme,
  ...NavLightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...NavLightTheme.colors,
  },
};

export const CombinedDarkTheme: Theme & MD3Theme = {
  ...MD3DarkTheme,
  ...NavDarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...NavDarkTheme.colors,
  },
};
