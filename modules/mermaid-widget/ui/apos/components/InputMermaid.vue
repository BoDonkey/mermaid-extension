<template>
  <AposInputWrapper
    :modifiers="modifiers"
    :field="field"
    :error="effectiveError"
    :uid="uid"
    :display-options="displayOptions"
  >
    <template #body>
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h2 style="margin: 0;">
            Mermaid Diagram
          </h2>
          <a
            href="https://mermaid.js.org/intro/"
            target="_blank"
            rel="noopener noreferrer"
            style="font-size: 14px; text-decoration: none; color: #0066cc;"
          >
            📖 Mermaid Docs
          </a>
        </div>
        <div
          id="preview-editor"
          ref="editor"
        />
        <button @click="renderDiagram">
          Render Diagram
        </button>
        <button @click="clearDiagram">
          Clear
        </button>
        <div
          id="mermaidOutput"
          ref="mermaidOutput"
        />
      </div>
    </template>
  </AposInputWrapper>
</template>

<script>
import ace from 'ace-builds/src-noconflict/ace';
import 'ace-builds/src-noconflict/mode-plain_text';
import 'ace-builds/src-noconflict/theme-monokai';
import AposInputMixin from 'Modules/@apostrophecms/schema/mixins/AposInputMixin';
import { prepareMermaidSource } from '../../src/prepare-source.mjs';

const mermaidCdn = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
let mermaidPromise;

function loadMermaid() {
  if (window.mermaid) {
    return Promise.resolve(window.mermaid);
  }

  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');

      script.src = mermaidCdn;
      script.async = true;
      script.onload = () => {
        window.mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true
        });
        resolve(window.mermaid);
      };
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  return mermaidPromise;
}

export default {
  name: 'InputMermaid',
  mixins: [ AposInputMixin ],
  data() {
    return {
      editor: null,
      hasValidationError: false,
      validationErrorMessage: ''
    };
  },
  mounted() {
    this.editor = ace.edit(this.$refs.editor, {
      minLines: 10,
      fontSize: 14,
      tabSize: 2
    });
    this.editor.session.setMode('ace/mode/plain_text');
    this.editor.setTheme('ace/theme/monokai');

    this.editor.setOption('enableAutoIndent', true);

    this.editor.commands.addCommand({
      name: 'smartEnter',
      bindKey: {
        win: 'Return',
        mac: 'Return'
      },
      exec: function(editor) {
        const cursorPosition = editor.getCursorPosition();
        const line = editor.session.getLine(cursorPosition.row);
        const indent = line.match(/^\s*/)[0];
        editor.insert('\n' + indent);
      }
    });

    // Use this.next which the mixin sets up for you
    if (this.next) {
      this.editor.setValue(this.next);
      this.editor.clearSelection();
    }

    // Update this.next on editor change - the mixin's watcher will handle the emit
    let validationTimeout;
    this.editor.getSession().on('change', () => {
      const value = this.editor.getValue();
      this.next = value;

      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(() => {
        this.validateMermaidSyntax(value);
      }, 500);
    });
    loadMermaid();
  },
  methods: {
    applyInitBlock(value) {
      return prepareMermaidSource(value, {
        initBlock: this.field.initBlock,
        injectSemanticClassDefs: this.field.injectSemanticClassDefs,
        semanticClassDefs: this.field.semanticClassDefs
      });
    },
    validate(value) {
      if (this.field.required) {
        if (!value) {
          return 'required';
        }
      }

      if (this.hasValidationError) {
        return this.validationErrorMessage;
      }

      return false;
    },
    async validateMermaidSyntax(value) {
      if (!value || value.trim() === '') {
        this.hasValidationError = false;
        this.validationErrorMessage = '';
        return;
      }

      try {
        const mermaid = await loadMermaid();
        await mermaid.parse(this.applyInitBlock(value));
        this.hasValidationError = false;
        this.validationErrorMessage = '';
      } catch (e) {
        this.hasValidationError = true;
        this.validationErrorMessage = 'Invalid Mermaid syntax. Please fix errors before saving.';
      }
    },
    async renderDiagram() {
      const mermaidCode = this.applyInitBlock(this.editor.getValue());
      const mermaidContainer = this.$refs.mermaidOutput;

      mermaidContainer.innerHTML = '';

      try {
        const mermaid = await loadMermaid();
        const diagramId = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        const { svg } = await mermaid.render(diagramId, mermaidCode);

        if (svg.includes('Syntax error') || svg.includes('Parse error')) {
          mermaidContainer.innerHTML = `
            <div style="color: #d32f2f; background: #ffebee; border: 1px solid #ef5350; 
                        border-radius: 4px; padding: 12px; margin-top: 10px;">
              <strong>⚠️ Syntax Error</strong><br>
              There's an error in your Mermaid diagram syntax. Please check the 
              <a href="https://mermaid.js.org/intro/" target="_blank" rel="noopener noreferrer">documentation</a>
              for correct syntax.
            </div>
          `;
        } else {
          mermaidContainer.innerHTML = svg;
        }

        this.cleanupOrphanedErrorSvgs();

      } catch (error) {
        mermaidContainer.innerHTML = `
          <div style="color: #d32f2f; background: #ffebee; border: 1px solid #ef5350;
                      border-radius: 4px; padding: 12px; margin-top: 10px;">
            <strong>⚠️ Rendering Error</strong><br>
            ${this.sanitizeErrorMessage(error.message)}
          </div>
        `;

        this.cleanupOrphanedErrorSvgs();
      }
    },
    clearDiagram() {
      this.editor.setValue('');
      this.editor.clearSelection();
      this.$refs.mermaidOutput.innerHTML = '';
      this.cleanupOrphanedErrorSvgs();
    },
    cleanupOrphanedErrorSvgs() {
      setTimeout(() => {
        document.querySelectorAll('svg[id^="d"], svg[id^="mermaid-"]').forEach(svg => {
          const text = svg.querySelector('text')?.textContent || '';
          if (text.includes('Syntax error') || text.includes('Parse error')) {
            if (!this.$refs.mermaidOutput.contains(svg)) {
              svg.remove();
            }
          }
        });
      }, 100);
    },
    sanitizeErrorMessage(message) {
      return message.replace(/<[^>]*>/g, '').substring(0, 200);
    }
  }
};
</script>

<style scoped>
#preview-editor {
  height: 250px;
}

button {
  margin: 10px 10px 10px 0;
  padding: 8px 16px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #0052a3;
}

button:active {
  background: #003d7a;
}

#mermaidOutput {
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  min-height: 100px;
  border-radius: 4px;
  background: #fafafa;
}
</style>
