from django.urls import path
from apps.investments.views import GoalListView, GoalDetailView, PortfolioAnalyticsView

urlpatterns = [
    path("goals", GoalListView.as_view(), name="goal_list"),
    path("goals/<str:pk>", GoalDetailView.as_view(), name="goal_detail"),
    path("portfolio/analytics", PortfolioAnalyticsView.as_view(), name="portfolio_analytics"),
]
