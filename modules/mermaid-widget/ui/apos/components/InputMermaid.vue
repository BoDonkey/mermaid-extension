<template>
  <AposInputWrapper :modifiers="modifiers" :field="field" :error="effectiveError" :uid="uid"
    :display-options="displayOptions">
    <template #body>
      <div>
        <h2>Mermaid Diagram</h2>
        <div id="preview-editor" ref="editor"></div>
        <button @click="renderDiagram">Render Diagram</button>
        <button @click="clearDiagram">Clear</button>
        <div id="mermaidOutput"></div>
      </div>
    </template>
  </AposInputWrapper>
</template>

<script>
// import mermaid from 'mermaid';
import ace from 'ace-builds/src-noconflict/ace'
import 'ace-builds/src-noconflict/mode-plain_text'
import 'ace-builds/src-noconflict/theme-monokai'
import AposInputMixin from 'Modules/@apostrophecms/schema/mixins/AposInputMixin';

export default {
  mixins: [AposInputMixin],
  name: 'InputMermaid',
  data() {
    return {
      editor: null,
    };
  },
  mounted() {
    // Debug: Log the modelValue to see its structure
    console.log('Mermaid widget modelValue:', this.modelValue, typeof this.modelValue);
    
    this.editor = ace.edit(this.$refs.editor, {
      minLines: 10,
      fontSize: 14,
      tabSize: 2
    });
    this.editor.session.setMode("ace/mode/plain_text");
    this.editor.setTheme("ace/theme/monokai");

    // Set the editor's value to the existing value from the database
    // Handle different possible value formats
    let initialValue = '';
    if (this.modelValue) {
      if (typeof this.modelValue === 'string') {
        initialValue = this.modelValue;
      } else if (typeof this.modelValue === 'object' && this.modelValue.data) {
        initialValue = this.modelValue.data;
      } else if (typeof this.modelValue === 'object' && this.modelValue !== null) {
        // Try to stringify if it's an object but not the expected format
        console.warn('Unexpected modelValue format:', this.modelValue);
        initialValue = JSON.stringify(this.modelValue, null, 2);
      }
    }
    
    // Only set value if we have a valid string
    if (typeof initialValue === 'string') {
      this.editor.setValue(initialValue);
      this.editor.clearSelection(); // Clear selection after setting value
    }

    // Update Apostrophe data on editor change
    this.editor.getSession().on('change', () => {
      this.update(this.editor.getValue());
    });
    
    mermaid.initialize({ startOnLoad: false });
  },
  methods: {
    validate(value) {
      if (this.field.required) {
        if (!value) {
          return 'required';
        }
      }
      return false;
    },
    update(value) {
      // Update the ApostropheCMS data using the proper method
      this.$emit('update:modelValue', value);
      this.next = value;
    },
    async renderDiagram() {
      const mermaidCode = this.editor.getValue();
      const mermaidContainer = document.getElementById('mermaidOutput');

      // Clear previous diagram
      mermaidContainer.innerHTML = '';

      try {
        // Generate unique ID for this diagram
        const diagramId = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        
        // Use mermaid's render method (newer API)
        const { svg } = await mermaid.render(diagramId, mermaidCode);
        mermaidContainer.innerHTML = svg;
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        mermaidContainer.innerHTML = `<div style="color: red;">Error rendering diagram: ${error.message}</div>`;
      }
    },
    clearDiagram() {
      this.editor.setValue('');
      this.editor.clearSelection();
      document.getElementById('mermaidOutput').innerHTML = '';
    }
  }
}
</script>

<style scoped>
#preview-editor {
  height: 250px;
}

button {
  margin: 10px 10px 10px 0;
}

#mermaidOutput {
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 100px;
}
</style>