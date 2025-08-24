var express = require('express');
var Unblocker = require('unblocker');
var Transform = require('stream').Transform;
var youtube = require('unblocker/examples/youtube/youtube.js');

var app = express();

app.set('trust proxy', 1);

var google_analytics_id = process.env.GA_ID || null;

function addGa(html) {
    if (google_analytics_id) {
        var ga = [
            "<script type=\"text/javascript\">",
            "var _gaq = [];",
            "_gaq.push(['_setAccount', '" + google_analytics_id + "']);",
            "_gaq.push(['_trackPageview']);",
            "(function() {",
            "  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;",
            "  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';",
            "  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);",
            "})();",
            "</script>"
        ].join("\n");
        html = html.replace("</body>", ga + "\n\n</body>");
    }
    return html;
}

function googleAnalyticsMiddleware(data) {
    if (data.contentType && data.contentType.includes('text/html')) {
        data.stream = data.stream.pipe(new Transform({
            decodeStrings: false,
            transform: function (chunk, encoding, next) {
                this.push(addGa(chunk.toString()));
                next();
            }
        }));
    }
}

function fixMalformedUrlMiddleware(data) {
    if (data.url.startsWith('https:/') && !data.url.startsWith('https://')) {
        data.url = data.url.replace('https:/', 'https://');
    }
    if (data.url.startsWith('http:/') && !data.url.startsWith('http://')) {
        data.url = data.url.replace('http:/', 'http://');
    }
}

function blockAdsMiddleware(data) {
    const adHosts = [
        'googlesyndication.com', 'googleadservices.com', 'doubleclick.net',
        'adservice.google.com', 'pagead2.googlesyndication.com', 'securepubads.g.doubleclick.net',
    ];
    if (adHosts.some(host => data.url.includes(host))) {
        console.log(`Blocking ad request to: ${data.url}`);
        data.setHeader('Content-Type', 'application/javascript');
        data.end('// Ad blocked by proxy');
    }
}

var unblockerConfig = {
    prefix: '/proxy/',
    requestMiddleware: [
        blockAdsMiddleware,
        fixMalformedUrlMiddleware,
        youtube.processRequest
    ],
    responseMiddleware: [
        googleAnalyticsMiddleware
    ]
};

var unblocker = new Unblocker(unblockerConfig);

app.use(unblocker);

app.use('/', express.static(__dirname + '/public'));

app.get("/no-js", function (req, res) {
    const site = req.query.url;

    if (site && site.trim()) {
        let targetUrl = site.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        res.redirect(unblockerConfig.prefix + targetUrl);
    } else {
        res.redirect('/');
    }
});

module.exports = app;