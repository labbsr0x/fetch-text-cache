const {Readable} = require("stream");
function createReadable(text){
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
function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function isPromise(functionToCheck) {
  return functionToCheck && ({}.toString.call(functionToCheck) === '[object Promise]' || isFunction(functionToCheck.then));
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

module.exports = function(options){
  const persistenceControl = (function(){
    let result = null;
    if(options && options.persistenceControl){
      if(!options.persistenceControl.get || !options.persistenceControl.put ||
          !options.persistenceControl.contains) {
        throw new Error('Persistence Control should have the following methods get,put and contains');
      } else {
        const pc = options.persistenceControl;
        result = {get:pc.get, put:pc.put, contains:pc.contains}
      }
    }
    if(result == null){
      const _store = {};
      result = {
        put:(key, value) => {
          _store[key] = value
        },
        get: key => _store[key],
        contains: key => !!_store[key]
      }
    }
    return {
      put: (k,v) => {
        return new Promise(resolve => {
          if(isPromise(result.put)){
            result.put(k,v).then(()=>{
              resolve();
            })
          } else {
            result.put(k,v);
            resolve();
          }
        })
      },
      get: (k) => {
        return new Promise(resolve => {
          if(isPromise(result.get)){
            result.get(k).then((v)=>{
              resolve(v);
            })
          } else {
            resolve(result.get(k));
          }
        })
      },
      contains: (k,v) => {
        return new Promise(resolve => {
          if(isPromise(result.contains)){
            result.contains(k).then((v)=>{
              resolve(v);
            })
          } else {
            resolve(!!result.contains(k));
          }
        })
      }
    }
  })();

  function searchInCacheOnException(resource, persistenceControl, e){
    return persistenceControl.contains(resource).then(contains => {
      if(contains) {
        return persistenceControl.get(resource).then(result => result.clone());
      } else {
        throw e;
      }
    });
  }
  return function cacheableFetch(resource, init) {
    try {
      return fetch(resource, init).then(response => {
        if(response.ok) {
          return response.text().then(text => {
            persistenceControl.put(resource, new Response(createReadable(text)));
            return new Promise(resolve => {
              resolve(persistenceControl.get(resource));
            });
          });
        } else {
          return new Promise(resolve => {
            resolve(response);
          });
        }
      }).catch(e => {
        return searchInCacheOnException(resource, persistenceControl, e);
      });
    } catch(e) {
      return searchInCacheOnException(resource, persistenceControl, e);
    }
  }
};