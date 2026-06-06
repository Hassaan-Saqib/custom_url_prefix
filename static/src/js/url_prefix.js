/** @odoo-module **/

/**
 * Custom URL Prefix — Frontend rewriter
 *
 * This module intercepts navigation and rewrites URLs in the browser so that
 * the displayed address uses the configured custom prefix instead of /odoo/.
 *
 * Strategy:
 *   1. On load, fetch the configured prefix from the backend (JSON-RPC).
 *   2. If a prefix is set, patch history.pushState / replaceState to
 *      transparently swap /odoo/ ↔ /‹prefix›/ in every URL change.
 *   3. Also swap the current URL on initial page load.
 *   4. Register a popstate listener to handle Back/Forward navigation.
 *
 * NOTE: Odoo's router still uses /odoo/ internally; we only change what the
 * user sees in the address bar. Incoming requests on the custom prefix are
 * rewritten to /odoo/ by the WSGI middleware (see main.py for the server-side
 * rewrite helper, or configure your reverse proxy accordingly).
 */

import { session } from "@web/session";
import { registry } from "@web/core/registry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Swap /odoo/ → /<prefix>/ in a URL string (or vice-versa when reverse=true).
 * @param {string} url
 * @param {string} prefix   custom prefix (without leading/trailing slashes)
 * @param {boolean} reverse  if true, swap prefix → odoo
 * @returns {string}
 */
function swapPrefix(url, prefix, reverse = false) {
    if (!prefix || prefix === "odoo" || !url) return url;

    const from = reverse ? `/${prefix}/` : "/odoo/";
    const to   = reverse ? "/odoo/"       : `/${prefix}/`;

    // Handle URL objects
    if (url instanceof URL) {
        const newUrl = new URL(url.toString());
        if (newUrl.pathname.startsWith(from)) {
            newUrl.pathname = to + newUrl.pathname.slice(from.length);
        } else if (newUrl.pathname === from.slice(0, -1)) {
            newUrl.pathname = to.slice(0, -1);
        }
        return newUrl;
    }

    // Handle strings
    if (typeof url === "string") {
        let isAbsolute = url.startsWith("http://") || url.startsWith("https://");
        let pathPart = url;
        let origin = "";

        if (isAbsolute) {
            try {
                const parsed = new URL(url);
                origin = parsed.origin;
                pathPart = url.slice(origin.length);
            } catch (e) {
                // ignore
            }
        }

        if (pathPart.startsWith(from)) {
            pathPart = to + pathPart.slice(from.length);
        } else if (pathPart === from.slice(0, -1)) {
            pathPart = to.slice(0, -1);
        }

        return origin + pathPart;
    }

    return url;
}

// ---------------------------------------------------------------------------
// Core service
// ---------------------------------------------------------------------------

const customUrlPrefixService = {
    name: "custom_url_prefix",
    dependencies: [],

    async start(env) {
        // Fetch config from backend
        let prefix = "";
        try {
            const result = await fetch("/custom_url_prefix/config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": odoo.csrf_token || "",
                },
                body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: {} }),
            });
            const data = await result.json();
            prefix = (data.result && data.result.prefix) || "";
        } catch (e) {
            console.debug("[CustomUrlPrefix] Could not fetch prefix config:", e);
            return;
        }

        if (!prefix || prefix === "odoo") {
            // No custom prefix configured — nothing to do
            return;
        }

        console.debug(`[CustomUrlPrefix] Active prefix: /${prefix}/`);

        // ----------------------------------------------------------------
        // 1. Rewrite the current address bar URL on page load
        // ----------------------------------------------------------------
        const initialUrl = window.location.pathname + window.location.search + window.location.hash;
        const rewritten  = swapPrefix(initialUrl, prefix);
        if (rewritten !== initialUrl) {
            window.history.replaceState(window.history.state, "", rewritten);
        }

        // ----------------------------------------------------------------
        // 2. Patch history.pushState
        // ----------------------------------------------------------------
        const origPushState = window.history.pushState.bind(window.history);
        window.history.pushState = function (state, title, url) {
            if (url) {
                url = swapPrefix(url, prefix);
            }
            return origPushState(state, title, url);
        };

        // ----------------------------------------------------------------
        // 3. Patch history.replaceState
        // ----------------------------------------------------------------
        const origReplaceState = window.history.replaceState.bind(window.history);
        window.history.replaceState = function (state, title, url) {
            if (url) {
                url = swapPrefix(url, prefix);
            }
            return origReplaceState(state, title, url);
        };

        // ----------------------------------------------------------------
        // 4. Handle back/forward navigation
        // ----------------------------------------------------------------
        window.addEventListener("popstate", () => {
            const current = window.location.pathname + window.location.search + window.location.hash;
            const fixed   = swapPrefix(current, prefix);
            if (fixed !== current) {
                window.history.replaceState(window.history.state, "", fixed);
            }
        });

        // ----------------------------------------------------------------
        // 5. Intercept <a> clicks so links in menus also show the prefix
        //    (Odoo's router will handle the actual navigation correctly)
        // ----------------------------------------------------------------
        document.addEventListener("click", (e) => {
            const anchor = e.target.closest("a[href]");
            if (!anchor) return;
            const href = anchor.getAttribute("href");
            if (href && href.startsWith("/odoo/")) {
                // Update the visible href without triggering a page load
                anchor.setAttribute("href", swapPrefix(href, prefix));
            }
        }, true);
    },
};

// Register as an Odoo service so it starts automatically
registry.category("services").add("custom_url_prefix", customUrlPrefixService);
