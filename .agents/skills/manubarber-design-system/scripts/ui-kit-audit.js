#!/usr/bin/env node

/**
 * ManuBarber UI Kit Auditor
 * Valida la conformidad de componentes y vistas con web/ui-kit.html
 */

const fs = require('fs');
const path = require('path');

// Resolver la raíz buscando la carpeta web/ desde cwd o directorio actual
function findProjectRoot() {
  let curr = process.cwd();
  while (curr !== '/' && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'web', 'ui-kit.html'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  // Fallback relativo al script
  return path.resolve(__dirname, '../../../../');
}

const ROOT_DIR = findProjectRoot();
const WEB_DIR = path.join(ROOT_DIR, 'web');

const IGNORED_DIRS = ['node_modules', '.next', '.next-dev', 'dist', 'public', '.git'];
const TARGET_EXTENSIONS = ['.tsx', '.jsx', '.html', '.css'];

const RULES = [
  {
    id: 'forbidden-legacy-fonts',
    name: 'Fuentes heredadas prohibidas (Anton, Syne)',
    regex: /\b(Anton|Syne|Cookie)\b/g,
    message: 'ui-kit.html establece Oswald, Inter y Noto Sans JP como únicas fuentes permitidas.',
    blocking: true
  },
  {
    id: 'forbidden-tailwind-palette',
    name: 'Paleta genérica de Tailwind (slate, zinc, blue)',
    regex: /\b(bg|text|border)-(slate|zinc|blue)-(?:[1-9]00)\b/g,
    message: 'Usar tokens de ui-kit.html (brand-surface #141414, brand-border #2a2a2a, brand-text #f5f5f5).',
    blocking: false
  },
  {
    id: 'uncalibrated-red',
    name: 'Rojo fuera de paleta (#ff0022 en vez de #d91e18)',
    regex: /#ff0022/gi,
    message: 'El rojo oficial de acción es #d91e18 (brand-red) y #b81914 (hover).',
    blocking: false
  }
];

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORED_DIRS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (TARGET_EXTENSIONS.includes(path.extname(file))) {
      // No auditar el propio ui-kit.html
      if (file !== 'ui-kit.html') {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function runAudit() {
  console.log('\n======================================================');
  console.log('🥋 ManuBarber UI Kit Audit (web/ui-kit.html Source of Truth)');
  console.log('======================================================\n');

  console.log(`Proyecto raíz: ${ROOT_DIR}`);
  const files = scanDirectory(WEB_DIR);
  console.log(`Archivos analizados en web/: ${files.length}\n`);

  let totalViolations = 0;
  let blockingViolations = 0;
  const resultsByRule = {};

  RULES.forEach(r => { resultsByRule[r.id] = []; });

  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(ROOT_DIR, filePath);

    RULES.forEach(rule => {
      let match;
      rule.regex.lastIndex = 0;
      while ((match = rule.regex.exec(content)) !== null) {
        totalViolations++;
        if (rule.blocking) blockingViolations++;
        resultsByRule[rule.id].push({
          file: relativePath,
          match: match[0],
          index: match.index
        });
      }
    });
  });

  RULES.forEach(rule => {
    const findings = resultsByRule[rule.id];
    const status = findings.length === 0 ? '✅ PASÓ' : (rule.blocking ? '❌ BLOQUEA' : '⚠️ AVISO');
    console.log(`[${status}] ${rule.name}: ${findings.length} hallazgo(s)`);
    if (findings.length > 0) {
      console.log(`   └─ Detalle: ${rule.message}`);
      const sampleFiles = [...new Set(findings.map(f => f.file))].slice(0, 3);
      console.log(`   └─ En: ${sampleFiles.join(', ')}${findings.length > 3 ? '...' : ''}`);
    }
  });

  console.log('\n------------------------------------------------------');
  console.log(`Total hallazgos: ${totalViolations} (${blockingViolations} bloqueantes)`);
  console.log('Fuente de verdad canónica: web/ui-kit.html\n');

  return blockingViolations === 0;
}

if (require.main === module) {
  const success = runAudit();
  process.exit(success ? 0 : 1);
}

module.exports = { runAudit };
