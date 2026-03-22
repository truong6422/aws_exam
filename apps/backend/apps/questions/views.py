"""
Questions views: certification list (public) and domain list (auth required).
"""
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Certification, Domain
from .serializers import CertificationSerializer, DomainSerializer


class CertificationListView(generics.ListAPIView):
    """GET /api/v1/questions/certifications/ — public list of all certifications."""

    queryset = Certification.objects.all()
    serializer_class = CertificationSerializer
    permission_classes = [AllowAny]


class DomainListView(generics.ListAPIView):
    """GET /api/v1/questions/certifications/<certification_id>/domains/ — auth required."""

    serializer_class = DomainSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Domain.objects.filter(
            certification_id=self.kwargs["certification_id"]
        ).select_related("certification")
