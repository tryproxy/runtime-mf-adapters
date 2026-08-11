import {
  type ApplicationRef,
  type ComponentRef,
  createComponent,
  type EnvironmentProviders,
  type Provider,
  type Type,
} from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import type { HostBridge, MountRemoteApp } from "@platform/runtime-mf-contract";
import { clearMountContainer, reportCleanupFailure } from "../shared/cleanup";

export type AngularRemoteMountContext = {
  container: HTMLElement;
  bridge: HostBridge;
  basename: string;
};

export type AngularRemoteRootContext<RootComponent> =
  AngularRemoteMountContext & {
    application: ApplicationRef;
    component: ComponentRef<RootComponent>;
    host: HTMLElement;
  };

export type AngularRemoteMountOptions<RootComponent> = {
  rootComponent: Type<RootComponent>;
  providers?(
    context: AngularRemoteMountContext,
  ): Array<Provider | EnvironmentProviders>;
  configureRoot?(context: AngularRemoteRootContext<RootComponent>): void;
  afterAttach?(context: AngularRemoteRootContext<RootComponent>): void;
};

export function createAngularRemoteMount<RootComponent>(
  options: AngularRemoteMountOptions<RootComponent>,
): MountRemoteApp {
  return ({ container, bridge, basename }) => {
    let destroyed = false;
    let cleanedUp = false;
    let application: ApplicationRef | undefined;
    let component: ComponentRef<RootComponent> | undefined;
    const mountContext: AngularRemoteMountContext = {
      container,
      bridge,
      basename,
    };

    const cleanup = (lifecycleStage: "cleanup" | "partial_cleanup") => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;

      try {
        component?.destroy();
      } catch (error) {
        reportCleanupFailure(bridge, error, lifecycleStage);
      }
      component = undefined;

      try {
        application?.destroy();
      } catch (error) {
        reportCleanupFailure(bridge, error, lifecycleStage);
      }
      application = undefined;

      clearMountContainer(container, bridge, lifecycleStage);
    };

    const ready = createApplication({
      providers: options.providers?.(mountContext) ?? [],
    })
      .then((createdApplication) => {
        application = createdApplication;

        if (destroyed) {
          cleanup("cleanup");
          return;
        }

        const host = container.ownerDocument.createElement("div");
        container.appendChild(host);

        const createdComponent = createComponent(options.rootComponent, {
          environmentInjector: createdApplication.injector,
          hostElement: host,
        });
        component = createdComponent;

        const rootContext: AngularRemoteRootContext<RootComponent> = {
          ...mountContext,
          application: createdApplication,
          component: createdComponent,
          host,
        };

        options.configureRoot?.(rootContext);
        createdApplication.attachView(createdComponent.hostView);
        createdComponent.changeDetectorRef.detectChanges();
        options.afterAttach?.(rootContext);
        createdApplication.tick();
      })
      .catch((error: unknown) => {
        cleanup("partial_cleanup");
        throw error;
      });

    return {
      ready,
      unmount() {
        if (destroyed) {
          return;
        }

        destroyed = true;
        void ready.then(
          () => cleanup("cleanup"),
          () => cleanup("cleanup"),
        );
      },
    };
  };
}
