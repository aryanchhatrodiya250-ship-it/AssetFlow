from datetime import datetime

from rest_framework import serializers


def _reject_blank(value, field_name):
    if value is None:
        return value
    if isinstance(value, str) and not value.strip():
        raise serializers.ValidationError(f"{field_name} cannot be empty or whitespace only")
    return value

class GoalSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, read_only=True)
    client_id = serializers.CharField(required=True)
    name = serializers.CharField(max_length=150)
    category = serializers.ChoiceField(choices=[
        ("Buy House", "Buy House"),
        ("Retirement", "Retirement"),
        ("Child Education", "Child Education"),
        ("Car", "Car"),
        ("Vacation", "Vacation"),
        ("Business Expansion", "Business Expansion"),
        ("Other", "Other")
    ])
    target_amount = serializers.FloatField()
    current_amount = serializers.FloatField(default=0.0)
    target_date = serializers.CharField(max_length=20) # YYYY-MM-DD
    monthly_investment = serializers.FloatField(default=0.0)
    progress_pct = serializers.FloatField(required=False, default=0.0)

    def validate_client_id(self, value):
        return _reject_blank(value, "client_id")

    def validate_name(self, value):
        return _reject_blank(value, "name")

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("target_amount must be greater than 0")
        return value

    def validate_current_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("current_amount cannot be negative")
        return value

    def validate_target_date(self, value):
        try:
            parsed = datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise serializers.ValidationError("target_date must be YYYY-MM-DD")
        return parsed.strftime("%Y-%m-%d")

    def validate_monthly_investment(self, value):
        if value < 0:
            raise serializers.ValidationError("monthly_investment cannot be negative")
        return value
