import {
  Bot,
  Bug,
  Braces,
  FileCode2,
  Gauge,
  GitCompareArrows,
  Regex,
  ScrollText,
  Database,
  LayoutTemplate,
} from 'lucide-react';
export const aiTools = [
  {
    slug: 'chat',
    title: 'AI Chat',
    description: 'Ask technical questions and build solutions.',
    icon: Bot,
    mode: 'chat',
  },
  {
    slug: 'code-generator',
    title: 'Code Generator',
    description: 'Turn requirements into production code.',
    icon: Braces,
    mode: 'generate',
  },
  {
    slug: 'debug-assistant',
    title: 'Debug Assistant',
    description: 'Find root causes and produce safe fixes.',
    icon: Bug,
    mode: 'debug',
  },
  {
    slug: 'code-explainer',
    title: 'Code Explainer',
    description: 'Understand code at any experience level.',
    icon: FileCode2,
    mode: 'explain',
  },
  {
    slug: 'code-optimizer',
    title: 'Code Optimizer',
    description: 'Improve performance, security, and clarity.',
    icon: Gauge,
    mode: 'optimize',
  },
  {
    slug: 'documentation',
    title: 'Documentation',
    description: 'Generate README and API documentation.',
    icon: ScrollText,
    mode: 'document',
  },
  {
    slug: 'code-converter',
    title: 'Code Converter',
    description: 'Translate code between languages.',
    icon: GitCompareArrows,
    mode: 'convert',
  },
  {
    slug: 'sql-generator',
    title: 'SQL Generator',
    description: 'Build and explain safe SQL.',
    icon: Database,
    mode: 'sql',
  },
  {
    slug: 'regex-generator',
    title: 'Regex Generator',
    description: 'Generate, explain, and test regular expressions.',
    icon: Regex,
    mode: 'regex',
  },
  {
    slug: 'ui-generator',
    title: 'UI Generator',
    description: 'Create responsive frontend components.',
    icon: LayoutTemplate,
    mode: 'ui',
  },
];
export const modePrompts = {
  generate:
    'Generate complete, production-ready code. Include assumptions, file names, setup, validation, error handling, accessibility, tests, and security notes when relevant.',
  debug:
    'Act as a senior debugger. Identify the root cause, explain it clearly, and provide a minimal safe fix plus an improved production version. Include before/after comparison.',
  explain:
    'Explain the code clearly. Cover purpose, control flow, important lines, complexity, edge cases, and possible improvements.',
  optimize:
    'Optimize for performance, readability, security, scalability, memory use, and best practices. Preserve behavior and state trade-offs.',
  document:
    'Generate polished developer documentation with overview, requirements, installation, usage, API/reference sections, examples, troubleshooting, security, and deployment.',
  convert:
    'Convert the code faithfully to the requested target language. Preserve behavior, explain non-equivalent concepts, and include tests.',
  sql: 'Generate parameterized, safe SQL. Explain each clause, assumptions, indexes, transaction concerns, and database-specific differences.',
  regex:
    'Generate a regex, explain each part, list positive and negative examples, and mention engine compatibility and ReDoS risks.',
  ui: 'Generate accessible, responsive, polished UI code. Include loading, empty, error, hover, focus, mobile, and dark-mode states.',
  chat: 'You are DevPilot AI, a pragmatic senior software engineer. Give correct, secure, maintainable guidance and clearly state assumptions.',
};
