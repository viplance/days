const upstreamTransformer = require('metro-react-native-babel-transformer');
const sassTransformer = require('react-native-sass-transformer');

module.exports.transform = function (...args) {
  if (args.length > 1) {
    // New Metro signature: (config, projectRoot, filename, data, options)
    const filename = args[2];
    const data = args[3];
    const options = args[4];

    if (filename.endsWith('.scss') || filename.endsWith('.sass')) {
      const src = data.toString('utf8');
      return sassTransformer.transform({ src, filename, options });
    }
  } else {
    // Old Metro signature: ({ src, filename, options, ... })
    const { filename, src, options } = args[0];

    if (filename.endsWith('.scss') || filename.endsWith('.sass')) {
      return sassTransformer.transform({ src, filename, options });
    }
  }

  return upstreamTransformer.transform(...args);
};
