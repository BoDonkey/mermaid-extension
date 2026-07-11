function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function kebabCase(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function normalizeClassDefStyle(style) {
  if (typeof style === 'string') {
    return style.trim();
  }

  if (!style || typeof style !== 'object') {
    return '';
  }

  return Object.entries(style)
    .filter(([ , value ]) => value !== null && value !== undefined && value !== '')
    .map(([ key, value ]) => `${kebabCase(key)}:${value}`)
    .join(',');
}

function normalizeSemanticClassDefs(classDefs) {
  if (!classDefs || typeof classDefs !== 'object') {
    return {};
  }

  return Object.entries(classDefs).reduce((normalized, [ className, style ]) => {
    const value = normalizeClassDefStyle(style);

    if (className && value) {
      normalized[className] = value;
    }

    return normalized;
  }, {});
}

function stripFrontmatter(source) {
  const lines = source.split(/\r?\n/);

  if (!lines[0]?.trim().startsWith('---')) {
    return source;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return lines.slice(i + 1).join('\n');
    }
  }

  return source;
}

function stripLeadingDirectivesAndComments(source) {
  const lines = source.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line || line.startsWith('%%{') || line.startsWith('%%')) {
      index++;
      continue;
    }

    break;
  }

  return lines.slice(index).join('\n');
}

export function getMermaidDiagramType(source) {
  const body = stripLeadingDirectivesAndComments(stripFrontmatter(source.trim()));
  const firstLine = body.split(/\r?\n/).find((line) => line.trim());

  if (!firstLine) {
    return '';
  }

  const [ diagramType = '' ] = firstLine.trim().split(/\s+/);

  return diagramType;
}

export function supportsSemanticClassDefs(source) {
  const type = getMermaidDiagramType(source);

  return /^(flowchart|graph|stateDiagram|stateDiagram-v2)$/i.test(type);
}

function hasClassDef(source, className) {
  const classDefPattern = new RegExp(`^\\s*classDef\\s+${escapeRegExp(className)}(?:\\s|,|$)`, 'm');

  return classDefPattern.test(source);
}

function usesClassAnnotation(source, className) {
  const shorthandPattern = new RegExp(`:::\\s*${escapeRegExp(className)}\\b`);

  if (shorthandPattern.test(source)) {
    return true;
  }

  return source.split(/\r?\n/).some((line) => {
    const match = line.trim().match(/^class\s+(.+?)\s+([A-Za-z][\w-]*)\s*;?\s*$/);

    return match?.[2] === className;
  });
}

export function getMissingSemanticClassDefs(source, semanticClassDefs = {}) {
  const normalized = normalizeSemanticClassDefs(semanticClassDefs);

  if (!supportsSemanticClassDefs(source)) {
    return [];
  }

  return Object.entries(normalized)
    .filter(([ className ]) => usesClassAnnotation(source, className) && !hasClassDef(source, className))
    .map(([ className, style ]) => `classDef ${className} ${style}`);
}

export function applyInitBlock(source, initBlock = '') {
  const code = (source || '').trim();
  const init = (initBlock || '').trim();

  if (!init || code.startsWith('%%{') || code.startsWith('---')) {
    return code;
  }

  return `${init}\n${code}`;
}

export function prepareMermaidSource(source, options = {}) {
  const code = applyInitBlock(source, options.initBlock);
  const injectSemanticClassDefs = options.injectSemanticClassDefs !== false;

  if (!injectSemanticClassDefs) {
    return code;
  }

  const classDefs = getMissingSemanticClassDefs(code, options.semanticClassDefs);

  if (!classDefs.length) {
    return code;
  }

  return `${code}\n${classDefs.join('\n')}`;
}
