from django.urls import path
from apps.accounting.views import (
    IncomeListView,
    ExpenseListView,
    FinancialStatementsView,
    GenerateInvoiceView,
    GenerateReceiptView
)

urlpatterns = [
    path("income", IncomeListView.as_view(), name="income_list"),
    path("expenses", ExpenseListView.as_view(), name="expense_list"),
    path("statements", FinancialStatementsView.as_view(), name="financial_statements"),
    path("invoice/generate", GenerateInvoiceView.as_view(), name="generate_invoice"),
    path("receipt/generate", GenerateReceiptView.as_view(), name="generate_receipt"),
]
