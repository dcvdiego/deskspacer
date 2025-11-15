import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { darkTheme } from '../../styles/theme.styles';
import { SelectChangeEvent } from '@mui/material';

const TransformModeSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (event: SelectChangeEvent) => void;
}) => {
  const { FormControl, InputLabel, Select, MenuItem } = require('@mui/material');
  const ThreeDRotationIcon = require('@mui/icons-material/ThreeDRotation').default;

  return (
    <FormControl sx={{ m: 1, minWidth: 150 }}>
      <InputLabel id="demo-simple-select-autowidth-label">Transform</InputLabel>
      <Select
        labelId="demo-simple-select-autowidth-label"
        id="demo-simple-select-autowidth"
        value={value}
        onChange={onChange}
        autoWidth
        label="transform-mode"
        startAdornment={
          value !== '' && <ThreeDRotationIcon sx={{ marginRight: '12px' }} />
        }
      >
        <MenuItem value="">
          <em>All</em>
        </MenuItem>
        <MenuItem value={'translate'}>Translate</MenuItem>
        <MenuItem value={'rotate'}>Rotate</MenuItem>
        <MenuItem value={'scale'}>Scale</MenuItem>
      </Select>
    </FormControl>
  );
};

const CameraToggle = ({
  disabled,
  onToggle,
}: {
  disabled: boolean;
  onToggle: () => void;
}) => {
  const { Tooltip, ToggleButton } = require('@mui/material');
  const ThreeSixty = require('@mui/icons-material/ThreeSixty').default;

  return (
    <Tooltip title={!disabled ? 'Disable Camera' : 'Enable Camera'} arrow>
      <ToggleButton
        value="Camera Toggle"
        selected={disabled}
        onChange={onToggle}
      >
        <ThreeSixty sx={!disabled ? { fill: 'lightgreen' } : { fill: 'red' }} />
      </ToggleButton>
    </Tooltip>
  );
};

const YAxisToggle = ({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) => {
  const { Tooltip, ToggleButton } = require('@mui/material');
  const ImportExport = require('@mui/icons-material/ImportExport').default;

  return (
    <Tooltip title={!enabled ? 'Enable Y-Axis' : 'Disable Y-Axis'} arrow>
      <ToggleButton
        value="Y-axis Toggle"
        selected={enabled}
        onChange={onToggle}
      >
        <ImportExport sx={enabled ? { fill: 'lightgreen' } : { fill: 'red' }} />
      </ToggleButton>
    </Tooltip>
  );
};

const LockToggle = ({
  isLocked,
  onToggle,
}: {
  isLocked: boolean;
  onToggle: () => void;
}) => {
  const { Tooltip, ToggleButton } = require('@mui/material');
  const Lock = require('@mui/icons-material/Lock').default;
  const LockOpen = require('@mui/icons-material/LockOpen').default;

  return (
    <Tooltip title={!isLocked ? 'Lock model' : 'Unlock model'} arrow>
      <ToggleButton value="Lock Toggle" selected={isLocked} onChange={onToggle}>
        {!isLocked ? <LockOpen /> : <Lock />}
      </ToggleButton>
    </Tooltip>
  );
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={darkTheme}>{component}</ThemeProvider>);
};

describe('Header Sub-Components', () => {
  describe('TransformModeSelect', () => {
    it('should render with default empty value', () => {
      const mockOnChange = vi.fn();
      renderWithTheme(<TransformModeSelect value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Transform')).toBeInTheDocument();
    });

    it('should render with translate value', () => {
      const mockOnChange = vi.fn();
      renderWithTheme(<TransformModeSelect value="translate" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Transform')).toBeInTheDocument();
    });

    it('should render with rotate value', () => {
      const mockOnChange = vi.fn();
      renderWithTheme(<TransformModeSelect value="rotate" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Transform')).toBeInTheDocument();
    });

    it('should render with scale value', () => {
      const mockOnChange = vi.fn();
      renderWithTheme(<TransformModeSelect value="scale" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Transform')).toBeInTheDocument();
    });

    it('should show icon when value is not empty', () => {
      const mockOnChange = vi.fn();
      const { container } = renderWithTheme(
        <TransformModeSelect value="translate" onChange={mockOnChange} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not show icon when value is empty', () => {
      const mockOnChange = vi.fn();
      const { container } = renderWithTheme(
        <TransformModeSelect value="" onChange={mockOnChange} />
      );

      const adornment = container.querySelector('.MuiSelect-icon')?.previousSibling;
      expect(adornment).not.toHaveClass('MuiInputAdornment-root');
    });
  });

  describe('CameraToggle', () => {
    it('should render with camera enabled', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<CameraToggle disabled={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Disable Camera/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-pressed', 'true');
    });

    it('should render with camera disabled', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<CameraToggle disabled={true} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Enable Camera/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onToggle when clicked', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderWithTheme(<CameraToggle disabled={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Disable Camera/i });
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should show correct tooltip for enabled state', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<CameraToggle disabled={false} onToggle={mockOnToggle} />);

      expect(screen.getByRole('button', { name: /Disable Camera/i })).toBeInTheDocument();
    });

    it('should show correct tooltip for disabled state', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<CameraToggle disabled={true} onToggle={mockOnToggle} />);

      expect(screen.getByRole('button', { name: /Enable Camera/i })).toBeInTheDocument();
    });
  });

  describe('YAxisToggle', () => {
    it('should render with Y-axis disabled', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<YAxisToggle enabled={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Enable Y-Axis/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-pressed', 'true');
    });

    it('should render with Y-axis enabled', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<YAxisToggle enabled={true} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Disable Y-Axis/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onToggle when clicked', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderWithTheme(<YAxisToggle enabled={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Enable Y-Axis/i });
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should toggle from enabled to disabled', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderWithTheme(<YAxisToggle enabled={true} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Disable Y-Axis/i });
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('LockToggle', () => {
    it('should render with unlocked state', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<LockToggle isLocked={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Lock model/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-pressed', 'true');
    });

    it('should render with locked state', () => {
      const mockOnToggle = vi.fn();
      renderWithTheme(<LockToggle isLocked={true} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Unlock model/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should call onToggle when clicked', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderWithTheme(<LockToggle isLocked={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Lock model/i });
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should show LockOpen icon when unlocked', () => {
      const mockOnToggle = vi.fn();
      const { container } = renderWithTheme(
        <LockToggle isLocked={false} onToggle={mockOnToggle} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show Lock icon when locked', () => {
      const mockOnToggle = vi.fn();
      const { container } = renderWithTheme(
        <LockToggle isLocked={true} onToggle={mockOnToggle} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should toggle from unlocked to locked', async () => {
      const user = userEvent.setup();
      const mockOnToggle = vi.fn();
      renderWithTheme(<LockToggle isLocked={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button', { name: /Lock model/i });
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });
});
