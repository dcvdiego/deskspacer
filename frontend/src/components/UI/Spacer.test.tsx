import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Spacer } from './Spacer';

describe('Spacer Component', () => {
  it('should render children', () => {
    const { getByText } = render(
      <Spacer time={2} spacing={10}>
        Test Content
      </Spacer>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should render as a bold element', () => {
    const { container } = render(
      <Spacer time={2} spacing={10}>
        Bold Text
      </Spacer>
    );

    const element = container.querySelector('b');
    expect(element).toBeInTheDocument();
  });

  it('should accept time prop', () => {
    const { container } = render(
      <Spacer time={5} spacing={20}>
        Content
      </Spacer>
    );

    const element = container.querySelector('b');
    expect(element).toBeInTheDocument();
  });

  it('should accept spacing prop', () => {
    const { container } = render(
      <Spacer time={3} spacing={100}>
        Content
      </Spacer>
    );

    const element = container.querySelector('b');
    expect(element).toBeInTheDocument();
  });

  it('should handle different time values', () => {
    const { rerender, getByText } = render(
      <Spacer time={1} spacing={5}>
        Test
      </Spacer>
    );

    expect(getByText('Test')).toBeInTheDocument();

    rerender(
      <Spacer time={10} spacing={5}>
        Test
      </Spacer>
    );

    expect(getByText('Test')).toBeInTheDocument();
  });

  it('should handle different spacing values', () => {
    const { rerender, getByText } = render(
      <Spacer time={2} spacing={1}>
        Test
      </Spacer>
    );

    expect(getByText('Test')).toBeInTheDocument();

    rerender(
      <Spacer time={2} spacing={200}>
        Test
      </Spacer>
    );

    expect(getByText('Test')).toBeInTheDocument();
  });

  it('should render with zero spacing', () => {
    const { getByText } = render(
      <Spacer time={1} spacing={0}>
        Zero Spacing
      </Spacer>
    );

    expect(getByText('Zero Spacing')).toBeInTheDocument();
  });

  it('should render with zero time', () => {
    const { getByText } = render(
      <Spacer time={0} spacing={50}>
        Zero Time
      </Spacer>
    );

    expect(getByText('Zero Time')).toBeInTheDocument();
  });

  it('should render empty children', () => {
    const { container } = render(<Spacer time={1} spacing={10}></Spacer>);

    const element = container.querySelector('b');
    expect(element).toBeInTheDocument();
    expect(element?.textContent).toBe('');
  });
});
