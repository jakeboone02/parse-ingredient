module.exports = {
  rollup(config, _options) {
    config.output.name = 'parseIngredient';
    config.output.exports = 'default';
    config.output.globals = { 'numeric-quantity': 'numericQuantity' };
    return config;
  },
};
