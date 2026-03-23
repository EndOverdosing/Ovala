![OVala Logo](/images/banner.png)

**Ovala** is a sophisticated web proxy that allows users to bypass internet censorship and access blocked content freely. It features a clean, user-friendly interface and is built on the powerful **Ultraviolet** service worker engine, ensuring a smooth and responsive browsing experience entirely client-side.

**Key Features**

* **Modern UI:** A clean, responsive, and aesthetically pleasing interface.
* **Light & Dark Themes:** Automatically adapts to your system preference and can be toggled manually.
* **Fast & Efficient:** Built on the high-performance Ultraviolet engine, running entirely via service workers for a seamless experience.
* **YouTube Support:** In-built processing to handle YouTube video streaming correctly.
* **Privacy-Focused:** No logging of your browsing history on the server-side.
* **Local History:** Quick access to your last four visited sites, stored securely in your browser's local storage.
* **Search Functionality:** Enter a search term or URL to be automatically redirected through the proxy.
* **Easy Deployment:** Deploy your own instance with a single click.

**Getting Started**

You can easily deploy your own instance of **Ovala** or run it locally.

**Deploy to Vercel**

Click the button below to deploy your own instance of **Ovala** to Vercel in minutes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/endoverdosing/Ovala)

**Running Locally**

To run **Ovala** on your local machine, you'll need Node.js installed.

Clone the repository:

```
git clone https://github.com/your-username/ovala.git
cd ovala
```

Install dependencies:

```
npm install
```

Start the application:

```
npm start
```

Access **Ovala**: Open your browser and navigate to **[http://localhost:8080](http://localhost:8080)** (or the port specified in the console).

> **Note:** Service workers require HTTPS in production. For local development, `localhost` and `127.0.0.1` are automatically allowed.

**Configuration**

Ovala's proxy behavior is configured via `uv.config.js`:

* **`prefix`** — The URL path used for proxied requests (default: `/active/go/`).
* **`bare`** — The bare server URL used by Ultraviolet to relay requests.
* **`encodeUrl` / `decodeUrl`** — URL encoding/decoding scheme (XOR codec by default).
* **`handler`, `bundle`, `config`, `sw`** — Paths to the Ultraviolet service worker scripts.

**GA\_ID:** Your Google Analytics Tracking ID (e.g., `UA-XXXXX-Y`). If set, Google Analytics tracking will be enabled for the proxy site itself (not the sites you visit through it). This is optional.

**How It Works**

**Ovala** is powered by **Ultraviolet**, a service worker-based web proxy engine. Here's a brief overview of the key components:

* **Service Worker (`uv-sw.js`):** Registers the Ultraviolet service worker scoped to the proxy prefix. All requests under `/active/go/` are intercepted and handled client-side.
* **Ultraviolet Engine:** Fetches remote content through a bare server, rewrites URLs, scripts, and headers on the fly, and streams everything back to the browser — no server-side proxying required.
* **`index.js`:** Handles the frontend form submission, registers the service worker, resolves the input as a URL or search query, and redirects to the encoded proxy URL.
* **`search.js`:** Resolves user input — a full URL, a bare domain, or a search query — into a fully qualified URL.
* **`register-sw.js`:** Registers the Ultraviolet service worker and enforces HTTPS requirements.

**Middleware / Special Handling:**

* **XOR Encoding:** URLs are encoded with Ultraviolet's built-in XOR codec before being passed to the proxy prefix, obscuring the destination from basic filters.
* **Bare Server:** Ultraviolet routes requests through a bare server (`bare2.mysticmath.workers.dev`) to relay traffic and bypass network-level blocks.

**Attribution & Credits**

**Ovala** is a custom frontend and configuration built upon the foundational work of others.

* **Ultraviolet:** The core proxy engine, built on service workers. The original project can be found [here](https://github.com/titaniumnetwork-dev/Ultraviolet).
* **Ovala UI & Design:** The frontend interface and user experience were designed and developed by EndOverdosing. You can find more projects on GitHub.