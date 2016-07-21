from django.shortcuts import render
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect

# ensure that folks are logged in to access some pages
from django.contrib.auth.decorators import login_required


# TransitCenter Analysis Tool Views 

@login_required
def analysis_Index(request):
	return render(request, 'analysis/index.html', {})

@login_required
def analysis_Redirect(request):
	return HttpResponseRedirect(reverse('analysis_Index'))