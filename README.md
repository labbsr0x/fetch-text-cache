# Fetch Text Cache

This project goal is to provide a almost seamless way to cache requests.

## By-pass

All requests are done using `fetch`, if the requests returns an **OK** response, the body and headers are cached. If an exception is thrown, the last cached result are returned, as if it was a regular response, except with a `cached` attribute.


## How to use it?

Use `fetch-text-cache` should be identical to use `fetch`, except for the import.

```
const cachedFetch = require('fetch-text-cache')();

cachedFetch('http://localhost:4343/').then(resp => {
    resp.text().then(text => {
        console.log(text);
    })
});
```

## Providing custom persistence

This lib enabled the user to use a custom persistence layer. It must be provided a object with three methods: `put`, `get` and `contains`. All these methods should return a `Promise`.

```
const map = {};
const customPersistence = {
    put:(k,v) => new Promise(resolve=>{
        map[k] = v;
        resolve();
    }),
    get:k => Promise.resolve(map[k]),
    contains:k => Promise.resolve(!!map[k])
}

const cachedFetch = require('fetch-text-cache')(customPersistence);

cachedFetch('http://localhost:4343/').then(resp => {
    resp.text().then(text => {
        console.log(text);
    })
});
```