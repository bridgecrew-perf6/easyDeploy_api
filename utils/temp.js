const fs = require('fs');
const path = require('path');

const exist = () => {
  const result = fs.existsSync(path.join(__dirname, '../temp'));

  if (!result) {
    fs.mkdir(path.join(__dirname, '../temp'), (err) => {
      if (err) {
        console.log('error with create temp directory');
        process.exit(1);
      }

      console.log('temp directory successfully created');
    });
  }
};

module.exports = {
  exist,
};
