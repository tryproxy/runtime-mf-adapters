import type { HostBridge } from "@platform/runtime-mf-contract";

type CleanupStage = "cleanup" | "partial_cleanup";

export function reportCleanupFailure(
  bridge: HostBridge,
  error: unknown,
  lifecycleStage: CleanupStage,
): void {
  try {
    bridge.telemetry.captureException(error, { lifecycleStage });
  } catch {
    // Cleanup and observability failures must not escape disposal.
  }
}

export function clearMountContainer(
  container: HTMLElement,
  bridge: HostBridge,
  lifecycleStage: CleanupStage,
): void {
  try {
    container.replaceChildren();
  } catch (error) {
    reportCleanupFailure(bridge, error, lifecycleStage);
  }
}
