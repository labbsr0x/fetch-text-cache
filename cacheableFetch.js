const {Readable} = require("stream");
function createRedable(text){
  if(Readable.from){
    return Redable.from(text);
  } else {
    var read = 0;
    return new Readable({
      read(size){
        text.slice(read, size);
        read += size;
      }
    });
  }
}

if(!fetch){
  try{
    require.resolve('node-fetch')
    var fetch = require('node-fetch');
    var Response = fetch.Response;
  }catch(e){
    console.error("nor fetch nor node-fetch is found!");
    process.exit(e.code);
  }
}

//TODO plugable cache engine
const cache = {};

function cacheableFetch(resource, init){
  try {
    return fetch(resource, init).then(response => {
      if(response.ok) {
        return response.text().then(text => {
          cache[resource] = new Response(createRedable(text));
          return new Promise(resolve => {
            resolve(cache[resource]);
          });
        });
      } else {
        return new Promise(resolve => {
          resolve(response);
        });
      }
    }).catch(e => {
      if(cache[resource]) {
        return cache[resource].clone();
      } else {
        throw e;
      }
    })
  } catch(e) {
    if(cache[resource]) {
      return cache[resource].clone();
    } else {
      throw e;
    }
  }  
}

module.exports = cacheableFetch;