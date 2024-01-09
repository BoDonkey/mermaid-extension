<template>
  <AposInputWrapper :modifiers="modifiers" :field="field" :error="effectiveError" :uid="uid"
    :display-options="displayOptions">
    <template #body>
      <div>
        <h2>Mermaid Diagram</h2>
        <div id="preview-editor" ref="editor"></div> <!-- Use a ref for more control -->
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
      type: Object,
      default: {}
    }
  },
  data() {
    return {
      editor: null,
    };
  },
  mounted() {
    this.editor = ace.edit(this.$refs.editor, {
      minLines: 10,
      fontSize: 14,
      tabSize: 2
    }); // Use ref
    this.editor.session.setMode("ace/mode/plain_text");
    this.editor.setTheme("ace/theme/monokai");

     // Set the editor's value to the existing value from the database
     if (this.value && this.value.data) {
        this.editor.setValue(this.value.data);
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
      // Update the ApostropheCMS data
      this.next = value;
    },
    async renderDiagram() {
      const mermaidCode = this.editor.getValue();
      const mermaidContainer = document.getElementById('mermaidOutput');

      // Wrap the mermaid code in <pre class="mermaid">
      mermaidContainer.innerHTML = `<pre class="mermaid vue-mermaid">${mermaidCode}</pre>`;

      // Reinitialize mermaid to process the new diagram
      await mermaid.run({
        querySelector: '.vue-mermaid'
      });
    },
    clearDiagram() {
      this.editor.setValue('');
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
</style>
