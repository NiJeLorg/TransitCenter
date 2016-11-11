from django.conf.urls import include, url
from website import views

# urls here will all be prefixed with analysis/

urlpatterns = [
    url(r'^$', views.website_index, name='website_index'),
    url(r'^district/$', views.district_analysis, name='district_analysis'),

]


