import assert from "node:assert/strict";
import test from "node:test";
import type { SiteSchema } from "../src/types/siteSchema.js";
import {
  countSiteNodes,
  deserializeSite,
  serializeSite,
} from "../src/utils/sitePersistence.js";

const site: SiteSchema = {
  pages: [
    { id: "home", name: "Home", nodes: [], edges: [] },
    { id: "about", name: "About", nodes: [], edges: [] },
  ],
  activePageId: "about",
};

test("multi-page sites survive save and reload", () => {
  assert.deepEqual(deserializeSite(serializeSite(site)), site);
  assert.deepEqual(deserializeSite({ diagram: serializeSite(site) }), site);
});

test("legacy diagrams migrate to a Home page", () => {
  const migrated = deserializeSite({
    diagram: JSON.stringify({
      nodes: [{ id: "legacy", position: { x: 0, y: 0 }, data: {} }],
      edges: [],
    }),
  });

  assert.equal(migrated.activePageId, "home");
  assert.equal(migrated.pages[0].nodes[0].id, "legacy");
});

test("missing active pages fall back safely and empty sites are rejected", () => {
  const restored = deserializeSite({ ...site, activePageId: "missing" });
  assert.equal(restored.activePageId, "home");
  assert.throws(() => deserializeSite({ pages: [], activePageId: "home" }));
});

test("dashboard node counts include every page and legacy diagrams", () => {
  const populated = {
    ...site,
    pages: [
      { ...site.pages[0], nodes: [{ id: "a", position: { x: 0, y: 0 }, data: {} }] },
      {
        ...site.pages[1],
        nodes: [
          { id: "b", position: { x: 0, y: 0 }, data: {} },
          { id: "c", position: { x: 0, y: 0 }, data: {} },
        ],
      },
    ],
  };

  assert.equal(countSiteNodes(serializeSite(populated)), 3);
  assert.equal(countSiteNodes(JSON.stringify({ nodes: [{ id: "legacy" }] })), 1);
  assert.equal(countSiteNodes("not json"), 0);
});
