from django.conf.urls import include, url
from website import views

# urls here will all be prefixed with analysis/

urlpatterns = [
    url(r'^old-district-report-cards/$', views.district_analysis, name='district_analysis'),
    url(r'^$', views.district_analysis_2_0, name='district_analysis_2_0'),
    url(r'^website_index/$', views.website_index, name='website_index'),
    url(r'^district-poster/$', views.district_analysis_poster, name='district_analysis_poster'),
    url(r'^district/detail/$', views.district_detail_analysis, name='district_detail_analysis'),

]


