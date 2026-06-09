# Custom URL Prefix (Odoo 18.0)

**Custom URL Prefix** is a professional Odoo 18 addon that replaces the default `/odoo/` segment in backend URLs with your own brand name or a custom prefix (e.g., `/mycompany/` or `/portal/`). This allows you to provide a fully branded, cohesive experience to your users and clients without needing complex reverse proxy configurations at the server level.

---

## 🚀 Key Features

* **Complete Brand Control**: Change `https://yourdomain.com/odoo/` to `https://yourdomain.com/yourbrand/` in the browser address bar.
* **Dynamic Browser URL Rewriting**: Seamlessly patches `history.pushState`, `history.replaceState`, navigation (`popstate`), and click interactions in real-time.
* **Server-Side Request Middleware**: Transparently rewrites incoming requests containing the custom prefix to `/odoo/` internally at the HTTP layer, ensuring compatibility with all standard Odoo controllers.
* **URL-Safe Validation**: Automatically validates inputs to prevent security or routing issues (only lowercase letters, digits, and hyphens are permitted).
* **Reserved Path Protection**: Prevents setting reserved paths like `web`, `api`, `static`, `assets`, or `odoo` to maintain system stability.
* **Zero Server-Level Config**: Configure it directly from the Odoo user interface in seconds.

---

## 🛠️ Installation

1. **Copy Module**: Place the `custom_url_prefix` directory into your Odoo custom addons directory.
2. **Restart Odoo**: Restart your Odoo server instance to recognize the new module.
3. **Update Apps List**:
   * Log into Odoo with Administrator permissions.
   * Enable **Developer Mode** (Settings -> General Settings -> scroll down and click "Activate the developer mode").
   * Navigate to the **Apps** menu and click **Update Apps List** in the top navigation bar.
4. **Install**: Search for `Custom URL Prefix` or `custom_url_prefix`, click **Activate** (Install).

---

## ⚙️ Configuration

1. Navigate to **Settings** ➡️ **General Settings**.
2. Scroll to the **Custom URL Prefix** section.
3. Enter your desired brand name or path in the **URL Prefix** field (e.g., `mycompany` or `portal`).
   * *Note: Only lowercase letters `a-z`, digits `0-9`, and hyphens `-` are allowed. The prefix cannot start with a hyphen.*
4. Click **Save**.
5. 📌 **Important**: Restart your Odoo server for the server-side routing (WSGI middleware rewriting) to take full effect for new sessions and bookmarks.

---

## 🧠 How It Works (Technical Overview)

The addon works through a hybrid client-server approach:

### 1. Server-Side Routing (`models/ir_http.py`)
Inherits the `ir.http` model and overrides the `_match` class method. Whenever an incoming request begins with the custom prefix, the middleware intercepts it before Odoo routes it. It internally rewrites the request environment path variable (`PATH_INFO`) back to `/odoo/...` so Odoo routes it as standard, returning the correct response.

### 2. Client-Side Presentation (`static/src/js/url_prefix.js`)
An Odoo frontend service fetches the configuration from the `/custom_url_prefix/config` JSON-RPC endpoint. If a custom prefix is present:
* Swaps the prefix in the browser address bar immediately on load.
* Intercepts and overrides `window.history.pushState` and `window.history.replaceState` to seamlessly display the brand prefix.
* Registers a `popstate` event listener for seamless Back and Forward browser navigation.
* Intercepts `<a>` click events in the document body to translate `/odoo/` menu paths before navigation occurs.

---

## 📂 Codebase Structure

```bash
custom_url_prefix/
│
├── __init__.py
├── __manifest__.py
│
├── controllers/
│   ├── __init__.py
│   └── main.py                     # Config JSON-RPC route handler
│
├── models/
│   ├── __init__.py
│   ├── ir_http.py                  # Server-side WSGI PATH_INFO rewriter
│   └── res_config_settings.py      # Extension of General Settings with validations
│
├── static/
│   ├── description/
│   │   └── banner.png              # Addon App Store banner
│   └── src/
│       └── js/
│           └── url_prefix.js       # Client-side router interception & history patcher
│
└── views/
    └── res_config_settings_views.xml  # General Settings configuration view block
```

---

## 📞 Support & License

* **License**: Odoo Proprietary License v1.0 (OPL-1)
* **Author**: MrHassaan
* **Support**: `mh2353647@gmail.com`
