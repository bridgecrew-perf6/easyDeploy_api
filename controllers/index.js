const home = (req, res) => {
  res.status(200).json({ message: 'hola' });
};

module.exports = {
  home,
};
