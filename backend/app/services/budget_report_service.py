import csv
import io
from collections import defaultdict
from datetime import date
from dateutil.relativedelta import relativedelta


class BudgetReportService:
    def __init__(self, firestore_service):
        self.db = firestore_service

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _all_entries(self) -> list[dict]:
        return self.db.list_collection("budget_entries")

    def _entries_for_month(self, month: str) -> list[dict]:
        return [e for e in self._all_entries() if e.get("date", "").startswith(month)]

    def _entries_for_year(self, year: str) -> list[dict]:
        return [e for e in self._all_entries() if e.get("date", "").startswith(year)]

    def _entries_in_range(self, start_date: str, end_date: str) -> list[dict]:
        return [
            e for e in self._all_entries()
            if start_date <= e.get("date", "") <= end_date
        ]

    def _sum_by_type(self, entries: list[dict], entry_type: str) -> float:
        return sum(e["amount"] for e in entries if e.get("entry_type") == entry_type)

    def _breakdown_by_category(self, entries: list[dict], entry_type: str) -> list[dict]:
        totals: dict[str, float] = defaultdict(float)
        for e in entries:
            if e.get("entry_type") == entry_type:
                totals[e.get("category", "other")] += e["amount"]
        grand = sum(totals.values())
        return sorted(
            [
                {
                    "category": cat,
                    "amount": round(amt, 2),
                    "percentage": round(amt / grand * 100, 2) if grand else 0.0,
                }
                for cat, amt in totals.items()
            ],
            key=lambda x: x["amount"],
            reverse=True,
        )

    def _prev_month(self, month: str) -> str:
        dt = date.fromisoformat(f"{month}-01") + relativedelta(months=-1)
        return dt.strftime("%Y-%m")

    # ------------------------------------------------------------------
    # generate_monthly_report
    # ------------------------------------------------------------------

    def generate_monthly_report(self, month: str) -> dict:
        entries = self._entries_for_month(month)
        prev_month = self._prev_month(month)
        prev_entries = self._entries_for_month(prev_month)

        total_income = self._sum_by_type(entries, "income")
        total_expenses = self._sum_by_type(entries, "expense")
        total_savings = self._sum_by_type(entries, "savings")
        net_savings = total_income - total_expenses
        savings_rate = round(net_savings / total_income * 100, 2) if total_income else 0.0

        prev_income = self._sum_by_type(prev_entries, "income")
        prev_expenses = self._sum_by_type(prev_entries, "expense")
        prev_net_savings = prev_income - prev_expenses

        expense_breakdown = self._breakdown_by_category(entries, "expense")
        income_breakdown = self._breakdown_by_category(entries, "income")
        top_5_expenses = sorted(
            [e for e in entries if e.get("entry_type") == "expense"],
            key=lambda x: x["amount"],
            reverse=True,
        )[:5]

        goals = self.db.list_collection("budget_goals")
        goal_progress = []
        expense_by_cat = {row["category"]: row["amount"] for row in expense_breakdown}
        for g in goals:
            target = g.get("target_amount", 0)
            cat = g.get("category", "other")
            if g.get("goal_type") == "expense_limit":
                current_amt = expense_by_cat.get(cat, 0.0)
            else:
                current_amt = g.get("current_amount", 0.0)
            goal_progress.append({
                "category": cat,
                "goal_type": g.get("goal_type"),
                "target_amount": target,
                "current_amount": round(current_amt, 2),
                "progress_pct": round(current_amt / target * 100, 2) if target else 0.0,
                "status": g.get("status", "on_track"),
            })

        def _pct_change(current, previous):
            if previous == 0:
                return None
            return round((current - previous) / previous * 100, 2)

        return {
            "month": month,
            "generated_at": str(date.today()),
            "income_summary": {
                "total": round(total_income, 2),
                "breakdown": income_breakdown,
                "vs_previous_month": _pct_change(total_income, prev_income),
            },
            "expense_summary": {
                "total": round(total_expenses, 2),
                "breakdown": expense_breakdown,
                "vs_previous_month": _pct_change(total_expenses, prev_expenses),
            },
            "top_5_expenses": [
                {
                    "title": e.get("title"),
                    "category": e.get("category"),
                    "amount": e.get("amount"),
                    "date": e.get("date"),
                }
                for e in top_5_expenses
            ],
            "savings_summary": {
                "net_savings": round(net_savings, 2),
                "explicit_savings": round(total_savings, 2),
                "savings_rate": savings_rate,
                "vs_previous_month": _pct_change(net_savings, prev_net_savings),
            },
            "goal_progress": goal_progress,
            "transaction_count": len(entries),
        }

    # ------------------------------------------------------------------
    # generate_yearly_report
    # ------------------------------------------------------------------

    def generate_yearly_report(self, year: str) -> dict:
        entries = self._entries_for_year(year)

        total_income = self._sum_by_type(entries, "income")
        total_expenses = self._sum_by_type(entries, "expense")
        total_savings = self._sum_by_type(entries, "savings")
        net_savings = total_income - total_expenses
        savings_rate = round(net_savings / total_income * 100, 2) if total_income else 0.0

        monthly_breakdown = []
        for month_num in range(1, 13):
            month = f"{year}-{month_num:02d}"
            month_entries = self._entries_for_month(month)
            income = self._sum_by_type(month_entries, "income")
            expenses = self._sum_by_type(month_entries, "expense")
            monthly_breakdown.append({
                "month": month,
                "income": round(income, 2),
                "expenses": round(expenses, 2),
                "net_savings": round(income - expenses, 2),
                "transaction_count": len(month_entries),
            })

        best_savings_month = max(monthly_breakdown, key=lambda m: m["net_savings"], default=None)
        worst_savings_month = min(monthly_breakdown, key=lambda m: m["net_savings"], default=None)

        return {
            "year": year,
            "generated_at": str(date.today()),
            "annual_summary": {
                "total_income": round(total_income, 2),
                "total_expenses": round(total_expenses, 2),
                "total_explicit_savings": round(total_savings, 2),
                "net_savings": round(net_savings, 2),
                "savings_rate": savings_rate,
                "transaction_count": len(entries),
            },
            "expense_breakdown": self._breakdown_by_category(entries, "expense"),
            "income_breakdown": self._breakdown_by_category(entries, "income"),
            "monthly_breakdown": monthly_breakdown,
            "highlights": {
                "best_savings_month": best_savings_month,
                "worst_savings_month": worst_savings_month,
                "avg_monthly_income": round(total_income / 12, 2),
                "avg_monthly_expenses": round(total_expenses / 12, 2),
            },
        }

    # ------------------------------------------------------------------
    # export_to_csv
    # ------------------------------------------------------------------

    def export_to_csv(self, start_date: str, end_date: str) -> str:
        entries = self._entries_in_range(start_date, end_date)
        entries_sorted = sorted(entries, key=lambda e: e.get("date", ""))

        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "id", "date", "title", "entry_type", "category",
                "amount", "is_recurring", "recurring_frequency", "notes", "created_at",
            ],
            extrasaction="ignore",
        )
        writer.writeheader()
        for e in entries_sorted:
            writer.writerow({
                "id": e.get("id", ""),
                "date": e.get("date", ""),
                "title": e.get("title", ""),
                "entry_type": e.get("entry_type", ""),
                "category": e.get("category", ""),
                "amount": e.get("amount", 0),
                "is_recurring": e.get("is_recurring", False),
                "recurring_frequency": e.get("recurring_frequency", ""),
                "notes": e.get("notes", ""),
                "created_at": e.get("created_at", ""),
            })

        return output.getvalue()
