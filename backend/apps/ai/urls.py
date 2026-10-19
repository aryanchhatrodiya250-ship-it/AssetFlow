from django.urls import path
from apps.ai.views import AILiveSearchView, AIPredictionsView

urlpatterns = [
    path("search", AILiveSearchView.as_view(), name="ai_live_search"),
    path("predictions", AIPredictionsView.as_view(), name="ai_predictions"),
]
