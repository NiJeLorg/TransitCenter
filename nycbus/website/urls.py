from django.conf.urls import include, url
from website import views

# for creating district level pdfs
from django_pdfkit import PDFView

# urls here will all be prefixed with analysis/

urlpatterns = [
    url(r'^$', views.website_index, name='website_index'),
    url(r'^district/$', views.district_analysis, name='district_analysis'),
    url(r'^district-pdf/$', PDFView.as_view(template_name='website/district.html'), name='my-pdf'),

]


