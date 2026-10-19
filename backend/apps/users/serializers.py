from rest_framework import serializers

ROLES = (
    ("Super Admin", "Super Admin"),
    ("Asset Manager", "Asset Manager"),
    ("Investment Advisor", "Investment Advisor"),
    ("Relationship Manager", "Relationship Manager"),
    ("Client", "Client"),
    ("Accountant", "Accountant"),
    ("Legal Team", "Legal Team"),
)

class UserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=ROLES, default="Client")
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    otp = serializers.CharField(max_length=6, required=False, allow_blank=True)
