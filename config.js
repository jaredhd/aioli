/**
 * Style Dictionary Configuration
 * For DTCG token format
 */

export default {
  source: ['tokens/**/*.json', '.aioli/packages/*/tokens.json'],
  
  // Enable DTCG format support ($value, $type, $description)
  usesDtcg: true,
  
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true
          }
        }
      ]
    },
    
    json: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested'
        }
      ]
    }
  }
};
