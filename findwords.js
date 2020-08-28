var fileStatus = {};
function findvariablesinFolder() {
  const fs = require('fs');
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile('file.xlsx');
  const sheet_name_list = workbook.SheetNames;
  const jsonrows = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheet_name_list[0]]
  );
  const value = jsonrows.map(({ VALUE }) => ({ VALUE }));
  fileStatus = jsonrows;

  for (var i = 0; i < fileStatus.length; i++) {
    searchFilesInDirectoryAsync(process.argv[2], value[i].VALUE, i);
  }
  var json2xls = require('json2xls');
  var xls = json2xls(fileStatus);
  fs.writeFileSync('output.xlsx', xls, 'binary', (err) => {
    console.log('write file');
    if (err) {
      console.log('writeFileSync :', err);
    }
  });
}
findvariablesinFolder();
const fs = require('fs');
const util = require('util');
const fsReaddir = util.promisify(fs.readdir);
const fsReadFile = util.promisify(fs.readFile);
const fsLstat = util.promisify(fs.lstat);

async function searchFilesInDirectoryAsync(dir, filter, index) {
  const files = await fsReaddir(dir).catch((err) => {
    throw new Error(err.message);
  });
  const found = await getFilesInDirectoryAsync(dir, '.js');

  for (file of found) {
    const fileContent = await fsReadFile(file);

    // We want full words, so we use full word boundary in regex.
    const regex = new RegExp('\\b' + filter + '\\b');
    if (regex.test(fileContent)) {
      console.log(`Your word was found in file: ${file}`);
    }
  }
}

// Using recursion, we find every file with the desired extention, even if its deeply nested in subfolders.
async function getFilesInDirectoryAsync(dir, ext) {
  let files = [];
  const filesFromDirectory = await fsReaddir(dir).catch((err) => {
    throw new Error(err.message);
  });

  for (let file of filesFromDirectory) {
    const filePath = path.join(dir, file);
    const stat = await fsLstat(filePath);

    // If we hit a directory, apply our function to that dir. If we hit a file, add it to the array of files.
    if (stat.isDirectory()) {
      const nestedFiles = await getFilesInDirectoryAsync(filePath, ext);
      files = files.concat(nestedFiles);
    } else {
      if (path.extname(file) === ext) {
        files.push(filePath);
      }
    }
  }

  return files;
}
