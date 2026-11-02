import { act } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useHydrated } from '../../src/hooks/use-hydrated';

function HydrationProbe() {
  return <span>{useHydrated() ? 'hydrated' : 'server-rendered'}</span>;
}

describe('useHydrated', () => {
  it('transitions from the server snapshot to the client snapshot without hydration errors', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<HydrationProbe />);
    expect(container.textContent).toBe('server-rendered');

    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <HydrationProbe />, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });

      expect(container.textContent).toBe('hydrated');
      expect(recoverableErrors).toEqual([]);
    } finally {
      const mountedRoot = root;
      if (mountedRoot) {
        await act(async () => {
          mountedRoot.unmount();
        });
      }
    }
  });
});
