import type { Meta, StoryObj } from '@storybook/react';
import { withThreeJsCanvas } from '../../.storybook/decorators/ThreeJsDecorator';
import MouseV3 from '../components/models/mice/MouseV3';
import Keyboard60Grey from '../components/models/keyboards/60_keyboards/Keyboard60Grey';
import Monitor169327Stand from '../components/models/displays/16_9_monitors/Monitor169327Stand';
import { Selection, EffectComposer, Outline } from '@react-three/postprocessing';
import { Select } from '@react-three/postprocessing';
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
};

export const Keyboard: Story = {
  render: () => <Keyboard60Grey />,
};

export const Monitor: Story = {
  render: () => <Monitor169327Stand />,
  decorators: [
    withThreeJsCanvas({
      cameraPosition: [100, 60, 100],
      cameraFov: 50,
    }),
  ],
};

export const MultipleModels: Story = {
  render: () => (
    <group>
      <MouseV3 position={[-10, 0, 0]} />
      <Keyboard60Grey position={[0, 0, 0]} />
      <MouseV3 position={[10, 0, 0]} />
    </group>
  ),
};

export const ModelWithSelection: Story = {
  render: () => {
    const [selected, setSelected] = useState(false);

    return (
      <Selection>
        <EffectComposer multisampling={0} autoClear={false}>
          <Outline
            visibleEdgeColor={0xffffff}
            hiddenEdgeColor={0xffffff}
            blur
            width={1000}
            edgeStrength={100}
          />
        </EffectComposer>
        <Select enabled={selected}>
          <group onClick={() => setSelected(!selected)}>
            <MouseV3 />
          </group>
        </Select>
      </Selection>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Click on the model to toggle selection outline effect',
      },
    },
  },
};

export const HoveredState: Story = {
  render: () => {
    const [hovered, setHovered] = useState(false);

    return (
      <Selection>
        <EffectComposer multisampling={0} autoClear={false}>
          <Outline
            visibleEdgeColor={hovered ? 0x00ff00 : 0xffffff}
            hiddenEdgeColor={hovered ? 0x00ff00 : 0xffffff}
            blur
            width={1000}
            edgeStrength={100}
          />
        </EffectComposer>
        <Select enabled={hovered}>
          <group
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <Keyboard60Grey />
          </group>
        </Select>
      </Selection>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hover over the keyboard to see the green outline effect (simulating hover state)',
      },
    },
  },
};

export const LockedModel: Story = {
  render: () => {
    const [locked] = useState(true);

    return (
      <group>
        <MouseV3 />
        {locked && (
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="red" opacity={0.3} transparent />
          </mesh>
        )}
      </group>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'A locked model visualization (represented by red transparent box overlay)',
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
        story: 'Example of a complete desk setup with monitor, keyboard, and mouse',
      },
    },
  },
};
