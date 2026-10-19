from datetime import datetime

from rest_framework import serializers


def _reject_blank(value, field_name):
    if value is None:
        return value
    if isinstance(value, str) and not value.strip():
        raise serializers.ValidationError(f"{field_name} cannot be empty or whitespace only")
    return value


def _validate_date(value, field_name):
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise serializers.ValidationError(f"{field_name} must be a valid date in YYYY-MM-DD format")
    return parsed.strftime("%Y-%m-%d")

class RentPaymentRecordSerializer(serializers.Serializer):
    payment_id = serializers.CharField(required=False)
    amount = serializers.FloatField()
    month = serializers.CharField(max_length=20) # e.g. "July 2026"
    date_paid = serializers.FloatField()
    status = serializers.ChoiceField(choices=[("Paid", "Paid"), ("Unpaid", "Unpaid"), ("Late", "Late")], default="Paid")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be greater than 0")
        return value

    def validate_month(self, value):
        return _reject_blank(value, "month")

    def validate_date_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError("date_paid must be a valid timestamp")
        return value

class MaintenanceRequestSerializer(serializers.Serializer):
    request_id = serializers.CharField(required=False)
    issue = serializers.CharField(max_length=250)
    cost = serializers.FloatField(default=0.0)
    status = serializers.ChoiceField(choices=[("Pending", "Pending"), ("In Progress", "In Progress"), ("Resolved", "Resolved")], default="Pending")
    date_created = serializers.FloatField()

    def validate_issue(self, value):
        return _reject_blank(value, "issue")

    def validate_cost(self, value):
        if value < 0:
            raise serializers.ValidationError("cost cannot be negative")
        return value

    def validate_date_created(self, value):
        if value <= 0:
            raise serializers.ValidationError("date_created must be a valid timestamp")
        return value

class LeaseSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, read_only=True)
    property_id = serializers.CharField() # References an asset _id
    tenant_name = serializers.CharField(max_length=150)
    tenant_email = serializers.EmailField()
    tenant_phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    rent_amount = serializers.FloatField()
    rent_due_day = serializers.IntegerField(default=1) # Day of the month
    lease_start = serializers.CharField(max_length=20)
    lease_end = serializers.CharField(max_length=20)
    security_deposit = serializers.FloatField()
    status = serializers.ChoiceField(choices=[("Active", "Active"), ("Expired", "Expired"), ("Terminated", "Terminated")], default="Active")
    payment_history = serializers.ListField(child=RentPaymentRecordSerializer(), required=False, default=[])
    maintenance_requests = serializers.ListField(child=MaintenanceRequestSerializer(), required=False, default=[])

    def validate_property_id(self, value):
        return _reject_blank(value, "property_id")

    def validate_tenant_name(self, value):
        return _reject_blank(value, "tenant_name")

    def validate_tenant_email(self, value):
        return _reject_blank(value, "tenant_email")

    def validate_tenant_phone(self, value):
        return _reject_blank(value, "tenant_phone")

    def validate_rent_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("rent_amount must be greater than 0")
        return value

    def validate_rent_due_day(self, value):
        if value < 1 or value > 31:
            raise serializers.ValidationError("rent_due_day must be between 1 and 31")
        return value

    def validate_lease_start(self, value):
        return _validate_date(value, "lease_start")

    def validate_lease_end(self, value):
        return _validate_date(value, "lease_end")

    def validate_security_deposit(self, value):
        if value < 0:
            raise serializers.ValidationError("security_deposit cannot be negative")
        return value
