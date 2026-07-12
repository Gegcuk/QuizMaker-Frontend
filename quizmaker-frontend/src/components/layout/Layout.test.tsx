import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import Layout from './Layout';

vi.mock('./', () => ({
  Navbar: () => <header>Navigation shell</header>,
  Footer: () => <footer>Footer shell</footer>,
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders shared chrome around the active route outlet', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Routed content</p>} />
        </Route>
      </Routes>,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Navigation shell')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Routed content');
    expect(screen.getByText('Footer shell')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
