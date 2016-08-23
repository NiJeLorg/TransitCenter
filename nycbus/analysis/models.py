from __future__ import unicode_literals

from django.db import models

from django.contrib.auth.models import User

# Create your models here.
class VisSettings(models.Model):
	created = models.DateTimeField(auto_now_add=True)
	user = models.ForeignKey(User)
	name = models.CharField(max_length=255, default='', null=False, blank=False)
	vis = models.URLField(max_length=255, default='', null=False, blank=False)
	zoom = models.IntegerField(default=11, null=False, blank=False)
	center_lat = models.FloatField(default=40.711093, null=False, blank=False)
	center_lon = models.FloatField(default=-73.982963, null=False, blank=False)
	public = models.BooleanField(default=False)

