from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
# Create your views here.
def view_index(request, template_name="index.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL})

def view_preprocess(request, template_name="preprocess.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL})

def view_leaderboard(request, template_name="leaderboard.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL})

def view_deploy(request, template_name="deploy.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL})