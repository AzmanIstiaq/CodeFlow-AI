import assert from "node:assert/strict";
import test from "node:test";
import { canExportSite } from "../src/frontendRules/export/exportPolicy.js";

const section = {
  id: "frame",
  type: "section",
  position: { x: 0, y: 0 },
  data: {},
};

test("export requires a populated page with a root frame", () => {
  assert.equal(canExportSite({ pages: [] }).ok, false);
  assert.equal(
    canExportSite({
      pages: [{ id: "home", nodes: [] }],
      activePageId: "home",
    }).ok,
    false
  );
  assert.equal(
    canExportSite({
      pages: [{ id: "home", nodes: [section] }],
      activePageId: "home",
    }).ok,
    true
  );
});

test("overlapping absolute siblings block export", () => {
  const result = canExportSite({
    pages: [
      {
        id: "home",
        nodes: [
          section,
          {
            id: "a",
            type: "text",
            parentNode: "frame",
            position: { x: 10, y: 10 },
            style: { width: 100, height: 40 },
            data: { positionMode: "absolute" },
          },
          {
            id: "b",
            type: "button",
            parentNode: "frame",
            position: { x: 20, y: 20 },
            style: { width: 100, height: 40 },
            data: { positionMode: "absolute" },
          },
        ],
      },
    ],
    activePageId: "home",
  });

  assert.equal(result.ok, false);
  assert.match(result.reasons.join("\n"), /Overlapping absolute nodes/);
});

test("overlap checks respect separate generated columns", () => {
  const result = canExportSite({
    pages: [
      {
        id: "home",
        nodes: [
          section,
          {
            id: "column-0",
            type: "column",
            position: { x: 0, y: 0 },
            data: { _ownedByColumn: "frame", _columnIndex: 0 },
          },
          {
            id: "column-1",
            type: "column",
            position: { x: 0, y: 0 },
            data: { _ownedByColumn: "frame", _columnIndex: 1 },
          },
          {
            id: "a",
            type: "text",
            position: { x: 0, y: 0 },
            style: { width: 100, height: 40 },
            data: {
              positionMode: "absolute",
              _ownedByColumn: "frame",
              _columnIndex: 0,
            },
          },
          {
            id: "b",
            type: "text",
            position: { x: 0, y: 0 },
            style: { width: 100, height: 40 },
            data: {
              positionMode: "absolute",
              _ownedByColumn: "frame",
              _columnIndex: 1,
            },
          },
        ],
      },
    ],
    activePageId: "home",
  });

  assert.equal(result.ok, true);
});
