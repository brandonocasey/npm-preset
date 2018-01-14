import fs from 'fs';

const pathExists = function(p) {
  try {
    fs.statSync(p);
    return true;
  } catch (x) {
    return false;
  }
};

export default pathExists;
