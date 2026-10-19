from django.urls import path
from apps.assets.views import (
    AssetListView,
    AssetDetailView,
    AssetFavoriteToggleView,
    RealEstateListView
)

urlpatterns = [
    path("", AssetListView.as_view(), name="asset_list"),
    path("real-estate/map", RealEstateListView.as_view(), name="real_estate_list"),
    path("<str:pk>", AssetDetailView.as_view(), name="asset_detail"),
    path("<str:pk>/favorite", AssetFavoriteToggleView.as_view(), name="asset_favorite"),
]
