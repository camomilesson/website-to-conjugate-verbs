// Read-only audit of the already built public artifact; run pnpm build first.
import assert from "node:assert/strict"
import { readFile, readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = new URL("../dist/", import.meta.url)
const html = await readFile(new URL("index.html", root), "utf8")
assert.match(html, /Conjugadora · Practice/)
assert.match(html, /rel="icon"[^>]+href="\/favicon\.svg"/)
for (const [, reference] of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)) {
  const asset = await stat(new URL(reference.slice(1), root))
  assert.ok(
    asset.isFile() && asset.size > 0,
    `Missing build asset: ${reference}`,
  )
}
assert.match(await readFile(new URL("favicon.svg", root), "utf8"), /<svg/)
const files = []
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else files.push(path)
  }
}
await walk(fileURLToPath(new URL("assets/", root)))
const forbidden = [
  /La Conjugadora/,
  /\/dev\/(?:progress|history|account-controls)/,
  /isolated fixture demo|Development-only synthetic/,
  /SUPABASE_SERVICE_ROLE_KEY|ACCOUNT_ADMIN_KEY|ACCOUNT_ALLOWED_ORIGINS/,
  /sb_secret_[A-Za-z0-9_-]+/,
]
for (const file of files.filter((path) => /\.(?:js|css|map)$/.test(path))) {
  const content = await readFile(file, "utf8")
  for (const pattern of forbidden)
    assert.ok(
      !pattern.test(content),
      `Unexpected private/demo/old-brand content in ${file}`,
    )
  for (const token of content.match(
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  ) ?? []) {
    let claims
    try {
      claims = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      )
    } catch {
      continue
    }
    assert.notEqual(claims?.role, "service_role", `Privileged JWT in ${file}`)
  }
}
assert.equal(
  (await readdir(new URL("data/verbs/", root))).filter((name) =>
    name.endsWith(".json"),
  ).length,
  100,
)
console.log(
  `PASS release artifact: branding, favicon/assets, 100 verbs, no fixture routes or detected privileged credentials (${files.length} asset files)`,
)
