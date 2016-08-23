from django.conf.urls import include, url
from analysis import views

# urls here will all be prefixed with analysis/

urlpatterns = [
    url(r'^$', views.analysis_Index, name='analysis_Index'),
    url(r'^getVisSettings/$', views.analysis_getVisSettings, name='analysis_getVisSettings'),
    url(r'^test/$', views.analysis_Test, name='analysis_Test'),
    #url(r'^somethingHere/$', views.analysis_somethingHere, name='analysis_somethingHere'),

]


