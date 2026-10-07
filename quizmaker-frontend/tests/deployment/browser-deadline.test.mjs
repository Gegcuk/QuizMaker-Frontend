import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withPreparationDeadline } from '../../scripts/browser/deadline.mjs';

test('pull, startup and launch share a single remaining budget', async () => {
  let clock = 0;
  const budgets = [];
  const phases = [
    { name: 'pull', run: async ({ remainingMs }) => { budgets.push(remainingMs); clock += 60; } },
    { name: 'startup', run: async ({ remainingMs }) => { budgets.push(remainingMs); clock += 20; } },
    { name: 'launch', run: async ({ remainingMs }) => { budgets.push(remainingMs); clock += 10; } },
  ];
  const result = await withPreparationDeadline(phases, { budgetMs: 100, now: () => clock });
  assert.deepEqual(budgets, [100, 40, 20]);
  assert.equal(result.milliseconds, 90);
});

test('a late pull prevents subsequent startup rather than giving it a fresh budget', async () => {
  let clock = 0;
  let started = false;
  await assert.rejects(withPreparationDeadline([
    { name: 'pull', run: async () => { clock = 101; } },
    { name: 'startup', run: async () => { started = true; } },
  ], { budgetMs: 100, now: () => clock }), /shared deadline/);
  assert.equal(started, false);
});

test('a late final launch is rejected even when every phase has returned', async () => {
  let clock = 0;
  await assert.rejects(withPreparationDeadline([
    { name: 'launch', run: async () => { clock = 101; } },
  ], { budgetMs: 100, now: () => clock }), /shared deadline/);
});

test('a stalled phase is aborted by the whole-path deadline', async () => {
  let signal;
  await assert.rejects(withPreparationDeadline([
    { name: 'stall', run: ({ signal: active }) => { signal = active; return new Promise(() => {}); } },
  ], { budgetMs: 25 }), /shared deadline/);
  assert.equal(signal.aborted, true);
});

test('failed compatibility cannot advance to browser launch', async () => {
  let launched = false;
  await assert.rejects(withPreparationDeadline([
    { name: 'compatibility', run: async () => { throw new Error('Incompatible version'); } },
    { name: 'launch', run: async () => { launched = true; } },
  ]), /Incompatible version/);
  assert.equal(launched, false);
});

test('an unbounded or oversized preparation budget is rejected', async () => {
  for (const budgetMs of [0, -1, Infinity, NaN, 300_001]) {
    await assert.rejects(withPreparationDeadline([], { budgetMs }), /five minutes/);
  }
});

test('cancellation stops a stalled preparation and prevents subsequent launch', async () => {
  const controller = new AbortController();
  let launched = false;
  const preparation = withPreparationDeadline([
    { name: 'pull', run: () => { controller.abort(new Error('Owner cancelled')); return new Promise(() => {}); } },
    { name: 'launch', run: async () => { launched = true; } },
  ], { signal: controller.signal });
  await assert.rejects(preparation, /Owner cancelled/);
  assert.equal(launched, false);
});

test('an already-cancelled preparation never starts a phase', async () => {
  const controller = new AbortController();
  controller.abort(new Error('Already cancelled'));
  let started = false;
  await assert.rejects(withPreparationDeadline([
    { name: 'pull', run: async () => { started = true; } },
  ], { signal: controller.signal }), /Already cancelled/);
  assert.equal(started, false);
});
