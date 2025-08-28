![OVala Logo](/public/images/banner.png)

**Ovala** is a sophisticated web proxy that allows users to bypass internet censorship and access blocked content freely. It features a clean, user-friendly interface and is built on the powerful and efficient Node Unblocker engine, ensuring a smooth and responsive browsing experience.

**Key Features**

* **Modern UI:** A clean, responsive, and aesthetically pleasing interface.
* **Light & Dark Themes:** Automatically adapts to your system preference and can be toggled manually.
* **Fast & Efficient:** Built on the high-performance Node Unblocker engine for a seamless experience.
* **YouTube Support:** In-built processing to handle YouTube video streaming correctly.
* **Privacy-Focused:** No logging of your browsing history on the server-side.
* **Local History:** Quick access to your last four visited sites, stored securely in your browser's local storage.
* **Search Functionality:** Enter a search term to be automatically redirected to Google search through the proxy.
* **Easy Deployment:** Deploy your own instance with a single click.

**Getting Started**

You can easily deploy your own instance of **Ovala** or run it locally.

**Deploy to Vercel**

Click the button below to deploy your own instance of **Ovala** to Vercel in minutes.

![alt text](https://vercel.com/button)

**Running Locally**

To run **Ovala** on your local machine, you'll need Node.js (v6 or higher) installed.

Clone the repository:

```
git clone https://github.com/your-username/ovala.git
cd ovala
```

Install dependencies:

```
npm install
```

This will also run the postinstall script to apply necessary patches with patch-package.

Start the application:

```
npm start
```

Access **Ovala**: Open your browser and navigate to **[http://localhost:8080](http://localhost:8080)** (or the port specified in the console).

**Configuration**

**Ovala** can be configured using environment variables.

* **GA\_ID:** Your Google Analytics Tracking ID (e.g., UA-XXXXX-Y). If this variable is set, Google Analytics tracking will be enabled to monitor traffic to the proxy site itself (not the sites you visit through it). This is optional.

**How It Works**

**Ovala** is powered by Express.js and the core Unblocker library. Here’s a brief overview of the key components from app.js:

* **Express Server:** Handles routing and serves the static frontend files (index.html, CSS, etc.).
* **Unblocker Engine:** The core proxy logic. It receives a request for a remote URL, fetches the content, and then streams it back to the user, rewriting URLs and scripts on the fly to ensure everything works through the proxy.

**Middleware:**

* **fixMalformedUrlMiddleware:** A custom middleware to correct common URL typos (e.g., https\:/ instead of https\://).
* **youtube.processRequest:** Special middleware from the Unblocker examples to handle YouTube's unique data loading, making video playback possible.
* **googleAnalyticsMiddleware:** Injects the Google Analytics script into proxied pages if a GA\_ID is provided.

**Attribution & Credits**

**Ovala** is a custom frontend and configuration built upon the foundational work of others.

* **Node Unblocker:** The core proxy engine was created by Nathan Friedly. The original project can be found [here](https://github.com/nfriedly/nodeunblocker).
* **Ovala UI & Design:** The frontend interface and user experience were designed and developed by EndOverdosing. You can find more projects on GitHub.
