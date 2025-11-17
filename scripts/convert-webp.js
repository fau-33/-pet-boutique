/***
 * Script para converter todas as imagens PNG/JPG da pasta img para o formato WebP.
 * Mantém os arquivos originais e gera novas versões com o mesmo nome e extensão .webp.
 */
const glob = require("glob");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");

const ROOT_DIR = path.resolve(__dirname, "..");
const IMAGE_GLOB = "img/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}";

const quality = Number(process.env.WEBP_QUALITY) || 82;

function log(message) {
  console.log(`[convert-webp] ${message}`);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function convert(filePath) {
  const output = filePath.replace(/\.(png|jpe?g)$/i, ".webp");
  const alreadyExists = await fileExists(output);

  if (alreadyExists) {
    const [sourceStat, outputStat] = await Promise.all([
      fs.stat(filePath),
      fs.stat(output),
    ]);

    if (outputStat.mtimeMs >= sourceStat.mtimeMs) {
      log(`Pulando (já otimizado): ${path.relative(ROOT_DIR, output)}`);
      return;
    }
  }

  await sharp(filePath)
    .webp({ quality, effort: 6 })
    .toFile(output);

  log(
    `Convertido: ${path.relative(ROOT_DIR, filePath)} -> ${path.relative(
      ROOT_DIR,
      output,
    )}`,
  );
}

async function run() {
  const files = glob.sync(IMAGE_GLOB, {
    cwd: ROOT_DIR,
    nodir: true,
    absolute: true,
    windowsPathsNoEscape: true,
  });

  if (!files.length) {
    log("Nenhuma imagem PNG/JPG encontrada.");
    return;
  }

  log(`Iniciando conversão de ${files.length} arquivos...`);

  for (const file of files) {
    try {
      await convert(file);
    } catch (error) {
      console.error(`Erro ao converter ${file}:`, error.message);
    }
  }

  log("Processo concluído!");
}

run();

