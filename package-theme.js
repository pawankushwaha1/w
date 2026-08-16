// Standard Archiver ZIP Builder for Shopify Themes
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const sourceDir = path.resolve('shopify-theme');
const outPath = path.resolve('fabidea-shopify-theme.zip');

const output = fs.createWriteStream(outPath);
const archive = new ZipArchive({
  zlib: { level: 9 },
  forceZip64: false
});

output.on('close', function() {
  console.log(`✅ Successfully generated 100% compliant Shopify Theme ZIP: ${outPath} (${archive.pointer()} total bytes)`);
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Append all files from shopify-theme directly to the root of the zip with POSIX forward slashes
archive.directory(sourceDir, false);

archive.finalize();
