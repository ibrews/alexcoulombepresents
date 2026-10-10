import test from "node:test";
import assert from "node:assert/strict";
import { secondBrainAccess, KIT_CLASS_SLUGS, KIT_MEMBER_FOLDER, KIT_OBJECT_KEY } from "../lib/secondBrain/course.ts";
import { loginDestination } from "../lib/commerce/loginDestination.ts";
import { classFolders, canOpen } from "../lib/classMaterials.ts";

test("every eligible route selects a download folder governed by the same material rule", () => {
  for (const access of [{member:true,purchasedSlugs:[]}, ...KIT_CLASS_SLUGS.map(slug => ({member:false,purchasedSlugs:[slug]}))]) {
    const result = secondBrainAccess(access);
    assert.equal(result.allowed, true);
    const folder = classFolders.find(f => f.slug === result.downloadClass)!;
    assert.equal(canOpen(folder, access), true);
    assert.equal(folder.materials.find(m => m.key === "second-brain-kit")?.source.kind, "r2");
  }
  assert.equal(secondBrainAccess({member:true,purchasedSlugs:[]}).downloadClass, KIT_MEMBER_FOLDER);
});
test("unrelated purchases and absent membership do not open the kit", () => {
  for (const purchasedSlugs of [[], ["wed-2026-10-28-vr-cinematics"], ["acp-second-brain"]]) {
    assert.equal(secondBrainAccess({member:false,purchasedSlugs}).allowed, false);
  }
  assert.ok(KIT_OBJECT_KEY.startsWith("class-materials/acp-second-brain/"));
});
test("magic link destination rejects alternate origins and encoded redirects", () => {
  assert.equal(loginDestination("/members/second-brain"), "/members/second-brain");
  for (const value of [undefined,null,"https://evil.invalid","//evil.invalid","/%2F/evil.invalid","/members/second-brain?next=https://evil.invalid",["/members/second-brain"]]) assert.equal(loginDestination(value), "/account");
});
