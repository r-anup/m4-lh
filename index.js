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


const mobileConfig = {
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

const desktopConfig = {
    extends: 'lighthouse:default',
    settings: {
        maxWaitForLoad: 35 * 1000,
        emulatedFormFactor: 'desktop',
        throttling: {
            // Using a "broadband" connection type
            // Corresponds to "Dense 4G 25th percentile" in https://docs.google.com/document/d/1Ft1Bnq9-t4jK5egLSOc28IL4TvR-Tt0se_1faTA4KTY/edit#heading=h.bb7nfy2x9e5v
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
        },
        // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
        skipAudits: ['uses-http2'],
    }
};

let resp = {};
// Usage:

const express = require('express')
const cors = require('cors');
const app = express()

app.set('port', (process.env.PORT || 6000))
app.use(express.static(__dirname + '/public'))
app.use(cors());

app.get('/', async function(request, response) {
    let url = request.query.url;
    let strategy = request.query.strategy;
    if (strategy == null) {
        strategy = 'mobile';
    }


    if (url == null) {
        url = 'https://www.consumerreports.org/cro/index.htm';
    }

    let config = desktopConfig;

    if (strategy == 'mobile') {
        config = mobileConfig;
    }

    await launchChromeAndRunLighthouse(url, opts, config).then(results => {
        resp = results;
        response.send(resp)
    });
})

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})