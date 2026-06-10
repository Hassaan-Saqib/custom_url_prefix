/** @odoo-module **/

import { session } from "@web/session";
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { router, routerBus } from "@web/core/browser/router";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Swap /odoo/ ↔ /<prefix>/ in a URL string or URL object.
 * @param {string|URL} url
 * @param {string} prefix   custom prefix (without leading/trailing slashes)
 * @param {boolean} reverse  if true, swap prefix → odoo
 * @returns {string|URL}
 */
function swapPrefix(url, prefix, reverse = false) {
    if (!prefix || prefix === "odoo" || !url) return url;

    const from = reverse ? `/${prefix}/` : "/odoo/";
    const to   = reverse ? "/odoo/"       : `/${prefix}/`;
    const fromNoSlash = reverse ? `/${prefix}` : "/odoo";
    const toNoSlash   = reverse ? "/odoo"      : `/${prefix}`;

    // Handle URL objects
    if (url instanceof URL) {
        const newUrl = new URL(url.toString());
        if (newUrl.pathname.startsWith(from)) {
            newUrl.pathname = to + newUrl.pathname.slice(from.length);
        } else if (newUrl.pathname === fromNoSlash) {
            newUrl.pathname = toNoSlash;
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
        } else if (pathPart === fromNoSlash) {
            pathPart = toNoSlash;
        }

        return origin + pathPart;
    }

    return url;
}

// ---------------------------------------------------------------------------
// Patching Odoo's Router
// ---------------------------------------------------------------------------

const prefix = session.url_prefix;

if (prefix && prefix !== "odoo") {
    // Patch router methods to translate custom prefix ↔ odoo internally
    patch(router, {
        urlToState(urlObj) {
            const cleanUrl = swapPrefix(urlObj, prefix, true);
            urlObj.pathname = cleanUrl.pathname;
            return super.urlToState(urlObj);
        },
        stateToUrl(state) {
            const urlStr = super.stateToUrl(state);
            return swapPrefix(urlStr, prefix, false);
        }
    });

    // Re-evaluate and replace the initial router state based on the current browser URL
    const initialUrl = new URL(window.location);
    const newState = router.urlToState(initialUrl);
    router.replaceState(newState, { replace: true, sync: true });

    // Intercept clicks on links using the custom prefix to handle them client-side
    document.addEventListener("click", (ev) => {
        if (ev.defaultPrevented || ev.target.closest("[contenteditable]")) {
            return;
        }
        const anchor = ev.target.closest("a");
        const href = anchor?.getAttribute("href");
        if (href && !href.startsWith("#")) {
            let url;
            try {
                url = new URL(anchor.href);
            } catch {
                return;
            }
            const from = `/${prefix}/`;
            const fromNoSlash = `/${prefix}`;
            if (
                window.location.host === url.host &&
                (url.pathname.startsWith(from) || url.pathname === fromNoSlash) &&
                anchor.target !== "_blank"
            ) {
                ev.preventDefault();
                ev.stopPropagation();

                const state = router.urlToState(url);
                router.pushState(state);
                
                new Promise((res) => setTimeout(res, 0)).then(() => routerBus.trigger("ROUTE_CHANGE"));
            }
        }
    }, true);
}

// ---------------------------------------------------------------------------
// Legacy Odoo service placeholder
// ---------------------------------------------------------------------------

const customUrlPrefixService = {
    name: "custom_url_prefix",
    dependencies: [],
    start(env) {
        return {
            prefix: prefix || "",
        };
    },
};

registry.category("services").add("custom_url_prefix", customUrlPrefixService);
