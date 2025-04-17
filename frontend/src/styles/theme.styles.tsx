import { createTheme } from '@mui/material';

import { purple } from '@mui/material/colors';
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: purple['500'],
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: 'white',
        },
      },
    },
  },
});
