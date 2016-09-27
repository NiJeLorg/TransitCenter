from django.shortcuts import render
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, JsonResponse

# ensure that folks are logged in to access some pages
from django.contrib.auth.decorators import login_required

# import all analysis models and forms
from website.models import *

# TransitCenter Public Website Views 

def website_Index(request):
	routeId = request.GET.get("route","BX1")
	return render(request, 'website/index.html', {'routeId':routeId})
