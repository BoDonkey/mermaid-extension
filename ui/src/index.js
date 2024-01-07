import mermaid from 'mermaid';
export default () => {
  mermaid.initialize({ startOnLoad: false });
  apos.util.widgetPlayers.mermaid = {
    selector: '[data-mermaid-widget]',
    player: function (el) {
      const target = el.querySelector('.mermaid');
      setTimeout(async () => {
        await mermaid.run({
          nodes: document.querySelectorAll('.mermaid')
        });
      }, 100);
    }
  };
};
