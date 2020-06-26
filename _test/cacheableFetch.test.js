const testserver = require('./testserver');
const libCacheableFetch = require('../cacheableFetch');
const cacheableFetch = libCacheableFetch();

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

test('Fetch cached text has headers', finishTest => {
    return testserver(Math.random()+'', 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(responseOnline => {
            const expected = JSON.stringify(responseOnline.headers.raw());
            server.close();
            cacheableFetch('http://localhost:3333/').then(responseCached => {
                responseCached.text().then(text => expect(JSON.stringify(responseCached.headers.raw())).toEqual(expected))
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

test('Simulating a 3000ms response', finishTest => {
    const randomText = Math.random()+'';
    return testserver(new Promise(resolve => {
        setTimeout(()=>{
            resolve(randomText);
        }, 3000);
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

test('Delegates json request to fetch and custom persistence', finishTest => {
    const expectedResult = {a:'another', b:'object'};
    const map = {};
    const cacheableCustomFetch = libCacheableFetch({
        put:(k,v) => new Promise(resolve=>{
            map[k] = v;
            resolve();
        }),
        get:k => Promise.resolve(expectedResult),
        contains:k => Promise.resolve(!!map[k])
    });
    const obj = {a:10, b:'abc'};
    return testserver(JSON.stringify(obj), 'application/json', 200).then(server => {
        cacheableCustomFetch('http://localhost:3333/').then(response => {
            response.json().then(jsonResp => {
                expect(jsonResp.a).toEqual('another')
                expect(jsonResp.b).toEqual('object')
            })
            server.close();
            finishTest();
        })
    })
});