// Сборка проекта:
//   npm run dev   -> bundle.js для разработки (открыть index.html)
//   npm run build -> dist/playable.html, вся игра в одном файле
import fs from 'node:fs';
import esbuild from 'esbuild';

const dev = process.argv.includes('--dev');

const result = await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: 'es2018',
  minify: !dev,
  write: false,
  legalComments: 'none',
});
let game = result.outputFiles[0].text;

// на всякий случай не даём коду сломать html-тег </script>
const safe = (s) => s.replace(/<\/script>/gi, '<\\/script>');

if (dev) {
  fs.writeFileSync('bundle.js', game);
  console.log('dev-сборка готова: bundle.js, открой index.html в браузере');
} else {
  const pixi = safe(fs.readFileSync('vendor/pixi.min.js', 'utf8'));
  game = safe(game);
  const tpl = fs.readFileSync('index.template.html', 'utf8');
  const html = tpl
    .split('<!--PIXI-->').join(`<script>\n${pixi}\n</script>`)
    .split('<!--GAME-->').join(`<script>\n${game}\n</script>`);

  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync('dist/playable.html', html);
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/index.html', html);

  const kb = (fs.statSync('dist/playable.html').size / 1024).toFixed(0);
  console.log(`собрано: dist/playable.html (${kb} КБ), копия в docs/index.html для GitHub Pages`);
}
