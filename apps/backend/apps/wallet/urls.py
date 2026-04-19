from django.urls import path

from .views import TopUpRequestCreateView, TopUpRequestListView, WalletView

app_name = "wallet"

urlpatterns = [
    path("", WalletView.as_view(), name="wallet-detail"),
    path("topup/", TopUpRequestCreateView.as_view(), name="topup-create"),
    path("topup-requests/", TopUpRequestListView.as_view(), name="topup-list"),
]
