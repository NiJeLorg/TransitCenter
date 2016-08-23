from django.shortcuts import render
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, JsonResponse

# ensure that folks are logged in to access some pages
from django.contrib.auth.decorators import login_required

# import all analysis models and forms
from analysis.models import *
#from analysis.forms import *

# TransitCenter Analysis Tool Views 

@login_required
def analysis_Index(request):
	return render(request, 'analysis/index.html', {})

@login_required
def analysis_Test(request):
	return render(request, 'analysis/test.html', {})	

@login_required
def analysis_Redirect(request):
	return HttpResponseRedirect(reverse('analysis_Index'))

def analysis_getVisSettings(request):
	response = {}

	if request.method == 'GET':

		datas = VisSettings.objects.filter(user=request.user)
		for data in datas:
			response[data.pk] = {}
			response[data.pk]['created'] = data.created
			response[data.pk]['user'] = data.user
			response[data.pk]['name'] = data.name
			response[data.pk]['vis'] = data.vis
			response[data.pk]['zoom'] = data.zoom
			response[data.pk]['center_lat'] = data.center_lat
			response[data.pk]['center_lon'] = data.center_lon
			response[data.pk]['public'] = data.public

	return JsonResponse(response)
