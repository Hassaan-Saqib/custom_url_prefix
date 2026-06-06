# -*- coding: utf-8 -*-
import re
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # The custom prefix value stored as an IrConfigParameter
    url_prefix = fields.Char(
        string='Custom URL Prefix',
        config_parameter='custom_url_prefix.prefix',
        help=(
            'Enter the custom prefix to replace the default /odoo/ path. '
            'For example, entering "mycompany" will change '
            'https://site.com/odoo/dashboard → https://site.com/mycompany/dashboard. '
            'Use only lowercase letters, digits and hyphens. Leave empty to use the Odoo default.'
        ),
    )

    @api.constrains('url_prefix')
    def _check_url_prefix(self):
        """Ensure the prefix is URL-safe."""
        for record in self:
            prefix = record.url_prefix
            if prefix:
                prefix = prefix.strip()
                if not re.match(r'^[a-z0-9][a-z0-9\-]*$', prefix):
                    raise ValidationError(_(
                        'The URL prefix "%s" is invalid. '
                        'Use only lowercase letters (a-z), digits (0-9) and hyphens (-). '
                        'Must start with a letter or digit.'
                    ) % prefix)
                if prefix in ('odoo', 'web', 'api', 'static', 'assets'):
                    raise ValidationError(_(
                        'The prefix "%s" is reserved by Odoo and cannot be used.'
                    ) % prefix)

    def set_values(self):
        """Strip whitespace before saving."""
        if self.url_prefix:
            self.url_prefix = self.url_prefix.strip().lower()
        super().set_values()
