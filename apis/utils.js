const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');

module.exports = {
  getEnvValue: (keyString) =>
    fs
      .readFileSync(path.join(__dirname, '../.env'))
      .toString()
      .split('\n')
      .filter((v) => v.indexOf(keyString) === 0)
      [0].split('=')[1],
  getData: ({
    platform = '',
    id = 'unknown',
    hostname,
    method = 'GET',
    useCache = false,
    uriPath = '/',
  }) => {
    const uriPathHash =
      crypto.createHash('md5').update(method + hostname + uriPath).digest('hex');
    const pathToData =
      path.join(__dirname, `./${platform}/${id}-${uriPathHash}.json`);
    return new Promise((resolve, reject) => {
      if (useCache && fs.existsSync(pathToData)) {
        resolve(JSON.parse(fs.readFileSync(pathToData).toString()));
      } else {
        let responseBody = '';
        const request = https.request(
          {
            hostname,
            port: 443,
            path: uriPath,
            method,
          },
          (res) => {
            res.on('data', (data) => {
              responseBody += data.toString();
            });
            res.on('end', () => {
              const data = JSON.parse(responseBody);
              fs.writeFileSync(
                pathToData,
                JSON.stringify(data, null, 2)
              );
              resolve(data);
            });
          },
        );
        request.on('error', (error) => {
          reject(error);
        });
        request.end();
      }
    });
  }
};
