export { default as MermaidWidget } from './MermaidWidget.astro';

// Optional: Export utility functions
export const getMermaidConfig = () => {
  return {
    startOnLoad: false,
    theme: 'default'
  };
};
