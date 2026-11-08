# Checkpoint: Create your workspace

Conjugadora keeps its Vite app at the repository root and extracts the existing
verb catalogue into a reusable source package. This preserves the deployment
root and the public data URLs used by the app.

| Requirement                          | Evidence                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Two workspace packages               | Root `package.json`, `packages/verb-catalogue/package.json`, and `pnpm-workspace.yaml`                                              |
| One package depends on the other     | Root `dependencies`: `@conjugadora/verb-catalogue: workspace:*`; imports in `src/modules/practice/session.ts` and other app modules |
| Shared dependency catalog            | `pnpm-workspace.yaml` pins TypeScript; both package manifests use `catalog:`                                                        |
| Nx task default and dependency order | `nx.json`: `build.dependsOn: ["^build"]`; root `pnpm build` runs both package builds, validating the catalogue before the app       |
| Workflow path filter                 | `.github/workflows/workspace-check.yml`: matching `push.paths` and `pull_request.paths`                                             |
| Passing GitHub workflow              | Add the successful run URL after pushing and verifying this branch                                                                  |

## Reproduce

Use Node 24.x and the pnpm version pinned in the root manifest.

```sh
pnpm install --frozen-lockfile
pnpm check:release
pnpm exec nx run-many -t build --output-style=static
```

The workflow needs no account credentials: guest builds, local tests, and the
production artifact audit run without Supabase secrets. Production deployment
continues to follow the staging/owner-review/main workflow in Operations.
