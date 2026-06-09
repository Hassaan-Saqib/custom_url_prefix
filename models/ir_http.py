# -*- coding: utf-8 -*-
from odoo import models
from odoo.http import request

class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _match(cls, path_info):
        try:
            # We must use request.env.registry to avoid using a partially initialized env?
            # Actually, request.env is fully usable here.
            ICP = request.env['ir.config_parameter'].sudo()
            prefix = ICP.get_param('custom_url_prefix.prefix', default='').strip().lower()
            
            if prefix and prefix != 'odoo':
                prefix_path = f'/{prefix}'
                if path_info == prefix_path or path_info.startswith(prefix_path + '/'):
                    # Rewrite the path_info internally
                    new_path = '/odoo' + path_info[len(prefix_path):]
                    request.httprequest.environ['PATH_INFO'] = new_path
                    path_info = new_path
        except Exception:
            # Ignore errors like database not ready or missing table
            pass
            
        return super()._match(path_info)
