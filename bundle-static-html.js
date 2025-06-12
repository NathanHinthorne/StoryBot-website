const fs = require('fs');
const path = require('path');

// Get input HTML file from CLI argument
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('❌ Please provide an input HTML file. Example: node bundle-static-html.js index.html');
  process.exit(1);
}

const inputName = path.basename(inputFile, path.extname(inputFile));
let outputFile = `${inputName}-bundled.html`;

let html = fs.readFileSync(inputFile, 'utf8');

// Inline only local CSS files (skip if starts with http)
html = html.replace(
  /<link rel="stylesheet" href="([^"]+\.css)">/g,
  (match, cssPath) => {
    if (/^https?:\/\//.test(cssPath)) return match; // skip CDN
    const css = fs.readFileSync(cssPath, 'utf8');
    return `<style>\n${css}\n</style>`;
  }
);

// Inline only local JS files (skip if starts with http)
html = html.replace(
  /<script src="([^"]+)"><\/script>/g,
  (match, jsPath) => {
    if (/^https?:\/\//.test(jsPath)) return match; // skip CDN
    const js = fs.readFileSync(jsPath, 'utf8');
    return `<script>\n${js}\n</script>`;
  }
);

const outputPath = "bundled";
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

outputFile = path.join(outputPath, outputFile);

fs.writeFileSync(outputFile, html);
console.log(`✅ ${outputFile} created`);
