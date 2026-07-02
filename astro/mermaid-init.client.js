/**
 * Shared Mermaid widget renderer for Astro frontends.
 *
 * This module is loaded once per page via the `@bodonkey/mermaid-extension/astro`
 * integration (see astro/integration.js), which injects a `page`-stage script
 * that imports this file. Because it runs as a real ES module included in
 * Astro's normal script bundle -- not as an inline <script> tag embedded in
 * widget markup -- it is guaranteed to execute even when ApostropheCMS's
 * in-context editor swaps widget/area markup in via `element.innerHTML = ...`.
 * Browsers never execute <script> tags inserted through innerHTML, which is
 * why the render logic can no longer live inside MermaidWidget.astro itself.
 *
 * Responsibilities:
 *  - Render every `[data-mermaid-widget]` currently in the DOM on load.
 *  - Re-render after Apostrophe's `apos.bus` 'refreshed' / 'modal-opened'
 *    events (the correct signal for "area content changed").
 *  - Keep a MutationObserver as a defense-in-depth fallback in case a widget
 *    is inserted through some other path that doesn't fire those events.
 */

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

class MermaidWidgetRenderer {
  constructor(container) {
    this.container = container;
    this.widgetId = container.dataset.widgetId;
    this.target = container.querySelector('.mermaid-target');
    this.codeEl = container.querySelector('.mermaid-code');
    this.rendered = false;
  }

  async ensureMermaid() {
    if (window.mermaid) {
      return window.mermaid;
    }

    if (!window.__mermaidWidgetLoader) {
      window.__mermaidWidgetLoader = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = MERMAID_CDN;
        s.async = true;
        s.onload = () => {
          window.mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: 'default'
          });
          resolve(window.mermaid);
        };
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
    }

    return window.__mermaidWidgetLoader;
  }

  async render() {
    if (this.rendered) {
      return;
    }
    if (!this.target || !this.codeEl) {
      return;
    }

    try {
      const mermaid = await this.ensureMermaid();

      this.target.style.visibility = 'hidden';
      const id = 'mermaid-' + Math.random().toString(36).slice(2);
      const src = this.applyInitBlock(this.codeEl.textContent || '');

      // Render to a temporary container to catch error SVGs
      const { svg } = await mermaid.render(id, src);

      // Check if the SVG contains error indicators
      if (svg.includes('Syntax error') || svg.includes('Parse error')) {
        this.target.innerHTML = '<div style="color:red;padding:10px;background:#ffe6e6;border:1px solid #ff0000;border-radius:4px;">Error rendering diagram. Please check your Mermaid syntax.</div>';
      } else {
        this.target.innerHTML = svg;
      }

      // Clean up any error SVGs that Mermaid might have inserted elsewhere
      document.querySelectorAll('svg[id^="d"]').forEach(errSvg => {
        if (errSvg.querySelector('text')?.textContent?.includes('Syntax error')) {
          errSvg.remove();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Mermaid rendering error:', err);
      this.target.innerHTML = '<div style="color:red;padding:10px;background:#ffe6e6;border:1px solid #ff0000;border-radius:4px;">Error rendering diagram. Please check your Mermaid syntax.</div>';

      // Clean up any orphaned error SVGs
      document.querySelectorAll('svg[id^="mermaid-"]').forEach(errSvg => {
        if (!this.container.contains(errSvg)) {
          errSvg.remove();
        }
      });
    } finally {
      this.target.style.visibility = 'visible';
      this.rendered = true;
    }
  }

  destroy() {
    this.rendered = false;
  }

  applyInitBlock(source) {
    const code = source.trim();
    const init = (this.container.dataset.mermaidInit || '').trim();

    if (!init || code.startsWith('%%{') || code.startsWith('---')) {
      return code;
    }

    return `${init}\n${code}`;
  }
}

const mermaidWidgets = window.__mermaidWidgets || new Map();
window.__mermaidWidgets = mermaidWidgets;

// Make init idempotent & debounced (DOM can churn a lot in the editor)
let initTimer = window.__mermaidWidgetInitTimer || null;
function scheduleInit(delay = 50) {
  if (initTimer) {
    clearTimeout(initTimer);
  }
  initTimer = setTimeout(initMermaidWidgets, delay);
  window.__mermaidWidgetInitTimer = initTimer;
}

function initMermaidWidgets() {
  // Reset any previous instances so re-renders are clean
  mermaidWidgets.forEach(w => w.destroy());
  mermaidWidgets.clear();

  // (Re)discover and render all current widgets
  document.querySelectorAll('[data-mermaid-widget]').forEach(container => {
    const widgetId = container.dataset.widgetId;
    if (!widgetId) {
      return;
    }
    const w = new MermaidWidgetRenderer(container);
    mermaidWidgets.set(widgetId, w);
    w.render();
  });
}

function startMermaidWidgets() {
  initMermaidWidgets();

  if (window.__mermaidWidgetObserver || !document.body) {
    return;
  }

  // Defense-in-depth fallback only -- apos.bus 'refreshed' below is the
  // primary re-render trigger for editor-driven changes.
  window.__mermaidWidgetObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const added = [ ...m.addedNodes ].some(
        n => n.nodeType === 1 && (n.matches?.('[data-mermaid-widget]') || n.querySelector?.('[data-mermaid-widget]'))
      );
      const isCodeChange = m.target?.matches?.('.mermaid-code') || m.target?.closest?.('[data-mermaid-widget]');
      if (added || isCodeChange) {
        scheduleInit(75);
        break;
      }
    }
  });

  window.__mermaidWidgetObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function bootMermaidWidgets() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => startMermaidWidgets(), { once: true });
  } else {
    startMermaidWidgets();
  }
  requestAnimationFrame(() => scheduleInit(100));
}

// window.apos may not exist yet the moment this module first runs (the
// admin bar/bus can initialize slightly later). Try to bind right away,
// and retry at a couple of later lifecycle points rather than only once,
// so a timing race can't silently leave the 'refreshed' listener unbound.
function bindAposBus() {
  if (window.__mermaidWidgetAposBound || !window.apos?.bus?.$on) {
    return;
  }
  window.__mermaidWidgetAposBound = true;
  // Fires when a modal opens (page editor, piece editor, etc.)
  window.apos.bus.$on('modal-opened', () => scheduleInit(75));
  // Fires when areas/widgets refresh after edits or insertions -- this is
  // the correct signal for editor-driven innerHTML swaps.
  window.apos.bus.$on('refreshed', () => scheduleInit(50));
}

// Guard against this module's setup running more than once even if it
// somehow ends up included on the page multiple times (e.g. a project
// registers the integration twice).
if (!window.__mermaidWidgetBooted) {
  window.__mermaidWidgetBooted = true;

  bootMermaidWidgets();
  document.addEventListener('astro:page-load', () => scheduleInit(50));

  bindAposBus();
  document.addEventListener('DOMContentLoaded', bindAposBus, { once: true });
  window.addEventListener('load', bindAposBus, { once: true });
}
