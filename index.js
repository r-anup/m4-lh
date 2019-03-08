const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

function launchChromeAndRunLighthouse(url, opts, config = null) {
    return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
        opts.port = chrome.port;
        return lighthouse(url, opts, config).then(results => {
            // use results.lhr for the JS-consumeable output
            // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
            // use results.report for the HTML/JSON/CSV output as a string
            // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
            return chrome.kill().then(() => results.lhr)
        });
    });
}

const opts = {
    onlyCategories: ['performance'],
    chromeFlags: ['--headless']

};


const config = {
    extends: 'lighthouse:default',
    settings: {
        maxWaitForLoad: 35 * 1000,
        // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
        skipAudits: ['uses-http2'],
    },
    audits: [
        'metrics/first-contentful-paint-3g',
    ],
    // @ts-ignore TODO(bckenny): type extended Config where e.g. category.title isn't required
    categories: {
        performance: {
            auditRefs: [
                {id: 'first-contentful-paint-3g', weight: 0},
            ],
        },
    },
};

let resp = {};
// Usage:
launchChromeAndRunLighthouse('https://www.consumerreports.org', opts, config).then(results => {
    resp = results;
    //console.log(results);
    // Use results!
});

const express = require('express')
const app = express()


app.set('port', (process.env.PORT || 6000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
    response.send(resp)
})

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})