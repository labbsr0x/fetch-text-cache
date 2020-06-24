const testserver = require('./testserver');
const cacheableFetch = require('../cacheableFetch');

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

test('Simulating a 3000ms response', finishTest => {
    return testserver(new Promise(resolve => {
        setTimeout(()=>{
            resolve(Math.random()+'');
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