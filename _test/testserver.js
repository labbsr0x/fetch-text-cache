const http = require('http');
const port = 3333;

function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
 }

module.exports = function (response, contentType, status){
  return new Promise((resolve, _) => {
    const server = http.createServer(function(_, res) {
      let body = '';
      if(isFunction(response)) {
        body = response();
      } else {
        body = ''+response;
      }
      res.setHeader('Content-Length', body.length);
      res.setHeader('Content-Type', contentType);
      res.statusCode = status;
      res.end(body);
    });
    
    server.listen(port, function() {
      resolve(server);
    });
  });
}