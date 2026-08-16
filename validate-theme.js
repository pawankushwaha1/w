// Comprehensive Liquid & Schema Validator for Shopify Themes
import fs from 'fs';
import path from 'path';

const themeDir = path.resolve('shopify-theme');

function checkFile(filePath, relPath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // If JSON file
  if (filePath.endsWith('.json')) {
    try {
      JSON.parse(content);
    } catch (e) {
      console.error(`❌ JSON parse error in ${relPath}:`, e.message);
      return false;
    }
  }

  // If Liquid file
  if (filePath.endsWith('.liquid')) {
    // 1. Check Schema block
    const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
    if (schemaMatch) {
      const schemaJson = schemaMatch[1].trim();
      if (schemaJson) {
        try {
          JSON.parse(schemaJson);
        } catch (e) {
          console.error(`❌ Schema JSON parse error in ${relPath}:`, e.message);
          return false;
        }
      }
    }

    // 2. Check Tag balances
    const tags = [
      { open: /\{%\s*if\b/g, close: /\{%\s*endif\s*%\}/g, name: 'if' },
      { open: /\{%\s*unless\b/g, close: /\{%\s*endunless\s*%\}/g, name: 'unless' },
      { open: /\{%\s*for\b/g, close: /\{%\s*endfor\s*%\}/g, name: 'for' },
      { open: /\{%\s*form\b/g, close: /\{%\s*endform\s*%\}/g, name: 'form' },
      { open: /\{%\s*paginate\b/g, close: /\{%\s*endpaginate\s*%\}/g, name: 'paginate' },
      { open: /\{%\s*case\b/g, close: /\{%\s*endcase\s*%\}/g, name: 'case' },
      { open: /\{%\s*comment\b/g, close: /\{%\s*endcomment\s*%\}/g, name: 'comment' },
      { open: /\{%\s*raw\b/g, close: /\{%\s*endraw\s*%\}/g, name: 'raw' }
    ];

    for (const t of tags) {
      const openCount = (content.match(t.open) || []).length;
      const closeCount = (content.match(t.close) || []).length;
      if (openCount !== closeCount) {
        console.error(`❌ Unbalanced tag {% ${t.name} %} in ${relPath}: ${openCount} open vs ${closeCount} close`);
        return false;
      }
    }

    // 3. Check for escaped quotes or syntax issues
    const unclosedLiquid = content.match(/\{%[^%]*$/m) || content.match(/\{\{[^}]*$/m);
    if (unclosedLiquid) {
      console.error(`❌ Possible unclosed liquid tag/variable in ${relPath}:`, unclosedLiquid[0]);
      return false;
    }
  }

  return true;
}

function scanDir(dir, base = '') {
  let allOk = true;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!scanDir(fullPath, relPath)) allOk = false;
    } else {
      if (!checkFile(fullPath, relPath)) allOk = false;
    }
  }
  return allOk;
}

console.log('--- Scanning Shopify Theme Files ---');
const ok = scanDir(themeDir);
if (ok) {
  console.log('✅ All Liquid tags and JSON schemas validated successfully.');
}
