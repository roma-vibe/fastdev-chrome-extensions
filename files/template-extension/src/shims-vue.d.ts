// Types .vue imports for tools that use plain TypeScript (type-aware ESLint rules).
// vue-tsc resolves the real components and ignores this declaration.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}
