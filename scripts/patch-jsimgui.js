const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '..', 'node_modules', '@mori2003', 'jsimgui', 'build', 'imgui.js');
try {
  if (!fs.existsSync(target)) {
    console.log('[patch-jsimgui] target not found:', target);
    process.exit(0);
  }
  let content = fs.readFileSync(target, 'utf8');
  const from = './loader-freetype-extensions.js';
  const to = './loader-extensions-freetype.js';
  if (content.includes(from)) {
    content = content.split(from).join(to);
    fs.writeFileSync(target, content, 'utf8');
    console.log('[patch-jsimgui] patched imgui.js');
  } else {
    console.log('[patch-jsimgui] no patch needed');
  }
} catch (err) {
  console.error('[patch-jsimgui] error', err);
  process.exit(1);
}
