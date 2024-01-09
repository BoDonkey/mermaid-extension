module.exports = {
  extend: "@apostrophecms/widget-type",
  options: {
    label: "Mermaid Widget",
  },
  init(self) {
    self.addMermaidFieldType();
  },
  fields: {
    add: {
      mermaid: {
        type: "mermaidField",
        label: "Mermaid",
        help: "Enter your mermaid code here",
      },
    },
    group: {
      basics: {
        label: "Basics",
        fields: ["mermaid"],
      },
    },
  },
  methods(self) {
    return {
      addMermaidFieldType() {
        self.apos.schema.addFieldType({
          name: "mermaidField",
          convert: self.convertInput,
          vueComponent: "InputMermaid",
        });
      },
      async convertInput(req, field, data, object) {
        const input = data[field.name];
        if (data[field.name] == null || data[field.name] === "") {
          if (field.required) {
            throw self.apos.error("notfound");
          }
        }
        object[field.name] = self.apos.launder.string(input, field.def);
      },
    };
  },
};
