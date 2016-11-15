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
	district = request.GET.get("district","State Senate District 10")
	return render(request, 'website/district.html', {'district':district,})
