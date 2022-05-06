import { CapacitorProject } from '@capacitor/project';
import { CapacitorConfig } from '@capacitor/cli';
const shell = require('shelljs');
const fs = require("fs");

const getCommitHash = function () {
  //exec git command to get the hash of the current commit
  const hash = shell
    .exec('git rev-parse HEAD', {
      silent: true
    })
    .stdout.trim()
    .substr(0, 7);
  return hash;
};

function jsonReader(filePath, cb) {
  fs.readFile(filePath, (err, fileData) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      const object = JSON.parse(fileData);
      return cb && cb(null, object);
    } catch (err) {
      return cb && cb(err);
    }
  });
}

jsonReader("src/assets/appConfig.json", (err, appConfig) => {
  if (err) {
    console.log("Error reading file:", err);
    return;
  }
  appConfig.commitHash = getCommitHash();
  fs.writeFile("src/assets/appConfig.json", JSON.stringify(appConfig), err => {
    if (err) console.log("Error writing file:", err);
  });
});