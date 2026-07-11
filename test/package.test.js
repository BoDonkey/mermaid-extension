const assert = require('assert');

describe('@bodonkey/mermaid-extension', function() {
  it('exports the Apostrophe bundle configuration', function() {
    const extension = require('..');

    assert.deepStrictEqual(extension, {
      bundle: {
        directory: 'modules',
        modules: [ 'mermaid-widget' ]
      }
    });
  });

  it('registers the mermaid widget module shape', function() {
    const widget = require('../modules/mermaid-widget');
    const fields = widget.fields({
      options: {
        initBlock: '%%{init: { "theme": "base" }}%%',
        injectSemanticClassDefs: true,
        semanticClassDefs: {
          accent: 'fill:#f5f3ff,stroke:#7c3aed,color:#5b21b6'
        }
      }
    });

    assert.strictEqual(widget.extend, '@apostrophecms/widget-type');
    assert.strictEqual(fields.add.mermaid.type, 'mermaidField');
    assert.strictEqual(fields.add.mermaid.initBlock, '%%{init: { "theme": "base" }}%%');
    assert.strictEqual(fields.add.mermaid.injectSemanticClassDefs, true);
    assert.deepStrictEqual(fields.add.mermaid.semanticClassDefs, {
      accent: 'fill:#f5f3ff,stroke:#7c3aed,color:#5b21b6'
    });
    assert.strictEqual(fields.add.caption.type, 'string');
    assert.strictEqual(typeof widget.methods, 'function');
  });

  describe('prepareMermaidSource', function() {
    const semanticClassDefs = {
      accent: 'fill:#f5f3ff,stroke:#7c3aed,color:#5b21b6',
      info: {
        fill: '#eff6ff',
        stroke: '#2563eb',
        color: '#1d4ed8'
      },
      muted: 'fill:#fafafa,stroke:#d4d4d4,color:#737373,stroke-dasharray:5 5'
    };

    async function getHelpers() {
      return import('../modules/mermaid-widget/ui/src/prepare-source.mjs');
    }

    it('injects missing classDef lines for referenced flowchart semantic classes', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const source = `flowchart TB
  platform[Platform]:::accent
  note[Shared maintenance]:::info`;
      const prepared = prepareMermaidSource(source, { semanticClassDefs });

      assert(prepared.includes('classDef accent fill:#f5f3ff,stroke:#7c3aed,color:#5b21b6'));
      assert(prepared.includes('classDef info fill:#eff6ff,stroke:#2563eb,color:#1d4ed8'));
      assert(!prepared.includes('classDef muted'));
    });

    it('does not duplicate classDef lines already supplied by the author', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const source = `flowchart TB
  platform[Platform]:::accent
  classDef accent fill:#ffffff,stroke:#000000,color:#000000`;
      const prepared = prepareMermaidSource(source, { semanticClassDefs });
      const matches = prepared.match(/classDef accent/g) || [];

      assert.strictEqual(matches.length, 1);
      assert(prepared.includes('classDef accent fill:#ffffff,stroke:#000000,color:#000000'));
    });

    it('supports class statements as semantic class usage', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const source = `graph LR
  A[Draft] --> B[Published]
  class A,B muted`;
      const prepared = prepareMermaidSource(source, { semanticClassDefs });

      assert(prepared.includes('classDef muted fill:#fafafa,stroke:#d4d4d4,color:#737373,stroke-dasharray:5 5'));
    });

    it('does not inject classDefs into unsupported diagram types', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const source = `sequenceDiagram
  participant A
  participant B
  A->>B: hello :::accent`;
      const prepared = prepareMermaidSource(source, { semanticClassDefs });

      assert(!prepared.includes('classDef accent'));
    });

    it('preserves existing initBlock behavior and appends semantic classDefs', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const prepared = prepareMermaidSource('flowchart TB\n  A[Start]:::accent', {
        initBlock: '%%{init: { "theme": "base" }}%%',
        semanticClassDefs
      });

      assert(prepared.startsWith('%%{init: { "theme": "base" }}%%\nflowchart TB'));
      assert(prepared.includes('classDef accent fill:#f5f3ff,stroke:#7c3aed,color:#5b21b6'));
    });

    it('does not prepend initBlock to frontmatter diagrams but can still append classDefs', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const source = `---
title: Example
---
flowchart TB
  A[Start]:::accent`;
      const prepared = prepareMermaidSource(source, {
        initBlock: '%%{init: { "theme": "base" }}%%',
        semanticClassDefs
      });

      assert(!prepared.startsWith('%%{init'));
      assert(prepared.startsWith('---\ntitle: Example'));
      assert(prepared.includes('classDef accent fill:#f5f3ff,stroke:#7c3aed,color:#5b21b6'));
    });

    it('can disable semantic classDef injection', async function() {
      const { prepareMermaidSource } = await getHelpers();
      const prepared = prepareMermaidSource('flowchart TB\n  A[Start]:::accent', {
        injectSemanticClassDefs: false,
        semanticClassDefs
      });

      assert(!prepared.includes('classDef accent'));
    });
  });
});
