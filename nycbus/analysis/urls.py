from django.conf.urls import include, url
from analysis import views

# urls here will all be prefixed with analysis/

urlpatterns = [
    url(r'^$', views.analysis_Index, name='analysis_Index'),
    #url(r'^somethingHere/$', views.analysis_somethingHere, name='analysis_somethingHere'),

]


