module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Mermaid Widget',
    icon: 'chart-icon',
    preview: false,
    initBlock: '',
    injectSemanticClassDefs: true,
    semanticClassDefs: {},
    width: 'half'
  },
  icons: {
    'chart-icon': 'ChartBar'
  },
  init(self) {
    self.addMermaidFieldType();
  },
  fields(self) {
    return {
      add: {
        mermaid: {
          type: 'mermaidField',
          label: 'Mermaid',
          help: 'Enter your mermaid code here',
          initBlock: self.options.initBlock,
          injectSemanticClassDefs: self.options.injectSemanticClassDefs,
          semanticClassDefs: self.options.semanticClassDefs,
          def: `graph TD
    A[Add your Mermaid diagram here]`
        },
        caption: {
          type: 'string',
          label: 'Caption'
        }
      }
    };
  },
  methods(self) {
    return {
      addMermaidFieldType() {
        self.apos.schema.addFieldType({
          name: 'mermaidField',
          convert: self.convertInput,
          vueComponent: 'InputMermaid'
        });
      },
      async convertInput(req, field, data, object) {
        const input = data[field.name];
        if (data[field.name] == null || data[field.name] === '') {
          if (field.required) {
            throw self.apos.error('notfound');
          }
          // Use the default value if provided and input is empty
          object[field.name] = field.def || '';
        } else {
          object[field.name] = self.apos.launder.string(input, field.def);
        }
      }
    };
  }
};
