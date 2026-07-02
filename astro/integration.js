/**
 * Astro integration for @bodonkey/mermaid-extension.
 *
 * Registering this integration ensures the Mermaid widget's render logic
 * (astro/mermaid-init.client.js) is loaded as part of Astro's normal page
 * script bundle -- once, automatically, on every page -- instead of relying
 * on a <script> tag embedded inside the widget's own markup.
 *
 * That distinction matters for ApostropheCMS's in-context editor: when a
 * widget is inserted or an area is refreshed in the editor, Apostrophe
 * updates the DOM via `element.innerHTML = ...`. Browsers never execute
 * <script> tags inserted through innerHTML, so any render logic that lived
 * only inside MermaidWidget.astro's own inline script would never run for
 * editor-driven changes. Injecting the script at the page level sidesteps
 * that entirely: it's already loaded and its `apos.bus` 'refreshed' listener
 * is already registered before the editor ever swaps in new markup.
 *
 * Usage (astro.config.mjs):
 *
 *   import { defineConfig } from 'astro/config';
 *   import mermaidWidget from '@bodonkey/mermaid-extension/astro/integration';
 *
 *   export default defineConfig({
 *     integrations: [ mermaidWidget() ]
 *   });
 */
export default function mermaidWidget() {
  return {
    name: '@bodonkey/mermaid-extension',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript(
          'page',
          'import \'@bodonkey/mermaid-extension/astro/mermaid-init.client.js\';'
        );
      }
    }
  };
}
