import type { HostBridge, MountRemoteApp } from "@platform/runtime-mf-contract";
import { createElement, type ReactNode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { clearMountContainer, reportCleanupFailure } from "../shared/cleanup";

export type ReactRemoteRenderContext = {
  container: HTMLElement;
  bridge: HostBridge;
  basename: string;
};

export type ReactRemoteRenderer = (
  context: ReactRemoteRenderContext,
) => ReactNode;

function ReadySignal({
  children,
  onReady,
}: {
  children?: ReactNode;
  onReady(): void;
}): ReactNode {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return children;
}

export function createReactRemoteMount(
  render: ReactRemoteRenderer,
): MountRemoteApp {
  return ({ container, bridge, basename }) => {
    const root = createRoot(container);
    let disposed = false;
    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const onReady = () => {
      if (!disposed) {
        resolveReady();
      }
    };

    try {
      root.render(
        createElement(
          ReadySignal,
          { onReady },
          render({ container, bridge, basename }),
        ),
      );
    } catch (error) {
      disposed = true;
      resolveReady();

      try {
        root.unmount();
      } catch (cleanupError) {
        reportCleanupFailure(bridge, cleanupError, "partial_cleanup");
      }

      clearMountContainer(container, bridge, "partial_cleanup");

      throw error;
    }

    return {
      ready,
      unmount() {
        if (disposed) {
          return;
        }

        disposed = true;
        resolveReady();

        try {
          root.unmount();
        } finally {
          clearMountContainer(container, bridge, "cleanup");
        }
      },
    };
  };
}
