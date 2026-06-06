# -*- coding: utf-8 -*-
import logging
from odoo import http
from odoo.http import request, Response

_logger = logging.getLogger(__name__)


class CustomUrlPrefixController(http.Controller):
    """
    Intercepts requests coming in on the custom prefix and
    transparently proxies them to the standard /odoo/* handler,
    and vice-versa redirects any /odoo/* request to the custom prefix
    so the URL stays branded.
    """

    def _get_prefix(self):
        """Return the configured custom prefix, or None if not set."""
        ICP = request.env['ir.config_parameter'].sudo()
        prefix = ICP.get_param('custom_url_prefix.prefix', default='').strip()
        return prefix if prefix else None

    # ------------------------------------------------------------------
    # Route: catch all requests on the custom prefix
    # e.g.  /mycompany/<path:subpath>
    # We register this dynamically only when a prefix is configured.
    # Because Odoo routes are static at startup, we use a catch-all
    # and check the prefix at runtime.
    # ------------------------------------------------------------------

    @http.route('/odoo/prefix-info', type='json', auth='user', methods=['POST'])
    def get_prefix_info(self):
        """JSON endpoint so the JS can learn the configured prefix."""
        prefix = self._get_prefix()
        return {'prefix': prefix or 'odoo'}

    # ------------------------------------------------------------------
    # Redirect /odoo/<path> → /<prefix>/<path> in the browser
    # Called from the JS-side rewriter
    # ------------------------------------------------------------------

    @http.route(
        '/custom_url_prefix/config',
        type='json',
        auth='public',
        csrf=False,
        methods=['POST'],
    )
    def get_config(self):
        """Return prefix config for the frontend JS."""
        ICP = request.env['ir.config_parameter'].sudo()
        prefix = ICP.get_param('custom_url_prefix.prefix', default='').strip().lower()
        return {
            'prefix': prefix or '',
            'default_prefix': 'odoo',
        }
