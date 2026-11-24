import assert from "node:assert/strict";
import test from "node:test";
import { HistoryStore } from "../src/components/builder/hooks/historyState.js";

type TestNode = { id: string; value: number };

const state = (id: string, value: number): TestNode[] => [{ id, value }];

test("undo and redo restore independent snapshots", () => {
  const history = new HistoryStore<TestNode[]>();
  history.record("home", state("home", 1));
  history.record("home", state("home", 2));

  assert.deepEqual(history.getSnapshot(), { canUndo: true, canRedo: false });
  assert.deepEqual(history.undo(), state("home", 1));
  assert.deepEqual(history.getSnapshot(), { canUndo: false, canRedo: true });
  assert.deepEqual(history.redo(), state("home", 2));
});

test("switching pages never restores another page's nodes", () => {
  const history = new HistoryStore<TestNode[]>();
  history.record("home", state("home", 1));
  history.record("home", state("home", 2));
  history.record("about", state("about", 10));

  assert.equal(history.undo(), null);

  history.record("about", state("about", 11));
  assert.deepEqual(history.undo(), state("about", 10));

  history.record("home", state("home", 2));
  assert.deepEqual(history.undo(), state("home", 1));
});

test("recording after undo discards only that page's redo branch", () => {
  const history = new HistoryStore<TestNode[]>();
  history.record("home", state("home", 1));
  history.record("home", state("home", 2));
  history.undo();
  history.record("home", state("home", 3));

  assert.equal(history.redo(), null);
  assert.deepEqual(history.undo(), state("home", 1));
});
