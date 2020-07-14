function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function isPromise(functionToCheck) {
  return functionToCheck && ({}.toString.call(functionToCheck) === '[object Promise]' || isFunction(functionToCheck.then));
}

function extractMetaInfo(original) {
  return {
    url: original.url,
    status: original.status,
    statusText: original.statusText,
    headers: original.headers,
    ok: original.ok,
    redirected: original.redirected
  };
}

const PreferableMode = {
  CACHE:'CACHE',
  ONLINE:'ONLINE',
  DEFAULT:'DEFAULT'
};

module.exports = function(fetch, options){

  function assembleResponse(serializable){
    const RespClass = fetch.Response || Response;
    return new RespClass(serializable.text, extractMetaInfo(serializable));
  }
  
  const persistenceControl = (function(){
    let result = null;

    if(options && options.persistenceControl) {
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
          const v1 = result.get(k);
          if(isPromise(v1)){
            v1.then((v)=>{
              resolve(v);
            })
          } else {
            resolve(v1);
          }
        })
      },
      contains: (k) => {
        return new Promise(resolve => {
          const v1 = result.contains(k);
          if(isPromise(v1)) {
            v1.then(v => {
              resolve(v);
            })
          } else {
            resolve(!!v1);
          }
        })
      }
    }
  })();

  function throwOrNull(e){
    if(e){
      throw e;
    }else{
      return null;
    }
  }

  function searchInCacheOtThrowException(resource, e){
    return persistenceControl.contains(resource).then(contains => {
      if(contains) {
        return persistenceControl.get(resource).then(serialized => {
          if(serialized){
            const resp = assembleResponse(serialized);
            resp.cached = true;
            return resp;
          }else{
            return throwOrNull(e);
          }
        });
      } else {
        return throwOrNull(e);
      }
    });
  }

  function fetchOnline(resource, init){
    return fetch(resource, init).then(response => {
      if(response.ok) {
        return response.text().then(text => {
          const serializable = extractMetaInfo(response);
          serializable.text = text;
          return persistenceControl
                  .put(resource, serializable)
                  .then(()=> assembleResponse(serializable))
        })
      } else {
        return Promise.resolve(response)
      }
    })
    .catch(e => {
      return searchInCacheOtThrowException(resource, e);
    });
  }

  function fetchFromCache(resource, init){
    return searchInCacheOtThrowException(resource)
      .then(resp => {
        if(resp){
          return resp;
        }else{
          return fetchOnline(resource, init);
        }
      });
  }

  return function cacheableFetch(resource, init) {
    try {
      if(options && options.preferableMode === PreferableMode.CACHE){
        return fetchFromCache(resource, init);
      }else{
        return fetchOnline(resource, init)
      }
    } catch(e) {
      return searchInCacheOtThrowException(resource, e);
    }
  }
};

module.exports.PreferableMode = PreferableMode;