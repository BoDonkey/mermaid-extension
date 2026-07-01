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
        initBlock: '%%{init: { "theme": "base" }}%%'
      }
    });

    assert.strictEqual(widget.extend, '@apostrophecms/widget-type');
    assert.strictEqual(fields.add.mermaid.type, 'mermaidField');
    assert.strictEqual(fields.add.mermaid.initBlock, '%%{init: { "theme": "base" }}%%');
    assert.strictEqual(fields.add.caption.type, 'string');
    assert.strictEqual(typeof widget.methods, 'function');
  });
});
