# -*- coding: utf-8 -*-
{
    'name': 'Brand URL Prefix',
    'version': '18.0.1.0.0',
    'summary': 'Replace /odoo/ in URLs with your own custom brand prefix',
    'description': """
Custom URL Prefix
=================
Professionalize your Odoo links. Change the default
https://site.com/odoo/ path to https://site.com/yourbrand/
for a fully branded, professional experience.

Features:
- Set any custom URL prefix from General Settings
- Automatically redirects /odoo/* to your custom prefix
- Works for all backend routes
- No server-level config required
- Simple one-field configuration in Settings
    """,
    'author': 'MrHassaan',
    'website': '',
    'category': 'Technical',
    'license': 'OPL-1',
    'price': 10.00,
    'currency': 'EUR',
    'support': 'mh2353647@gmail.com',
    'depends': ['web', 'base_setup'],
    'data': [
        'views/res_config_settings_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'custom_url_prefix/static/src/js/url_prefix.js',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'images': ['static/description/banner.png'],
}
