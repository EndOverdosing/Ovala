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
        if (data.method === 'GET' && !data.stream._isGAProcessed) {
            data.stream._isGAProcessed = true;
            data.stream = data.stream.pipe(new Transform({
                decodeStrings: false,
                transform: function (chunk, encoding, next) {
                    try {
                        this.push(addGa(chunk.toString()));
                        next();
                    } catch (err) {
                        console.error('GA Transform error:', err);
                        this.push(chunk);
                        next();
                    }
                }
            }));
        }
    }
}

function errorPreventionMiddleware(data) {
    if (data.url.includes('?error=') || data.url.includes('%3Ferror%3D')) {
        console.log('Skipping error URL to prevent loop:', data.url);
        throw new Error('Error URL processing skipped to prevent loops');
    }

    if (data.method === 'POST' && data.url.includes('error=')) {
        console.log('Blocking POST to error URL:', data.url);
        throw new Error('POST to error URL blocked');
    }
}

function debugUrlMiddleware(data) {
    console.log('=== URL Debug Info ===');
    console.log('Original URL:', data.url);
    console.log('Headers:', data.headers);
    console.log('Method:', data.method);
    console.log('=====================');
}

function fixMalformedUrlMiddleware(data) {
    let url = data.url;
    console.log('URL before fixing:', url);

    if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('URL already has valid protocol, skipping fix');
        return;
    }

    if (url.startsWith('https:/') && !url.startsWith('https://')) {
        url = url.replace('https:/', 'https://');
        console.log('Fixed https:/ to https://');
    } else if (url.startsWith('http:/') && !url.startsWith('http://')) {
        url = url.replace('http:/', 'http://');
        console.log('Fixed http:/ to http://');
    } else {
        const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,})/;
        if (domainPattern.test(url)) {
            url = 'https://' + url;
            console.log('Added https:// to domain:', url);
        }
    }

    data.url = url;
    console.log('URL after fixing:', data.url);
}

function addUserAgentMiddleware(data) {
    data.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
}

function removeProxyHeadersMiddleware(data) {
    console.log('Cleaning headers for:', data.url);

    delete data.headers['x-forwarded-host'];
    delete data.headers['x-forwarded-proto'];
    delete data.headers['x-forwarded-port'];
    delete data.headers['x-forwarded-for'];
    delete data.headers['x-vercel-id'];
    delete data.headers['x-vercel-forwarded-for'];
    delete data.headers['x-vercel-deployment-url'];
    delete data.headers['x-real-ip'];
    delete data.headers['sentry-trace'];
    delete data.headers['baggage'];

    if (data.headers.referer) {
        const currentReferer = data.headers.referer;
        console.log('Original referer:', currentReferer);

        if (currentReferer.includes('localhost') || currentReferer.includes('/proxy')) {
            try {
                const targetUrl = new URL(data.url);
                data.headers.referer = `${targetUrl.protocol}//${targetUrl.hostname}/`;
                console.log('Fixed referer to:', data.headers.referer);
            } catch (e) {
                delete data.headers.referer;
                console.log('Removed invalid referer');
            }
        }
    }

    if (data.headers.origin && data.headers.origin.includes('localhost')) {
        try {
            const targetUrl = new URL(data.url);
            data.headers.origin = `${targetUrl.protocol}//${targetUrl.hostname}`;
            console.log('Fixed origin to:', data.headers.origin);
        } catch (e) {
            delete data.headers.origin;
        }
    }

    console.log('Headers after cleaning:', Object.keys(data.headers));
}

function setHostMiddleware(data) {
    try {
        const url = new URL(data.url);
        data.headers['host'] = url.hostname;
        console.log('Set host header to:', url.hostname);
    } catch (e) {
        console.error('Error setting host header for URL:', data.url, e.message);
    }
}

function preventLocalhostRedirectMiddleware(data) {
    if (data.url.includes('localhost') || data.url.includes('127.0.0.1') || data.url.includes('::1')) {
        console.log('Detected localhost redirect attempt, blocking:', data.url);
        throw new Error('Website is trying to redirect to localhost - this is blocked for security');
    }
}

var unblockerConfig = {
    prefix: '/proxy/',
    requestMiddleware: [
        errorPreventionMiddleware,
        debugUrlMiddleware,
        preventLocalhostRedirectMiddleware,
        fixMalformedUrlMiddleware,
        removeProxyHeadersMiddleware,
        addUserAgentMiddleware,
        setHostMiddleware
    ],
    responseMiddleware: [
        googleAnalyticsMiddleware
    ]
};

var unblocker = new Unblocker(unblockerConfig);

app.use('/', express.static(__dirname + '/public'));

app.get("/no-js", function (req, res) {
    const site = req.query.url;
    console.log('=== /no-js Route ===');
    console.log('Received URL:', site);

    if (site && site.trim()) {
        let targetUrl = site.trim();

        if (targetUrl.includes('error=')) {
            return res.redirect('/');
        }

        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
                targetUrl = 'https://' + targetUrl;
            } else {
                targetUrl = 'https://www.google.com/search?q=' + encodeURIComponent(targetUrl);
            }
        }

        console.log('Processed URL:', targetUrl);

        try {
            const urlObj = new URL(targetUrl);
            console.log('URL validation passed. Protocol:', urlObj.protocol, 'Host:', urlObj.hostname);

            const finalRedirect = unblockerConfig.prefix + targetUrl;
            console.log('Final redirect URL:', finalRedirect);
            console.log('==================');
            res.redirect(finalRedirect);
        } catch (e) {
            console.error('URL validation failed:', targetUrl, e.message);
            const errorMessage = "Invalid URL provided. Please check the URL and try again.";
            res.redirect(`http://${req.get('host')}/?error=${encodeURIComponent(errorMessage)}`);
        }
    } else {
        res.redirect('/');
    }
});

app.use(unblocker);

app.use(function (err, req, res, next) {
    console.error('=== Error Handler ===');
    console.error("Proxy Error:", err.message);
    console.error("Error Code:", err.code);
    console.error("Request URL:", req.url);
    console.error("Request method:", req.method);
    console.error("==================");

    if (req.url.includes('error=') || req.headers.referer?.includes('error=')) {
        console.log('Error loop detected, serving basic error page');
        return res.status(500).send(`
            <html>
                <head><title>Proxy Error</title></head>
                <body>
                    <h1>Proxy Error</h1>
                    <p>The requested URL could not be loaded through the proxy.</p>
                    <p><a href="/">Return Home</a></p>
                </body>
            </html>
        `);
    }

    let errorMessage = "The requested URL could not be found or is currently unavailable.";

    if (err.code === 'ENOTFOUND') {
        errorMessage = "The domain could not be found. Please check the URL and try again.";
    } else if (err.code === 'ECONNREFUSED') {
        errorMessage = "Connection refused. The website might be down or blocking requests.";
    } else if (err.code === 'ETIMEDOUT') {
        errorMessage = "Connection timed out. Please try again later.";
    } else if (err.code === 'ERR_STREAM_WRITE_AFTER_END') {
        errorMessage = "Stream error occurred. Please try refreshing the page.";
    } else if (err.message && err.message.includes('Invalid URL')) {
        errorMessage = err.message;
    }

    res.redirect(`http://${req.get('host')}/?error=${encodeURIComponent(errorMessage)}`);
});

app.use(function (req, res, next) {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

module.exports = (req, res) => app(req, res);