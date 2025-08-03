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
import mermaid from 'mermaid';
import ace from 'ace-builds/src-noconflict/ace'
import 'ace-builds/src-noconflict/mode-plain_text'
import 'ace-builds/src-noconflict/theme-monokai'
import AposInputMixin from 'Modules/@apostrophecms/schema/mixins/AposInputMixin';

export default {
  mixins: [AposInputMixin],
  name: 'InputMermaid',
  props: {
    value: {
      type: [String, Object],
      default: ''
    }
  },
  data() {
    return {
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
  },
  watch: {
    // Watch for changes to the value prop
    value: {
      handler(newValue) {
        if (this.editor && newValue !== this.editor.getValue()) {
          this.setEditorValue(newValue);
        }
      },
      immediate: true
    }
  },
  methods: {
    initializeEditor() {
      this.editor = ace.edit(this.$refs.editor, {
        minLines: 10,
        fontSize: 14,
        tabSize: 2
      });
      this.editor.session.setMode("ace/mode/plain_text");
      this.editor.setTheme("ace/theme/monokai");

      // Set initial value
      this.setEditorValue(this.value);

      // Update Apostrophe data on editor change
      this.editor.getSession().on('change', () => {
        this.updateValue(this.editor.getValue());
      });

      // Initialize mermaid
      mermaid.initialize({ startOnLoad: false });
    },
    
    setEditorValue(value) {
      if (!this.editor) return;
      
      let editorValue = '';
      
      // Handle different value formats
      if (typeof value === 'string') {
        editorValue = value;
      } else if (value && typeof value === 'object') {
        // Try different possible object structures
        editorValue = value.data || value.content || value.mermaid || '';
      }
      
      // Only update if different to avoid cursor jumping
      if (this.editor.getValue() !== editorValue) {
        this.editor.setValue(editorValue, -1); // -1 moves cursor to start
      }
    },
    
    updateValue(value) {
      // Emit the change using the correct ApostropheCMS 4.x pattern
      this.$emit('input', value);
    },
    
    validate(value) {
      if (this.field.required) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'required';
        }
      }
      return false;
    },
    
    async renderDiagram() {
      const mermaidCode = this.editor.getValue();
      const mermaidContainer = document.getElementById('mermaidOutput');

      if (!mermaidCode.trim()) {
        mermaidContainer.innerHTML = '<p>No mermaid code to render</p>';
        return;
      }

      try {
        // Clear previous content
        mermaidContainer.innerHTML = `<div class="mermaid">${mermaidCode}</div>`;

        // Re-initialize and render
        await mermaid.run({
          querySelector: '#mermaidOutput .mermaid'
        });
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        mermaidContainer.innerHTML = `<p style="color: red;">Error rendering diagram: ${error.message}</p>`;
      }
    },
    
    clearDiagram() {
      this.editor.setValue('', -1);
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
  padding: 8px 16px;
  background: #007cba;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #005a87;
}

#mermaidOutput {
  margin-top: 20px;
  border: 1px solid #ddd;
  padding: 10px;
  min-height: 100px;
}
</style>