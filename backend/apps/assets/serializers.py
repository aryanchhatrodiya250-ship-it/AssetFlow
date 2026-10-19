from datetime import datetime

from rest_framework import serializers


def _reject_blank(value, field_name):
    if value is None:
        return value
    if isinstance(value, str) and not value.strip():
        raise serializers.ValidationError(f"{field_name} cannot be empty or whitespace only")
    return value


def _validate_positive(value, field_name):
    if value is None or value <= 0:
        raise serializers.ValidationError(f"{field_name} must be greater than 0")
    return value


def _validate_non_negative(value, field_name):
    if value is None or value < 0:
        raise serializers.ValidationError(f"{field_name} cannot be negative")
    return value


def _validate_date(value, field_name):
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise serializers.ValidationError(f"{field_name} must be a valid date in YYYY-MM-DD format")
    return parsed.strftime("%Y-%m-%d")

class ValuationRecordSerializer(serializers.Serializer):
    timestamp = serializers.FloatField()
    value = serializers.FloatField()

class AssetSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, read_only=True)
    owner_id = serializers.CharField(required=True)
    name = serializers.CharField(max_length=150)
    category = serializers.ChoiceField(choices=[
        ("Real Estate", "Real Estate"),
        ("Gold & Precious Metals", "Gold & Precious Metals"),
        ("Stocks", "Stocks"),
        ("Mutual Funds", "Mutual Funds"),
        ("Bonds", "Bonds"),
        ("Fixed Deposits", "Fixed Deposits"),
        ("Crypto", "Crypto"),
        ("Businesses", "Businesses"),
        ("Vehicles", "Vehicles"),
        ("Collectibles", "Collectibles"),
        ("Private Equity", "Private Equity"),
        ("Other Assets", "Other Assets")
    ])
    subcategory = serializers.CharField(max_length=100, required=False, allow_blank=True)
    purchase_date = serializers.CharField(max_length=20)
    purchase_price = serializers.FloatField()
    current_value = serializers.FloatField()
    
    # Location
    address = serializers.CharField(max_length=250, required=False, allow_blank=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    
    images = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    documents = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    
    tax_details = serializers.CharField(required=False, allow_blank=True, default="")
    maintenance_cost = serializers.FloatField(required=False, default=0.0)
    insurance = serializers.CharField(required=False, allow_blank=True, default="")
    
    status = serializers.ChoiceField(choices=[
        ("Active", "Active"), 
        ("Sold", "Sold"), 
        ("Maintenance", "Maintenance"), 
        ("Pending", "Pending")
    ], default="Active")
    
    manager_id = serializers.CharField(required=False, allow_blank=True, default="")
    remarks = serializers.CharField(required=False, allow_blank=True, default="")
    income_generated = serializers.FloatField(required=False, default=0.0)
    roi = serializers.FloatField(required=False, default=0.0)
    growth_pct = serializers.FloatField(required=False, default=0.0)
    depreciation = serializers.FloatField(required=False, default=0.0)
    
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    favorites = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    valuation_history = serializers.ListField(child=ValuationRecordSerializer(), required=False, default=[])

    def validate_name(self, value):
        return _reject_blank(value, "name")

    def validate_subcategory(self, value):
        if value == "": return value
        return _reject_blank(value, "subcategory")

    def validate_purchase_date(self, value):
        return _validate_date(value, "purchase_date")

    def validate_purchase_price(self, value):
        return _validate_positive(value, "purchase_price")

    def validate_current_value(self, value):
        return _validate_positive(value, "current_value")

    def validate_address(self, value):
        if value == "": return value
        return _reject_blank(value, "address")

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("latitude must be between -90 and 90")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("longitude must be between -180 and 180")
        return value

    def validate_maintenance_cost(self, value):
        return _validate_non_negative(value, "maintenance_cost")

    def validate_income_generated(self, value):
        return _validate_non_negative(value, "income_generated")

    def validate_depreciation(self, value):
        return _validate_non_negative(value, "depreciation")

    def validate_tags(self, value):
        if len(value) > 20:
            raise serializers.ValidationError("tags cannot contain more than 20 items")
        cleaned = []
        for tag in value:
            cleaned.append(_reject_blank(tag, "tag"))
        return cleaned

    def validate_favorites(self, value):
        if len(value) > 1000:
            raise serializers.ValidationError("favorites cannot contain more than 1000 items")
        return value

    def validate_valuation_history(self, value):
        if len(value) > 500:
            raise serializers.ValidationError("valuation_history cannot contain more than 500 records")
        return value
