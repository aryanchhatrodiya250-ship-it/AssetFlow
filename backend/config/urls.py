from django.urls import path, include

urlpatterns = [
    path("api/auth/", include("apps.users.urls")),
    path("api/clients/", include("apps.clients.urls")),
    path("api/assets/", include("apps.assets.urls")),
    path("api/rental/", include("apps.rental.urls")),
    path("api/investments/", include("apps.investments.urls")),
    path("api/accounting/", include("apps.accounting.urls")),
    path("api/crm/", include("apps.crm.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/", include("apps.core.urls")),
    path("api/documents/", include("apps.documents.urls")),
]
