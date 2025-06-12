// bundle-static-html.js
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Inline only local CSS files (skip if starts with http)
html = html.replace(
  /<link rel="stylesheet" href="([^"]+\.css)">/g,
  (match, path) => {
    if (/^https?:\/\//.test(path)) return match; // skip CDN
    const css = fs.readFileSync(path, 'utf8');
    return `<style>\n${css}\n</style>`;
  }
);

// Inline only local JS files (skip if starts with http)
html = html.replace(
  /<script src="([^"]+)"><\/script>/g,
  (match, path) => {
    if (/^https?:\/\//.test(path)) return match; // skip CDN
    const js = fs.readFileSync(path, 'utf8');
    return `<script>\n${js}\n</script>`;
  }
);

fs.writeFileSync('bundled.html', html);
console.log('✅ bundled.html created');
