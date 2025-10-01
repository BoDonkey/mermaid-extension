// Load mermaid from CDN
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
script.async = true;

let mermaidReady = false;
const readyPromise = new Promise((resolve) => {
  script.onload = () => {
    window.mermaid.initialize({ 
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default'
    });
    mermaidReady = true;
    resolve();
  };
});

document.head.appendChild(script);

export default () => {
  apos.util.widgetPlayers.mermaid = {
    selector: '[data-mermaid-widget]',
    player: async function (el) {
      // Wait for mermaid to be ready
      await readyPromise;

      const target = el.querySelector('.mermaid');
      if (!target || target.dataset.rendered) return;

      try {
        // Hide content initially to prevent flash
        target.style.visibility = 'hidden';

        // Render this specific diagram
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        const mermaidCode = target.textContent.trim();

        const { svg } = await window.mermaid.render(id, mermaidCode);
        target.innerHTML = svg;
        target.style.visibility = 'visible';
        target.dataset.rendered = 'true';
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        target.innerHTML = '<div style="color: red; padding: 10px;">Error rendering diagram</div>';
        target.style.visibility = 'visible';
      }
    }
  };
};