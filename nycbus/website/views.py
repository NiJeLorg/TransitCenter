from django.shortcuts import render
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, JsonResponse

# ensure that folks are logged in to access some pages
from django.contrib.auth.decorators import login_required

# import all analysis models and forms
from website.models import *


# TransitCenter Public Website Views
def website_index(request):
	route = request.GET.get("route","None")
	if route == "None":
		routeId = "BX1"
	else:
		routeId = route
	return render(request, 'website/index.html', {'route':route, 'routeId':routeId})


def district_analysis(request):
	district = request.GET.get("district","assembly70")
	return render(request, 'website/district.html', {'district':district,})

def district_analysis_2_0(request):
	district = request.GET.get("district","assembly70")
	return render(request, 'website/district_2_0.html', {'district':district,})

def district_analysis_poster(request):
	district = request.GET.get("district","assembly70")
	return render(request, 'website/district_poster.html', {'district':district,})	

def district_detail_analysis(request):
	district = request.GET.get("district","citywide")
	return render(request, 'website/district_detail.html', {'district':district,})
