const {simpleSitemapAndIndex} = require('sitemap');
const path = require('path');
const fs = require('fs');

// Get list of supported languages
const baseDir = path.resolve(__dirname, '..');
const langsDir = `${baseDir}${path.sep}src${path.sep}assets${path.sep}i18n`;
const languages = [];
for (const file of fs.readdirSync(langsDir)) {
  const [lang] = file.split('.');
  languages.push(lang);
}

const lastmod = new Date();
const baseUrls = ['/'];

const additionalUrls = [];

const sourceData = [];

for (const url of baseUrls) {
  sourceData.push({
    url,
    lastmod,
    links: languages.map(lang => ({lang, url: `${url}?lang=${lang}`})),
  });
}

for (const url of additionalUrls) {
  sourceData.push({url, lastmod});
}

async function main() {
  const buildDir = `${baseDir}${path.sep}dist${path.sep}sign-translate${path.sep}browser${path.sep}`;

  // writes sitemaps and index out to the destination you provide.
  await simpleSitemapAndIndex({
    hostname: 'https://sign.mt',
    destinationDir: buildDir,
    sourceData,
    gzip: false,
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
