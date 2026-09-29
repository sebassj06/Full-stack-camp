import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";

const content = await readFile("./archivo-text.txt", "utf-8");
console.log(content);

const outputDir = join("output", "files", "document");
await mkdir(outputDir, { recursive: true });
console.log("Carpeta creada exitosamente");

const contentUpperCase = content.toUpperCase();
const outputFilePath = join(outputDir, "archivoUpperCase.txt");
await writeFile(outputFilePath, contentUpperCase);

console.log("la extension es", extname(outputFilePath));
console.log("El nombre es", basename(outputFilePath));
