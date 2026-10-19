from django.urls import path
from apps.crm.views import (
    LeadListView,
    LeadDetailView,
    MeetingListView,
    MeetingDetailView,
    TaskListView,
    TaskDetailView
)

urlpatterns = [
    path("leads", LeadListView.as_view(), name="lead_list"),
    path("leads/<str:pk>", LeadDetailView.as_view(), name="lead_detail"),
    path("meetings", MeetingListView.as_view(), name="meeting_list"),
    path("meetings/<str:pk>", MeetingDetailView.as_view(), name="meeting_detail"),
    path("tasks", TaskListView.as_view(), name="task_list"),
    path("tasks/<str:pk>", TaskDetailView.as_view(), name="task_detail"),
]
