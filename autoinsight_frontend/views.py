from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
# Create your views here.
def view_index(request, template_name="index.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL})

def view_experiment(request, template_name="experiment.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL})

def view_overview(request, runtime_id, template_name="overview.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL, 'runtime_id':runtime_id})

def view_preprocess(request, runtime_id, template_name="preprocess.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL, 'runtime_id':runtime_id})

def view_leaderboard(request, runtime_id, template_name="leaderboard.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL, 'runtime_id':runtime_id})

def view_deploy(request, runtime_id, template_name="deploy.html"):
    return render(request, template_name, {'BACKEND_RESTAPI_URL': settings.BACKEND_RESTAPI_URL, 'runtime_id':runtime_id})