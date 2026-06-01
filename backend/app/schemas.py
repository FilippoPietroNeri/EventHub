from marshmallow import Schema, ValidationError, fields, validate, validates_schema


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=80))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=80))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


class UserProfileSchema(Schema):
    first_name = fields.Str(validate=validate.Length(min=1, max=80))
    last_name = fields.Str(validate=validate.Length(min=1, max=80))
    email = fields.Email()


class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate.Length(min=8))


class EventSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    description = fields.Str(required=True)
    category = fields.Str(required=True)
    city = fields.Str(required=True)
    venue = fields.Str(required=True)
    start_at = fields.DateTime(required=True)
    price = fields.Decimal(as_string=True, places=2, validate=validate.Range(min=0))
    capacity = fields.Int(required=True, validate=validate.Range(min=1))
    featured = fields.Bool(load_default=False)


class ReviewSchema(Schema):
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str(required=True, validate=validate.Length(min=3, max=2000))


class UserAdminSchema(Schema):
    role = fields.Str(validate=validate.OneOf(["user", "organizer", "admin"]))
    is_banned = fields.Bool()


def load_schema(schema_cls, data):
    schema = schema_cls()
    errors = schema.validate(data)
    if errors:
        raise ValidationError(errors)
    return schema.load(data)
