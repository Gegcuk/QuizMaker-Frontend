import React, { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { useUnsavedChanges } from './useUnsavedChanges';

const Draft = () => {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');
  const { markClean, confirmDiscard } = useUnsavedChanges(text !== saved, { revision: text });
  return <>
    <label>Draft<input value={text} onChange={(event) => setText(event.target.value)} /></label>
    <Link to="/other">Navbar destination</Link>
    <Link to="?tab=preview">Preserve draft tab</Link>
    <button onClick={() => { setSaved(text); markClean(); }}>Save</button>
    <button onClick={() => { setText(''); setSaved(''); markClean(); }}>Reset</button>
    <button onClick={() => confirmDiscard(() => { setText(''); setSaved(''); })}>Discard form</button>
  </>;
};
const renderDraft = (initialEntries = ['/edit']) => renderWithProviders(<Routes>
  <Route path="/edit" element={<Draft />} />
  <Route path="/other" element={<p>Other page</p>} />
</Routes>, { withAuthProvider: false, initialEntries });
const unload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe('shared unsaved-work protection', () => {
  it('lets clean and reverted drafts navigate without a warning', async () => {
    const { user } = renderDraft();
    expect(unload()).toBe(false);
    await user.type(screen.getByLabelText('Draft'), 'Temporary');
    expect(unload()).toBe(true);
    await user.clear(screen.getByLabelText('Draft'));
    expect(unload()).toBe(false);
    await user.click(screen.getByRole('link', { name: 'Navbar destination' }));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('retains input on Stay and Escape, restores focus, and proceeds on Leave', async () => {
    const { user } = renderDraft();
    await user.type(screen.getByLabelText('Draft'), 'Keep this draft');
    const link = screen.getByRole('link', { name: 'Navbar destination' });
    await user.click(link);
    expect(await screen.findByRole('dialog', { name: 'Leave without saving?' })).toHaveAccessibleDescription(/unsaved changes will be lost/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus());
    await user.tab();
    expect(screen.getByRole('button', { name: 'Leave without saving' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(link).toHaveFocus();
    expect(screen.getByLabelText('Draft')).toHaveValue('Keep this draft');
    await user.click(link);
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    expect(screen.getByLabelText('Draft')).toHaveValue('Keep this draft');
    await user.click(link);
    await user.click(screen.getByRole('button', { name: 'Leave without saving' }));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(unload()).toBe(false);
  });

  it('blocks back/forward that would lose input, but lets query-only navigation preserve it', async () => {
    const { user, router } = renderDraft(['/other', '/edit']);
    await user.type(screen.getByLabelText('Draft'), 'Still editing');
    await user.click(screen.getByRole('link', { name: 'Preserve draft tab' }));
    expect(router.state.location.search).toBe('?tab=preview');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(async () => { await router.navigate(-1); });
    expect(screen.getByLabelText('Draft')).toHaveValue('Still editing');
    await act(async () => { await router.navigate(-1); });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    expect(router.state.location.pathname).toBe('/edit');
    await act(async () => { await router.navigate(-1); });
    await user.click(screen.getByRole('button', { name: 'Leave without saving' }));
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    await act(async () => { await router.navigate(1); });
    await user.type(screen.getByLabelText('Draft'), 'Forward draft');
    // A route ahead of this entry must be protected in exactly the same way.
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await act(async () => { await router.navigate('/other'); await router.navigate(-1); });
    await user.type(screen.getByLabelText('Draft'), 'Unsaved');
    await act(async () => { await router.navigate(1); });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('clears save/reset protection and guards later input again', async () => {
    const { user } = renderDraft();
    await user.type(screen.getByLabelText('Draft'), 'Saved');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(unload()).toBe(false);
    await user.type(screen.getByLabelText('Draft'), ' + unsaved');
    expect(unload()).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(unload()).toBe(false);
    await user.type(screen.getByLabelText('Draft'), 'Discard me');
    await user.click(screen.getByRole('button', { name: 'Discard form' }));
    await user.click(screen.getByRole('button', { name: 'Leave without saving' }));
    expect(screen.getByLabelText('Draft')).toHaveValue('');
    expect(unload()).toBe(false);
  });

  it('does not block leaving an expired principal', async () => {
    establishSession('fixture-access', 'fixture-refresh');
    const { user, router } = renderDraft();
    await user.type(screen.getByLabelText('Draft'), 'Private draft');
    await user.click(screen.getByRole('link', { name: 'Navbar destination' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    act(() => { terminateSession('forced-logout'); });
    expect(unload()).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(async () => { await router.navigate('/other'); });
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
