import {
  Modal,
  Typography,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { useState } from 'react';
import { StyledModal } from '../../../styles/Modal.styles';
import { useModelStore } from '../../../utils/store';
import type { AppSettings } from '../../../utils/store';
import { RestartAlt } from '@mui/icons-material';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { settings, updateSettings, resetSettings } = useModelStore();
  const [currentTab, setCurrentTab] = useState(0);

  // Local state for settings (apply on save)
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(useModelStore.getState().settings);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  const updateLocalSettings = (updates: Partial<AppSettings>) => {
    setLocalSettings({
      performance: {
        ...localSettings.performance,
        ...(updates.performance || {}),
      },
      camera: {
        ...localSettings.camera,
        ...(updates.camera || {}),
      },
      grid: {
        ...localSettings.grid,
        ...(updates.grid || {}),
      },
      theme: {
        ...localSettings.theme,
        ...(updates.theme || {}),
      },
      export: {
        ...localSettings.export,
        ...(updates.export || {}),
      },
    });
  };

  return (
    <Modal
      keepMounted
      open={open}
      onClose={handleCancel}
      aria-labelledby="settings-modal-title"
      aria-describedby="settings-modal-description"
    >
      <StyledModal sx={{ minWidth: 500, maxWidth: 600 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Settings
          </Typography>
          <Button
            startIcon={<RestartAlt />}
            onClick={handleReset}
            size="small"
            variant="outlined"
          >
            Reset to Defaults
          </Button>
        </Box>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Performance" />
          <Tab label="Camera" />
          <Tab label="Grid & Snap" />
          <Tab label="Theme" />
          <Tab label="Export" />
        </Tabs>

        <Divider sx={{ mb: 2 }} />

        {/* Performance Settings */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography gutterBottom>
                Device Pixel Ratio (DPR)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Higher values improve visual quality but reduce performance
              </Typography>
              <Slider
                value={localSettings.performance.dpr}
                onChange={(_e, value) =>
                  updateLocalSettings({
                    performance: { ...localSettings.performance, dpr: value as number },
                  })
                }
                min={1}
                max={3}
                step={0.5}
                marks={[
                  { value: 1, label: 'Low' },
                  { value: 1.5, label: 'Medium' },
                  { value: 2, label: 'High' },
                  { value: 3, label: 'Ultra' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.performance.shadowsEnabled}
                  onChange={(e) =>
                    updateLocalSettings({
                      performance: {
                        ...localSettings.performance,
                        shadowsEnabled: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Enable Shadows"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.performance.autoAdjustPerformance}
                  onChange={(e) =>
                    updateLocalSettings({
                      performance: {
                        ...localSettings.performance,
                        autoAdjustPerformance: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Auto-Adjust Performance"
            />
            <Typography variant="caption" color="text.secondary">
              Automatically adjusts quality based on framerate
            </Typography>
          </Box>
        </TabPanel>

        {/* Camera Settings */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography gutterBottom>
                Field of View (FOV): {localSettings.camera.fov}°
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Lower values zoom in, higher values zoom out
              </Typography>
              <Slider
                value={localSettings.camera.fov}
                onChange={(_e, value) =>
                  updateLocalSettings({
                    camera: { ...localSettings.camera, fov: value as number },
                  })
                }
                min={40}
                max={80}
                step={5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                Movement Speed: {localSettings.camera.moveSpeed}x
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Controls how fast the camera pans and rotates
              </Typography>
              <Slider
                value={localSettings.camera.moveSpeed}
                onChange={(_e, value) =>
                  updateLocalSettings({
                    camera: { ...localSettings.camera, moveSpeed: value as number },
                  })
                }
                min={0.5}
                max={2}
                step={0.1}
                marks={[
                  { value: 0.5, label: 'Slow' },
                  { value: 1, label: 'Normal' },
                  { value: 2, label: 'Fast' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                Max Distance: {localSettings.camera.maxDistance}m
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Maximum zoom out distance
              </Typography>
              <Slider
                value={localSettings.camera.maxDistance}
                onChange={(_e, value) =>
                  updateLocalSettings({
                    camera: { ...localSettings.camera, maxDistance: value as number },
                  })
                }
                min={200}
                max={800}
                step={50}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.camera.invertControls}
                  onChange={(e) =>
                    updateLocalSettings({
                      camera: {
                        ...localSettings.camera,
                        invertControls: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Invert Camera Controls"
            />
            <Typography variant="caption" color="text.secondary">
              Inverts vertical camera rotation
            </Typography>
          </Box>
        </TabPanel>

        {/* Grid & Snap Settings */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.grid.enabled}
                  onChange={(e) =>
                    updateLocalSettings({
                      grid: { ...localSettings.grid, enabled: e.target.checked },
                    })
                  }
                />
              }
              label="Show Grid"
            />

            {localSettings.grid.enabled && (
              <>
                <Box>
                  <Typography gutterBottom>
                    Grid Size: {localSettings.grid.size}
                  </Typography>
                  <Slider
                    value={localSettings.grid.size}
                    onChange={(_e, value) =>
                      updateLocalSettings({
                        grid: { ...localSettings.grid, size: value as number },
                      })
                    }
                    min={50}
                    max={200}
                    step={10}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>
                    Grid Divisions: {localSettings.grid.divisions}
                  </Typography>
                  <Slider
                    value={localSettings.grid.divisions}
                    onChange={(_e, value) =>
                      updateLocalSettings({
                        grid: { ...localSettings.grid, divisions: value as number },
                      })
                    }
                    min={10}
                    max={50}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
              </>
            )}

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.grid.snapEnabled}
                  onChange={(e) =>
                    updateLocalSettings({
                      grid: { ...localSettings.grid, snapEnabled: e.target.checked },
                    })
                  }
                />
              }
              label="Enable Snap to Grid"
            />

            {localSettings.grid.snapEnabled && (
              <Box>
                <Typography gutterBottom>
                  Snap Size: {localSettings.grid.snapSize}m
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Objects will snap to this grid size
                </Typography>
                <Slider
                  value={localSettings.grid.snapSize}
                  onChange={(_e, value) =>
                    updateLocalSettings({
                      grid: { ...localSettings.grid, snapSize: value as number },
                    })
                  }
                  min={1}
                  max={20}
                  step={1}
                  marks={[
                    { value: 1, label: '1m' },
                    { value: 5, label: '5m' },
                    { value: 10, label: '10m' },
                    { value: 20, label: '20m' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Theme Settings */}
        <TabPanel value={currentTab} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Theme Mode</InputLabel>
              <Select
                value={localSettings.theme.mode}
                label="Theme Mode"
                onChange={(e) =>
                  updateLocalSettings({
                    theme: {
                      ...localSettings.theme,
                      mode: e.target.value as 'dark' | 'light',
                    },
                  })
                }
              >
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="light">Light</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Primary Color</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  type="color"
                  value={localSettings.theme.primaryColor}
                  onChange={(e) =>
                    updateLocalSettings({
                      theme: { ...localSettings.theme, primaryColor: e.target.value },
                    })
                  }
                  style={{ width: 60, height: 40, cursor: 'pointer', border: 'none' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {localSettings.theme.primaryColor}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography gutterBottom>Selection Outline Color</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  type="color"
                  value={localSettings.theme.outlineColor}
                  onChange={(e) =>
                    updateLocalSettings({
                      theme: { ...localSettings.theme, outlineColor: e.target.value },
                    })
                  }
                  style={{ width: 60, height: 40, cursor: 'pointer', border: 'none' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {localSettings.theme.outlineColor}
                </Typography>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Export Settings */}
        <TabPanel value={currentTab} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Export Quality</InputLabel>
              <Select
                value={localSettings.export.quality}
                label="Export Quality"
                onChange={(e) =>
                  updateLocalSettings({
                    export: {
                      ...localSettings.export,
                      quality: e.target.value as 'low' | 'medium' | 'high',
                    },
                  })
                }
              >
                <MenuItem value="low">Low - Fastest, smaller file</MenuItem>
                <MenuItem value="medium">Medium - Balanced</MenuItem>
                <MenuItem value="high">High - Best quality, larger file</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={localSettings.export.format}
                label="Export Format"
                onChange={(e) =>
                  updateLocalSettings({
                    export: {
                      ...localSettings.export,
                      format: e.target.value as 'glb' | 'gltf',
                    },
                  })
                }
              >
                <MenuItem value="glb">GLB - Binary (recommended)</MenuItem>
                <MenuItem value="gltf">GLTF - JSON</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.export.includeTextures}
                  onChange={(e) =>
                    updateLocalSettings({
                      export: {
                        ...localSettings.export,
                        includeTextures: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Include Textures in Export"
            />
            <Typography variant="caption" color="text.secondary">
              Embed textures in the exported file (increases file size)
            </Typography>
          </Box>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Settings
          </Button>
        </Box>
      </StyledModal>
    </Modal>
  );
};

export default SettingsModal;
