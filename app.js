var express = require('express');
var Unblocker = require('unblocker');
var Transform = require('stream').Transform;
var youtube = require('unblocker/examples/youtube/youtube.js');
var path = require('path');

var app = express();

app.set('trust proxy', 1);

var google_analytics_id = process.env.GA_ID || null;

function addGa(html) {
    if (google_analytics_id) {
        var ga = [
            "<script type='text/javascript'>",
            "var _gaq = [];",
            "_gaq.push(['_setAccount', '" + google_analytics_id + "']);",
            "_gaq.push(['_trackPageview']);",
            "(function() {",
            " var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;",
            " ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';",
            " var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);",
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

function addUserAgentMiddleware(data) {
    data.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
}

function setHostMiddleware(data) {
    try {
        const url = new URL(data.url);
        data.headers['host'] = url.hostname;
    } catch (e) {
        console.error('Error setting host header:', e.message);
    }
}

var unblockerConfig = {
    prefix: '/proxy/',
    requestMiddleware: [
        addUserAgentMiddleware,
        setHostMiddleware,
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

app.use(function (err, req, res, next) {
    console.error("Proxy Error:", err);
    const errorMessage = "The requested URL could not be found or is currently unavailable.";
    res.redirect(`/?error=${encodeURIComponent(errorMessage)}`);
});

app.use(function (req, res, next) {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

module.exports = (req, res) => app(req, res);