/**
 * Vitest treats a query-suffixed specifier as a distinct module instance, so
 * these imports re-run a module's top-level registration in the persistence
 * load-order test. Type them as the module they load.
 */
declare module '*?initial-persistence-order' {
  const bootstrap: typeof import('../src/bootstrap.ts')
  export = bootstrap
}

declare module '*?durable-reboot-preboot' {
  const preset: typeof import('../src/preset.ts')
  export = preset
}
