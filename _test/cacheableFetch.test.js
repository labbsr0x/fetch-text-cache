const testserver = require('./testserver');
const libCacheableFetch = require('../cacheableFetch');
const fetch = require('node-fetch');
const cacheableFetch = libCacheableFetch(fetch);

test('Delegates text request to fetch', finishTest => {
    const randomText = Math.random()+'';
    return testserver(randomText, 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(response => {
            response.text().then(text => expect(text).toEqual(randomText))
            server.close();
            finishTest();
        })
    })
});

test('Delegates json request to fetch', finishTest => {
    const obj = {a:10, b:'abc'};
    return testserver(JSON.stringify(obj), 'application/json', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(response => {
            response.json().then(jsonResp => {
                expect(jsonResp.a).toEqual(obj.a)
                expect(jsonResp.b).toEqual(obj.b)
            })
            server.close();
            finishTest();
        })
    })
});

test('Fetch cached text', finishTest => {
    const randomText = Math.random()+'';
    return testserver(randomText, 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(_ => {
            server.close();
            cacheableFetch('http://localhost:3333/').then(response => {
                response.text().then(text => expect(text).toEqual(randomText))
                finishTest();
            });
        })
    })
});

test('Fetch cached json', finishTest => {
    const obj = {a:10, b:'abc'};
    return testserver(JSON.stringify(obj), 'application/json', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(_ => {
            server.close();
            cacheableFetch('http://localhost:3333/').then(response => {
                response.json().then(jsonResp => {
                    expect(jsonResp.a).toEqual(obj.a)
                    expect(jsonResp.b).toEqual(obj.b)
                })
                server.close();
                finishTest();
            });
        })
    })
});


test('Fetch cached text has headers', finishTest => {
    return testserver(Math.random()+'', 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(responseOnline => {
            const expected = JSON.stringify(responseOnline.headers.raw());
            server.close();
            cacheableFetch('http://localhost:3333/').then(responseCached => {
                responseCached.text().then(text => {
                    const headers = JSON.stringify(responseCached.headers.raw())
                    expect(headers).toEqual(expected)
                    expect(headers.length > 0).toEqual(true)
                    finishTest();
                })
            });
        })
    })
});

test('Fetch cached has cached attribute', finishTest => {
    return testserver(Math.random()+'', 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(responseOnline => {
            expect(responseOnline.cached).toBeUndefined();
            server.close();
            cacheableFetch('http://localhost:3333/').then(responseCached => {
                expect(responseCached.cached).toEqual(true);
                finishTest();
            });
        })
    })
});

test('Simulating a 1000ms response', finishTest => {
    const randomText = Math.random()+'';
    return testserver(new Promise(resolve => {
        setTimeout(()=>{
            resolve(randomText);
        }, 1000);
    }), 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(response => {
            response.text().then(text => expect(text).toEqual(randomText))
            server.close();
            finishTest();
        })
    })
});

test('Error on never hit data', () => {
    cacheableFetch('http://localhost:3333/').catch(e => expect(e).toBeDefined())
});

test('Delegates json request to fetch and custom persistence with promise', finishTest => {
    const bodyCached = {a:'another', b:'object'};
    const map = {"http://localhost:3333/":{
        "url":"http://localhost:3333/",
        "status":200,
        "statusText":"OK",
        "headers":{},
        "ok":true,
        "redirected":false,
        "text":JSON.stringify(bodyCached)
    }};
    const cacheableCustomFetch = libCacheableFetch(fetch, { persistenceControl:{
        put:(k,v) => new Promise(resolve=>{
            map[k] = v;
            resolve();
        }),
        get:k => Promise.resolve(map[k]),
        contains:k => Promise.resolve(!!map[k])
    }});

    cacheableCustomFetch('http://localhost:3333/').then(response => {
        response.json().then(jsonResp => {
            expect(jsonResp.a).toEqual(bodyCached.a)
            expect(jsonResp.b).toEqual(bodyCached.b)
            finishTest();
        })
    });
});

test('Delegates json request to fetch and custom persistence without promise', finishTest => {
    const bodyCached = {a:'another', b:'object'};
    const map = {"http://localhost:3333/":{
        "url":"http://localhost:3333/",
        "status":200,
        "statusText":"OK",
        "headers":{},
        "ok":true,
        "redirected":false,
        "text":JSON.stringify(bodyCached)
    }};
    const cacheableCustomFetch = libCacheableFetch(fetch, { persistenceControl:{
        put:(k,v) => {
            map[k] = v;
        },
        get:k => map[k],
        contains:k => !!map[k]
    }});

    cacheableCustomFetch('http://localhost:3333/').then(response => {
        response.json().then(jsonResp => {
            expect(jsonResp.a).toEqual(bodyCached.a)
            expect(jsonResp.b).toEqual(bodyCached.b)
            finishTest();
        })
    });
});

test('Custom persistence persists headers', finishTest => {
    const customMap = {};
    const cacheableCustomFetch = libCacheableFetch(fetch, { persistenceControl: {
        put:(k,v) => new Promise(resolve=>{
            customMap[k] = v;
            resolve();
        }),
        get: k => Promise.resolve(customMap[k]),
        contains: k => Promise.resolve(!!customMap[k])
    }});

    return testserver(Math.random()+'', 'text/plain', 200).then(server => {
        cacheableCustomFetch('http://localhost:3333/').then(responseOnline => {
            const expected = JSON.stringify(responseOnline.headers.raw());
            server.close();
            cacheableCustomFetch('http://localhost:3333/').then(responseCached => {
                responseCached.text().then(text => {
                    const headers = JSON.stringify(responseCached.headers.raw());
                    expect(headers).toEqual(expected);
                    expect(headers.length > 0).toEqual(true);
                    finishTest();
                })
            });
        })
    })
});

test('Error on incomplete custom persistence', () => {
    expect(()=>{
        libCacheableFetch(fetch, {persistenceControl:{
            //missing contains and get
            put:(k,v) => new Promise(resolve=>{
                resolve();
            })
        }});
    }).toThrow(Error);
    
});

test('Delegates first to cache on cache preferable mode', finishTest => {
    const bodyCached = {a:'cached', b:'object'};
    const bodyOnline = {a:'online', b:'__object'};

    const map = {"http://localhost:3333/":{
        "url":"http://localhost:3333/",
        "status":200,
        "statusText":"OK",
        "headers":{},
        "ok":true,
        "redirected":false,
        "text":JSON.stringify(bodyCached)
    }};
    
    const cacheableCustomFetch = libCacheableFetch(fetch, 
        {
            preferableMode: libCacheableFetch.PreferableMode.CACHE,
            persistenceControl: {
                put:(k,v) => {
                    map[k] = v;
                },
                get:k => map[k],
                contains:k => !!map[k]
            }
        }
    );

    return testserver(JSON.stringify(bodyOnline), 'application/json', 200).then(server => {
        cacheableCustomFetch('http://localhost:3333/').then(response => {
            response.json().then(jsonResp => {
                expect(jsonResp.a).toEqual(bodyCached.a)
                expect(jsonResp.b).toEqual(bodyCached.b)
                server.close();
                finishTest();
            })
        });
    })

    
});