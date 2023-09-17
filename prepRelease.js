const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const packageJson = require('./package.json');

const version = packageJson.version;
const tempVersionDir = path.join(__dirname, 'temp', version);

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


// Minify the tempFuse.js
function minify() {
  const terserCommand = `terser temp/${version}/tempFuse.js -o temp/${version}/fuse.js`;
  execSync(terserCommand, { stdio: 'inherit' });
}

// Copy files to the version-specific directory
function copyFiles() {
  fs.copyFileSync(path.join(__dirname, 'package.json'), path.join(tempVersionDir, 'package.json'));
  fs.copyFileSync(path.join(__dirname, 'README.MD'), path.join(tempVersionDir, 'README.MD'));
  fs.copyFileSync(path.join(__dirname, 'LICENSE'), path.join(tempVersionDir, 'LICENSE'));
}

function injectVersionNumber() {
  const fuseJsContent = fs.readFileSync('./fuse.js', 'utf-8');
  const updatedContent = fuseJsContent.replace(/VERSION_PLACEHOLDER/g, version);

  fs.writeFileSync(path.join(tempVersionDir, 'tempFuse.js'), updatedContent);
}

// Execute the tasks
ensureDirectoryExists(tempVersionDir);
clearTemp();
injectVersionNumber();
minify();
copyFiles();
