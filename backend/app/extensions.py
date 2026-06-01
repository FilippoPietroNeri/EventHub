from flasgger import Swagger
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/api/docs/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/",
}

swagger_template = {
    "info": {
        "title": "EventHub API",
        "description": "API EventHub — Supabase Auth + PostgreSQL + Storage",
        "version": "2.0.0",
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": 'JWT Supabase Auth: "Bearer <access_token>"',
        }
    },
}

swagger = Swagger(config=swagger_config, template=swagger_template)
