const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const packageJson = require('./package.json');

const version = packageJson.version;
const tempVersionDir = path.join(__dirname, 'temp', version);

ensureDirectoryExists(tempVersionDir);
clearTemp();
injectVersionNumber();
const userScriptHeaders = extractUserScriptHeaders();
minify();
injectUserScriptHeadersIntoMinifiedFile(userScriptHeaders);
copyFiles();

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Clear contents of the version-specific directory
function clearTemp() {
  if (fs.existsSync(tempVersionDir)) {
    const files = fs.readdirSync(tempVersionDir);

    for (const file of files) {
      const filePath = path.join(tempVersionDir, file);

      // Check if it's a directory
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmdirSync(filePath, { recursive: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  }
}


function injectVersionNumber() {
  const fuseJsContent = fs.readFileSync('./fuse.js', 'utf-8');
  const updatedContent = fuseJsContent.replace(/VERSION_PLACEHOLDER/g, version);

  fs.writeFileSync(path.join(tempVersionDir, 'tempFuse.js'), updatedContent);
}

function extractUserScriptHeaders() {
  const sourceContent = fs.readFileSync(path.join(tempVersionDir, 'tempFuse.js'), 'utf-8');
  const match = sourceContent.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);

  if (!match) {
    console.error('Pattern not found in the source file.');
    process.exit(1);
  }

  const extractedSection = match[0];  

  return extractedSection;
}

// Minify the tempFuse.js
function minify() {
  const terserCommand = `terser temp/${version}/tempFuse.js -o temp/${version}/fuse.js`;
  execSync(terserCommand, { stdio: 'inherit' });
}

function injectUserScriptHeadersIntoMinifiedFile(userScriptHeaders) {
  // 2. Read the content from the target file
const targetContent = fs.readFileSync(path.join(tempVersionDir, 'fuse.js'), 'utf-8');

// 3. Concatenate the extracted section with the content of the target file
const newContent = userScriptHeaders + '\n\n' + targetContent;

// 4. Write the combined content back to the target file
fs.writeFileSync(path.join(tempVersionDir, 'fuse.js'), newContent);
}
// Copy files to the version-specific directory
function copyFiles() {
  fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(tempVersionDir, 'package.json'));
  fs.copyFileSync(path.join(__dirname, 'README.MD'), path.join(tempVersionDir, 'README.MD'));
  fs.copyFileSync(path.join(__dirname, 'LICENSE'), path.join(tempVersionDir, 'LICENSE'));
}
