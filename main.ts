import {copyFileSync,cpSync,existsSync,mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-game.ts';
const root=fileURLToPath(new URL('.',import.meta.url));
const out=process.env.MAKEFUN_OUTPUT_DIR??'/output';
const screenshots = join(root, 'screenshots');
const images = existsSync(screenshots)
  ? readdirSync(screenshots, { withFileTypes: true })
      .filter(file => file.isFile() && /\.(png|jpe?g)$/i.test(file.name))
      .map(file => file.name)
  : [];
if(images.length<3||images.length>4)throw Error('Provide 3 or 4 real browser screenshots before packaging the game.');
if (images.some(name => !/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(name))) {
  throw Error('Screenshot names must start with a letter, digit, or underscore and fit within 128 characters.');
}
const gameOutput = join(out, 'game');
const imageOutput = join(out, 'screenshots');
const dossierOutput = join(out, 'dossier.json');
if ([gameOutput, imageOutput, dossierOutput].some(path => existsSync(path))) {
  throw Error('Use a fresh output directory to avoid mixing files from different builds.');
}
mkdirSync(out,{recursive:true});
cpSync(join(root,'game'),gameOutput,{recursive:true});
mkdirSync(imageOutput);
for (const image of images) copyFileSync(join(screenshots, image), join(imageOutput, image));
const dossier=buildDossier(out,{text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},game_max_files:993,game_max_bytes:50331648,game_path_max_bytes:1000});
writeFileSync(dossierOutput,dossier);
console.log('Game packaged with '+images.length+' screenshots.');
