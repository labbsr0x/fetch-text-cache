# Fetch Text Cache

This project goal is to provide a almost seamless way to cache requests.

## TODO
- make fetch plugable
- make a persitable object

## By-pass

All requests are done using `fetch`, if the requests returns an **OK** response, the body and headers are cached. If an exception is thrown, the last cached result are returned, as if it was a regular response, except with a `cached` attribute.


## How to use it?

Using `fetch-text-cache` should be identical to use `fetch`, except for the import.

```
const cachedFetch = require('fetch-text-cache')(fetch);

cachedFetch('http://localhost:4343/').then(resp => {
    resp.text().then(text => {
        console.log(text);
    })
});
```

## Providing custom persistence

`fetch-text-cache` enables the user to use a custom persistence layer. It must be provided an object with three methods: `put`, `get` and `contains`, where the key is the URL and the value is the an object in custom format, received through `put` method. All these methods should return a `Promise`.

```
const map = {};
const persistenceControl = {
    put:(k,v) => new Promise(resolve=>{
        map[k] = v;
        resolve();
    }),
    get:k => Promise.resolve(map[k]),
    contains:k => Promise.resolve(!!map[k])
}

const cachedFetch = require('fetch-text-cache')(fetch,{persistenceControl});

cachedFetch('http://localhost:4343/').then(resp => {
    resp.text().then(text => {
        console.log(text);
    })
});
```

## Preferable Mode

The `preferableMode` is used to set which is the first option where `fetch-text-cache` will fetch the resuilt. 

* PreferableMode.ONLINE (default) it tries to execute the request online if something wrong happens then it searches in cache.
* PreferableMode.CACHE: it searches first in cache, if it doesn't find, then tries to online fetch;

```
const cachedFetch = require('fetch-text-cache')(fetch,{
    preferableMode: libCacheableFetch.PreferableMode.CACHE
});

cachedFetch('http://localhost:4343/').then(resp => {
    resp.text().then(text => {
        console.log(text);
    })
});
```
