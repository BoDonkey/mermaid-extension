export { default as MermaidWidget } from './MermaidWidget.astro';
export { default as mermaidWidget } from './integration.js';

// Optional: Export utility functions
export const getMermaidConfig = () => {
  return {
    startOnLoad: false,
    theme: 'default'
  };
};
