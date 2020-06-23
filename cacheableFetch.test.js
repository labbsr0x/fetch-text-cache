const testserver = require('./_test/testserver');
const cacheableFetch = require('./cacheableFetch');

test('Delegates to fetch', finishTest => {
    const randomText = Math.random()+'';
    return testserver(randomText, 'text/plain', 200).then(server => {
        cacheableFetch('http://localhost:3333/').then(response => {
            response.text().then(text => expect(text).toEqual(randomText))
            server.close();
            finishTest();
        })
    })
});

test('Fetch cached data', finishTest => {
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

test.skip('Timeout', ()=>{expect(false).toBe(true)});

test('Error on never hit data', () => {
    cacheableFetch('http://localhost:3333/').catch(e => expect(e).toBeDefined())
});