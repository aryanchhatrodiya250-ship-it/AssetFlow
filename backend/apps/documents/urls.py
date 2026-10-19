from django.urls import path
from apps.documents.views import DocumentListView, DocumentDetailView

urlpatterns = [
    path("", DocumentListView.as_view(), name="document_list"),
    path("<str:pk>", DocumentDetailView.as_view(), name="document_detail"),
]
