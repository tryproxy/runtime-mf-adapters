# @platform/runtime-mf-adapters

Framework adapters that implement the lifecycle defined by `@platform/runtime-mf-contract`.

The package owns framework bootstrap, readiness plumbing, partial-startup cleanup, and idempotent disposal. Product repositories still own routing, providers, bridge mapping, styles, portals, and application UI.

## React

```ts
import { createReactRemoteMount } from "@platform/runtime-mf-adapters/react";
```

`createReactRemoteMount(renderer)` creates a `MountRemoteApp`. The renderer receives the container, bridge, and basename. The adapter resolves readiness from its first committed React effect.

## Angular

```ts
import { createAngularRemoteMount } from "@platform/runtime-mf-adapters/angular";
```

`createAngularRemoteMount(options)` owns `createApplication`, root creation and attachment, readiness, disposal during bootstrap, and cleanup.

The remote supplies its root component, providers, root-input configuration, and optional post-attachment behavior such as standalone router initialization.

## Installation

Until the first release tag exists, sibling repositories may use a local file dependency:

```bash
pnpm add @platform/runtime-mf-adapters@file:../runtime-mf-adapters
```

Before release, replace that file dependency with an immutable package revision.

React, ReactDOM, and Angular are optional peer dependencies. Each consumer supplies only its own framework runtime.

## Verification

```bash
pnpm typecheck
pnpm build
```
