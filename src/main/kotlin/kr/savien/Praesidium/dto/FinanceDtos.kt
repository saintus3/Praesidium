package kr.savien.Praesidium.dto

data class FinanceItemResponse(
    val id: Int,
    val kind: String,
    val description: String,
    val amount: Int,
    val editable: Boolean
)

data class FinanceSummaryResponse(
    val items: List<FinanceItemResponse>,
    val totalIncome: Long,
    val totalExpense: Long,
    val balance: Long
)

data class FinanceItemRequest(
    val kind: String,
    val description: String,
    val amount: Int
)
