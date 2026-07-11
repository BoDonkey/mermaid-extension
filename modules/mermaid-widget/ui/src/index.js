import { prepareMermaidSource } from './prepare-source.mjs';

// Load mermaid from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
script.async = true;

const readyPromise = new Promise((resolve) => {
  script.onload = () => {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default'
    });
    resolve();
  };
});

document.head.appendChild(script);

function parseJsonOption(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Invalid Mermaid widget JSON option:', e);
    return fallback;
  }
}

function getSemanticClassDefs(el) {
  const semanticClassDefs = parseJsonOption(el.dataset.mermaidSemanticClassDefs);

  Object.entries(el.dataset).forEach(([ key, value ]) => {
    if (!key.startsWith('mermaidClassDef') || !value) {
      return;
    }

    const className = key.slice('mermaidClassDef'.length);

    if (!className) {
      return;
    }

    semanticClassDefs[className.charAt(0).toLowerCase() + className.slice(1)] = value;
  });

  return semanticClassDefs;
}

export default () => {
  window.apos.util.widgetPlayers.mermaid = {
    selector: '[data-mermaid-widget]',
    player: async function (el) {
      // Wait for mermaid to be ready
      await readyPromise;

      const target = el.querySelector('.mermaid');
      if (!target || target.dataset.rendered) {
        return;
      }

      try {
        // Hide content initially to prevent flash
        target.style.visibility = 'hidden';

        // Render this specific diagram
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        const mermaidCode = prepareMermaidSource(target.textContent, {
          initBlock: el.dataset.mermaidInit,
          injectSemanticClassDefs: el.dataset.mermaidInjectSemanticClassDefs !== 'false',
          semanticClassDefs: getSemanticClassDefs(el)
        });

        const { svg } = await window.mermaid.render(id, mermaidCode);
        target.innerHTML = svg;
        target.style.visibility = 'visible';
        target.dataset.rendered = 'true';
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Mermaid rendering error:', error);
        target.innerHTML = '<div style="color: red; padding: 10px;">Error rendering diagram</div>';
        target.style.visibility = 'visible';
      }
    }
  };
};
