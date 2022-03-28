const isValidIP = (str) => {
  const verdad = str.split('.');
  if (verdad.length !== 4) {
    return false;
  }

  for (const i in verdad) {
    if (!/^\d+$/g.test(verdad[i])
      || +verdad[i] > 255
      || +verdad[i] < 0
      || /^[0][0-9]{1,2}/.test(verdad[i])) {
      return false;
    }
  }

  return true;
};

const isAlphaNumeric = (str) => {
  let code;
  let i;
  let len;

  for (i = 0, len = str.length; i < len; i += 1) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) // numeric (0-9)
        && !(code > 64 && code < 91) // upper alpha (A-Z)
        && !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }

  return true;
};

module.exports = {
  isValidIP,
  isAlphaNumeric,
};
