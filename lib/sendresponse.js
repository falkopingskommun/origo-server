var sendResponse = function (res, result, contentType = 'application/json') {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(result)
  });
  res.end(result);
}

module.exports = sendResponse;
