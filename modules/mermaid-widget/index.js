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
        def: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Check the code]
    D --> A`
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
          // Use the default value if provided and input is empty
          object[field.name] = field.def || "";
        } else {
          object[field.name] = self.apos.launder.string(input, field.def);
        }
      },
    };
  },
};