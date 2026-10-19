from datetime import datetime

from rest_framework import serializers


def _reject_blank(value, field_name):
    if value is None or value == "":
        return value
    if isinstance(value, str) and not value.strip():
        raise serializers.ValidationError(f"{field_name} cannot be whitespace only")
    return value


def _validate_phone(value):
    if value:
        cleaned = value.replace("+", "").replace(" ", "").replace("-", "")
        if not cleaned.isdigit() or len(cleaned) < 10 or len(cleaned) > 15:
            raise serializers.ValidationError("phone must contain only digits and be 10-15 digits long (can include +, spaces, dashes)")
    return value


def _validate_date(value, field_name):
    if value in (None, ""):
        return value
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise serializers.ValidationError(f"{field_name} must be YYYY-MM-DD")
    return parsed.strftime("%Y-%m-%d")

class PersonalDetailsSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    address = serializers.CharField(max_length=250, required=False, allow_blank=True)
    date_of_birth = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_first_name(self, value):
        return _reject_blank(value, "first_name")

    def validate_last_name(self, value):
        return _reject_blank(value, "last_name")

    def validate_phone(self, value):
        return _validate_phone(value)

    def validate_address(self, value):
        return _reject_blank(value, "address")

    def validate_date_of_birth(self, value):
        value = _validate_date(value, "date_of_birth")
        if value and value > datetime.now().strftime("%Y-%m-%d"):
            raise serializers.ValidationError("date_of_birth cannot be in the future")
        return value

class KYCSerializer(serializers.Serializer):
    pan = serializers.CharField(max_length=15, required=False, allow_blank=True)
    aadhar = serializers.CharField(max_length=20, required=False, allow_blank=True)
    passport = serializers.CharField(max_length=20, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=[("Pending", "Pending"), ("In Progress", "In Progress"), ("Verified", "Verified"), ("Rejected", "Rejected")], default="Pending")

    def validate_pan(self, value):
        return _reject_blank(value, "pan")

    def validate_aadhar(self, value):
        return _reject_blank(value, "aadhar")

    def validate_passport(self, value):
        return _reject_blank(value, "passport")

class BankAccountSerializer(serializers.Serializer):
    bank_name = serializers.CharField(max_length=100)
    account_number = serializers.CharField(max_length=30)
    ifsc_code = serializers.CharField(max_length=20)
    account_type = serializers.ChoiceField(choices=[("Savings", "Savings"), ("Current", "Current")], required=False, default="Savings")
    balance = serializers.FloatField(default=0.0)

    def validate_bank_name(self, value):
        return _reject_blank(value, "bank_name")

    def validate_account_number(self, value):
        return _reject_blank(value, "account_number")

    def validate_ifsc_code(self, value):
        return _reject_blank(value, "ifsc_code")

    def validate_balance(self, value):
        if value < 0:
            raise serializers.ValidationError("balance cannot be negative")
        return value

class NomineeSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    relationship = serializers.CharField(max_length=50, required=False, allow_blank=True)
    allocation_pct = serializers.IntegerField(default=100)

    def validate_name(self, value):
        return _reject_blank(value, "nominee name")

    def validate_relationship(self, value):
        return _reject_blank(value, "relationship")

    def validate_allocation_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("allocation_pct must be between 0 and 100")
        return value

class FamilyMemberSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    relationship = serializers.CharField(max_length=50)
    age = serializers.IntegerField(required=False, default=0)

    def validate_name(self, value):
        return _reject_blank(value, "family member name")

    def validate_relationship(self, value):
        return _reject_blank(value, "family member relationship")

    def validate_age(self, value):
        if value < 0 or value > 130:
            raise serializers.ValidationError("age must be between 0 and 130")
        return value

class IncomeDetailsSerializer(serializers.Serializer):
    annual_range = serializers.CharField(max_length=50, required=False, allow_blank=True)
    monthly_salary = serializers.FloatField(default=0.0)
    rental_income = serializers.FloatField(default=0.0)
    dividend_income = serializers.FloatField(default=0.0)
    interest_income = serializers.FloatField(default=0.0)
    business_income = serializers.FloatField(default=0.0)

    def validate_annual_range(self, value):
        return _reject_blank(value, "annual_range")

    def validate_monthly_salary(self, value):
        if value < 0:
            raise serializers.ValidationError("monthly_salary cannot be negative")
        return value

    def validate_rental_income(self, value):
        if value < 0:
            raise serializers.ValidationError("rental_income cannot be negative")
        return value

    def validate_dividend_income(self, value):
        if value < 0:
            raise serializers.ValidationError("dividend_income cannot be negative")
        return value

    def validate_interest_income(self, value):
        if value < 0:
            raise serializers.ValidationError("interest_income cannot be negative")
        return value

    def validate_business_income(self, value):
        if value < 0:
            raise serializers.ValidationError("business_income cannot be negative")
        return value

class TaxInfoSerializer(serializers.Serializer):
    tax_slab = serializers.CharField(max_length=30, required=False, allow_blank=True)
    tax_id = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_tax_slab(self, value):
        return _reject_blank(value, "tax_slab")

    def validate_tax_id(self, value):
        return _reject_blank(value, "tax_id")

class ClientProfileUpdateSerializer(serializers.Serializer):
    personal_details = PersonalDetailsSerializer(required=False)
    kyc = KYCSerializer(required=False)
    bank_accounts = serializers.ListField(child=BankAccountSerializer(), required=False)
    nominee = NomineeSerializer(required=False)
    family_members = serializers.ListField(child=FamilyMemberSerializer(), required=False)
    occupation = serializers.CharField(max_length=100, required=False, allow_blank=True)
    income = IncomeDetailsSerializer(required=False)
    risk_profile = serializers.ChoiceField(choices=[("Conservative", "Conservative"), ("Moderate", "Moderate"), ("Aggressive", "Aggressive")], required=False)
    investment_goals = serializers.ListField(child=serializers.CharField(), required=False)
    tax_information = TaxInfoSerializer(required=False)
