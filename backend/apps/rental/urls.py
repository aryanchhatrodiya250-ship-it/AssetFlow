from django.urls import path
from apps.rental.views import (
    LeaseListView,
    LeaseDetailView,
    RecordRentPaymentView,
    RecordMaintenanceRequestView,
    RentalAnalyticsView
)

urlpatterns = [
    path("leases", LeaseListView.as_view(), name="lease_list"),
    path("leases/<str:pk>", LeaseDetailView.as_view(), name="lease_detail"),
    path("payments/record", RecordRentPaymentView.as_view(), name="record_payment"),
    path("maintenance/record", RecordMaintenanceRequestView.as_view(), name="record_maintenance"),
    path("analytics", RentalAnalyticsView.as_view(), name="rental_analytics"),
]
