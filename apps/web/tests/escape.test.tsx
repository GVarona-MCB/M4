import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function Item({ text }: { text: string }) {
  return <li data-testid="item">{text}</li>;
}

describe('escape en UI (FR-034)', () => {
  it('React renderiza el texto libre como dato, no como HTML (anti-XSS)', () => {
    const { container, getByTestId } = render(<Item text={'<script>alert(1)</script>'} />);
    // No se creó un elemento <script>; el texto se muestra literal.
    expect(container.querySelector('script')).toBeNull();
    expect(getByTestId('item').textContent).toBe('<script>alert(1)</script>');
  });
});
