from django.conf.urls import include, url
from website import views

# urls here will all be prefixed with analysis/

urlpatterns = [
    url(r'^$', views.website_Index, name='website_Index'),

]


