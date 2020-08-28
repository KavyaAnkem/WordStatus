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
    fileStatus[i]['STATUS'] = 'NOT FOUND';
    searchFilesInDirectory(process.argv[2], value[i].VALUE, i);
  }
  var json2xls = require('json2xls');
  var xls = json2xls(fileStatus);
  console.log(fileStatus);
  fs.writeFileSync('output.xlsx', xls, 'binary', (err) => {
    if (err) {
      console.log('writeFileSync :', err);
    }
  });
}

//searching for the word in list of files in the directory
function searchFilesInDirectory(dir, filter, index) {
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    console.log(`Specified directory: ${dir} does not exist`);
    return;
  }
  const files = getFilesInDirectory(dir, '.js');
  files.forEach((file) => {
    const fileContent = fs.readFileSync(file);

    const regex = new RegExp('\\b' + filter + '\\b');
    // fileStatus[index]['STATUS'] = '';
    // console.log(regex.test(fileContent));

    if (regex.test(fileContent)) {
      console.log(
        `Your word ` +
          filter +
          ` was found in file: ${file.replace(/^.*[\\\/]/, '')}`
      );
      fileStatus[index]['STATUS'] = file.replace(/^.*[\\\/]/, '');
      return;
    } else {
    }
  });
}

function getFilesInDirectory(dir, ext) {
  const fs = require('fs');
  const path = require('path');

  if (!fs.existsSync(dir)) {
    console.log(`Specified directory: ${dir} does not exist`);
    return;
  }

  let files = [];
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      const nestedFiles = getFilesInDirectory(filePath, ext);
      files = files.concat(nestedFiles);
    } else {
      if (path.extname(file) === ext) {
        files.push(filePath);
      }
    }
  });
  return files;
}

var fs = require('fs');
const OPEN_BRC = '([';
const CLOSE_BRC = '])';
const VAR_IF = 'IF';
const VAR_END = 'END';
const COMMA = ',';
const SPACE = '\t';
const NEXT_LINE = '\n';

const srcFile = 'messageList.html';
// const destFile = process.argv[4];

var writeStream = fs.createWriteStream('file.xlsx');

const writeToTheFile = (content) => {
  writeStream.write(content, function (err) {
    if (err) console.log(err);
    else return;
  });
};

writeToTheFile('RPG VARIABLE' + SPACE + 'VALUE' + NEXT_LINE);

fs.readFile(srcFile, 'utf8', function (err, contents) {
  initProcess(contents);
});

const initProcess = (contents) => {
  while (true) {
    const value = processContent(contents);
    if (value > 0) {
      contents = contents.slice(value);
    } else {
      break;
    }
    findvariablesinFolder();
  }
};

const extractVars = (contents) => {
  const index = contents.indexOf(OPEN_BRC);
  const comma = contents.indexOf(COMMA, index + 2);
  const res = contents.slice(index + 2, comma);
  const closeBrc = contents.indexOf(CLOSE_BRC, index);
  return [index, res, comma, closeBrc];
};

processContent = (contents) => {
  if (contents.indexOf(OPEN_BRC) >= 1) {
    const [index, res, comma, closeBrc] = extractVars(contents);
    if (res === VAR_END) {
      return closeBrc;
    }
    if (res === VAR_IF) {
      const temp = contents.slice((comma + 1, contents.indexOf(COMMA), index));
      const processIfContent = contents.slice(comma + 1, closeBrc + 2);
      processIf(processIfContent);
      return closeBrc;
    }
    const value = contents.slice(comma + 1, closeBrc);
    writeToTheFile(res + SPACE + value + NEXT_LINE);
    return closeBrc;
  } else {
    return 0;
  }
};

const processIf = (content) => {
  if (content.indexOf('([') > 0) {
    initProcess(content);
  }
  writeToTheFile(
    VAR_IF + SPACE + content.slice(0, content.indexOf(COMMA)) + NEXT_LINE
  );
};
