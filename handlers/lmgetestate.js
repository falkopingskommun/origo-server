var conf = require('../conf/config');
var request = require('request');
var rp = require('request-promise');
var transformCoordinates = require('../lib/utils/transformcoordinates');
const url = require('url');
//var Promise = require('bluebird');

var objectIds;
var username;
var password;
var srid;
var validProjs = ["3006", "3007", "3008", "3009", "3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017", "3018", "3857", "4326"];

// Token holder
let token;
let scope;
var proxyUrl = 'lmgetestate';

// Do the request in proper order
const lmGetEstate = async (req, res) => {

  if (conf[proxyUrl]) {
    configOptions = Object.assign({}, conf[proxyUrl]);
    scope = configOptions.scope;
    const parsedUrl = url.parse(decodeURI(req.url), true);
    if ('srid' in parsedUrl.query) {
      srid = parsedUrl.query.srid;
    } else {
       srid = '3006';
    }
    if ('fnr' in parsedUrl.query) {
      const fnr = parsedUrl.query.fnr;
      // RegExp for UUID
      const uuidRegEx = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/i;
      let found = fnr.match(uuidRegEx);
      // Check to see if the fnr are a valid UUID and only proceed if it is
      if (found !== null) {
        // Get a token from LM
        await getTokenAsyncCall(configOptions.consumer_key, configOptions.consumer_secret, configOptions.scope);

        // Do a POST with all the IDs from free search to get the complete objects with geometry
        await doGetAsyncCall(req, res, configOptions, fnr);
      } else {
        res.send({});
      }
    } else {
      res.send({});
    }
  }
}

// Export the module
module.exports = lmGetEstate;

function getTokenWait(options) {
  // Return promise to be invoked for authenticating on service requests
  return new Promise((resolve, reject) => {
      // Requesting the token service object
      request(options, (error, response, body) => {
          if (error) {
            console.log('Error token:' + error);
            reject('An error occured collecting token: ', error);
          } else {
            token = body.access_token;
            // console.log('Got token ' + token);
            resolve(body.access_token);
          }
      })
  })
}

async function getTokenAsyncCall(consumer_key, consumer_secret, scope) {
  // Request a token from Lantmateriet API
  const options = {
      url: configOptions.url_token,
      method: 'POST',
      headers: {
         'Authorization': 'Basic ' + Buffer.from(consumer_key + ':' + consumer_secret).toString('base64')
      },
      form: {
          'scope': scope,
          'grant_type': 'client_credentials'
      },
      json: true
  }
  var result = await getTokenWait(options);
  return result;
}

function doGetWait(req, res, options) {
  rp(options)
  .then(function (parsedBody) {
    res.send(concatResult(parsedBody, srid));
  })
  .catch(function (err) {
    console.log(err);
    console.log('ERROR doGetWait!');
    res.send({});
  });
}

async function doGetAsyncCall(req, res, configOptions, fnr) {
  // Setup the search call and wait for result
  const options = {
      url: encodeURI(configOptions.url + '/' + fnr + '?includeData=basinformation,geometri' + '&srid=' + srid),
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'scope': `${scope}`
      },
      json: true // Automatically parses the JSON string in the response
  }

  await doGetWait(req, res, options);
}

function concatResult(feature) {
  const result = {};
  let geometryEnhetsomrade = [];

  if ('features' in feature) {
    feature.features.forEach((element) => {
      const registeromrade = element.properties.registerbeteckning.registeromrade;
      const beteckning = element.properties.registerbeteckning.traktnamn;
      const block = element.properties.registerbeteckning.block ;
      const enhet = element.properties.registerbeteckning.enhet;

      if ('enhetsomrade' in element.properties) {
        element.properties.enhetsomrade.forEach((enhetsomrade) => {
          const oneFeature = {};
          const omradesnummer = enhetsomrade.omradesnummer;
          let coordinates = [];
          const coordinatesType = enhetsomrade.yta[0].type;
          if ('yta' in enhetsomrade) {
              coordinates = enhetsomrade.yta[0].coordinates;
          }
          oneFeature['geometry'] = {
            coordinates: coordinates,
            type: coordinatesType
          };
          let fastighet = '';
          switch (block) {
            case '*':
              fastighet = registeromrade + ' ' + beteckning + ' ' + enhet + ' Enhetesområde ' + omradesnummer;
              break;
            default:
              fastighet = registeromrade + ' ' + beteckning + ' ' + block + ':' + enhet + ' Enhetesområde ' + omradesnummer;
          }
          oneFeature['properties'] = {
            name: fastighet
          };
          oneFeature['type'] = 'Feature';

          geometryEnhetsomrade.push(oneFeature);
        })
      }
    })
  }

  result['features'] = geometryEnhetsomrade;
  result['type'] = 'FeatureCollection';

  return result;
}
