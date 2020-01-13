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

app_name = "autoinsight_frontend"

urlpatterns = [
    path(r'', TemplateView.as_view(template_name="index.html")),
    path(r'preprocess', TemplateView.as_view(template_name="preprocess.html")),
    path(r'leaderboard', TemplateView.as_view(template_name="leaderboard.html")),
    path(r'deploy', TemplateView.as_view(template_name="deploy.html")),

    # old paths
    path(r'view_index', TemplateView.as_view(template_name="index.html")),
    path(r'view_preprocess', TemplateView.as_view(template_name="preprocess.html")),
    path(r'view_leaderboard', TemplateView.as_view(template_name="leaderboard.html")),
    path(r'view_deploy', TemplateView.as_view(template_name="deploy.html")),
]
