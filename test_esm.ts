import { fileURLToPath, pathToFileURL } from 'url';
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);
const url = import.meta.url;
const path = process.argv[1];

const fileURL = fileURLToPath(url);
const pathURL = pathToFileURL(path);
const pathFile = fileURLToPath(pathURL);

console.log('fileURLToPath(import.meta.url):', fileURL);
console.log('fileURLToPath(pathToFileURL(process.argv[1])):', pathFile);
console.log('Match:', fileURL === pathFile);
