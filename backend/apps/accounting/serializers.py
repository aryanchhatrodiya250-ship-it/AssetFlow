from rest_framework import serializers


def _reject_blank(value, field_name):
    if value is None:
        return value
    if isinstance(value, str) and not value.strip():
        raise serializers.ValidationError(f"{field_name} cannot be empty or whitespace only")
    return value

class IncomeSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, read_only=True)
    client_id = serializers.CharField(required=True)
    category = serializers.ChoiceField(choices=[
        ("Rental Income", "Rental Income"),
        ("Business Income", "Business Income"),
        ("Dividends", "Dividends"),
        ("Interest", "Interest"),
        ("Capital Gains", "Capital Gains"),
        ("Consultancy Income", "Consultancy Income"),
        ("Royalty", "Royalty"),
        ("Other Income", "Other Income")
    ])
    amount = serializers.FloatField()
    received_date = serializers.FloatField() # timestamp
    tax_classification = serializers.CharField(max_length=150, required=False, allow_blank=True, default="Other Income")
    description = serializers.CharField(max_length=250, required=False, allow_blank=True, default="")

    def validate_client_id(self, value):
        return _reject_blank(value, "client_id")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be greater than 0")
        return value

    def validate_received_date(self, value):
        if value <= 0:
            raise serializers.ValidationError("received_date must be a valid timestamp")
        return value

class ExpenseSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, read_only=True)
    client_id = serializers.CharField(required=True)
    asset_id = serializers.CharField(required=False, allow_blank=True, default="")
    category = serializers.ChoiceField(choices=[
        ("Maintenance & Repairs", "Maintenance & Repairs"),
        ("Property Tax", "Property Tax"),
        ("Insurance Premium", "Insurance Premium"),
        ("Loan EMI", "Loan EMI"),
        ("Electricity Bills", "Electricity Bills"),
        ("Water Bills", "Water Bills"),
        ("Legal Expenses", "Legal Expenses"),
        ("Brokerage & Commission", "Brokerage & Commission"),
        ("Travel Expenses", "Travel Expenses"),
        ("Salary & Wages", "Salary & Wages"),
        ("Miscellaneous", "Miscellaneous")
    ])
    amount = serializers.FloatField()
    spent_date = serializers.FloatField() # timestamp
    description = serializers.CharField(max_length=250, required=False, allow_blank=True, default="")

    def validate_client_id(self, value):
        return _reject_blank(value, "client_id")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be greater than 0")
        return value

    def validate_spent_date(self, value):
        if value <= 0:
            raise serializers.ValidationError("spent_date must be a valid timestamp")
        return value

class InvoiceRequestSerializer(serializers.Serializer):
    billed_to_name = serializers.CharField(max_length=150)
    billed_to_address = serializers.CharField(max_length=250)
    billed_to_gstin = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    item_description = serializers.CharField(max_length=200)
    amount = serializers.FloatField()
    gst_rate_pct = serializers.IntegerField(default=18) # 18% standard GST

    def validate_billed_to_name(self, value):
        return _reject_blank(value, "billed_to_name")

    def validate_billed_to_address(self, value):
        return _reject_blank(value, "billed_to_address")

    def validate_billed_to_gstin(self, value):
        return _reject_blank(value, "billed_to_gstin")

    def validate_item_description(self, value):
        return _reject_blank(value, "item_description")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("amount must be greater than 0")
        return value

    def validate_gst_rate_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("gst_rate_pct must be between 0 and 100")
        return value
