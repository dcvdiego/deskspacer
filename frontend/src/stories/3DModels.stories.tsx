import type { Meta, StoryObj } from '@storybook/react';
import { withThreeJsCanvas } from '../../.storybook/decorators/ThreeJsDecorator';
import MouseV3 from '../components/models/mice/MouseV3';
import Keyboard60Grey from '../components/models/keyboards/60_keyboards/Keyboard60Grey';
import Monitor169327Stand from '../components/models/displays/16_9_monitors/Monitor169327Stand';
import { useState } from 'react';

const meta: Meta = {
  title: '3D/Models',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    withThreeJsCanvas({
      cameraPosition: [50, 30, 50],
      cameraFov: 50,
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const Mouse: Story = {
  render: () => <MouseV3 />,
  parameters: {
    docs: {
      description: {
        story: 'A 3D mouse model. You can rotate the view using the mouse.',
      },
    },
  },
};

export const Keyboard: Story = {
  render: () => <Keyboard60Grey />,
  parameters: {
    docs: {
      description: {
        story: 'A 60% keyboard model in grey color scheme.',
      },
    },
  },
};

export const Monitor: Story = {
  render: () => <Monitor169327Stand />,
  decorators: [
    withThreeJsCanvas({
      cameraPosition: [100, 60, 100],
      cameraFov: 50,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'A 27-inch 16:9 monitor with stand.',
      },
    },
  },
};

export const MultipleModels: Story = {
  render: () => (
    <group>
      <MouseV3 position={[-10, 0, 0]} />
      <Keyboard60Grey position={[0, 0, 0]} />
      <MouseV3 position={[10, 0, 0]} />
    </group>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple models positioned in the same scene.',
      },
    },
  },
};

export const InteractiveModel: Story = {
  render: () => {
    const [scale, setScale] = useState(1);

    return (
      <group
        onClick={() => setScale(scale === 1 ? 1.2 : 1)}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
        scale={[scale, scale, scale]}
      >
        <MouseV3 />
      </group>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click on the model to toggle scale. This demonstrates interactive 3D models.',
      },
    },
  },
};

export const HighlightedModel: Story = {
  render: () => {
    const [hovered, setHovered] = useState(false);

    return (
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Keyboard60Grey />
        {hovered && (
          <mesh position={[0, 10, 0]} scale={1.1}>
            <boxGeometry args={[30, 5, 15]} />
            <meshStandardMaterial
              color="lightblue"
              opacity={0.2}
              transparent
              wireframe
            />
          </mesh>
        )}
      </group>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hover over the keyboard to see a highlight wireframe (simulating hover state).',
      },
    },
  },
};

export const LockedModel: Story = {
  render: () => {
    return (
      <group>
        <MouseV3 />
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="red" opacity={0.3} transparent />
        </mesh>
      </group>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'A locked model visualization (represented by red transparent box overlay).',
      },
    },
  },
};

export const DeskSetup: Story = {
  render: () => (
    <group>
      <Monitor169327Stand position={[0, 30, -20]} />
      <Keyboard60Grey position={[0, 30, 10]} />
      <MouseV3 position={[20, 30, 15]} />
    </group>
  ),
  decorators: [
    withThreeJsCanvas({
      cameraPosition: [120, 80, 120],
      cameraFov: 50,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Example of a complete desk setup with monitor, keyboard, and mouse.',
      },
    },
  },
};
