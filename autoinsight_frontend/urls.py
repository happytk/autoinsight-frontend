"""aidd URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = "autoinsight_frontend"

urlpatterns = [
    path(r'', views.view_index),
    path(r'experiment', views.view_experiment),
    path(r'preprocess/<int:runtime_id>/', views.view_preprocess),
    path(r'leaderboard/<int:runtime_id>/', views.view_leaderboard),
    path(r'deploy/<int:runtime_id>/', views.view_deploy),

]
