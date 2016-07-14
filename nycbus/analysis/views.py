from django.shortcuts import render


# TransitCenter Analysis Tool Views 

def analysis_Index(request):
	return render(request, 'analysis/index.html', {})