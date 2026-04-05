from collections import defaultdict
from datetime import datetime, date
from dateutil.relativedelta import relativedelta


class BudgetAnalyticsService:
    def __init__(self, firestore_service):
        self.db = firestore_service

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _all_entries(self) -> list[dict]:
        return self.db.list_collection("budget_entries")

    def _all_goals(self) -> list[dict]:
        return self.db.list_collection("budget_goals")

    def _entries_for_month(self, month: str) -> list[dict]:
        """Return entries whose date starts with YYYY-MM."""
        return [e for e in self._all_entries() if e.get("date", "").startswith(month)]

    def _month_label(self, offset: int) -> str:
        """Return a YYYY-MM string for today + offset months."""
        dt = date.today() + relativedelta(months=offset)
        return dt.strftime("%Y-%m")

    # ------------------------------------------------------------------
    # get_monthly_summary
    # ------------------------------------------------------------------

    def get_monthly_summary(self, month: str) -> dict:
        entries = self._entries_for_month(month)

        total_income = sum(e["amount"] for e in entries if e.get("entry_type") == "income")
        total_expenses = sum(e["amount"] for e in entries if e.get("entry_type") == "expense")
        total_savings = sum(e["amount"] for e in entries if e.get("entry_type") == "savings")

        net_savings = total_income - total_expenses
        savings_rate = round((net_savings / total_income * 100), 2) if total_income else 0.0

        return {
            "month": month,
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "total_savings": round(total_savings, 2),
            "net_savings": round(net_savings, 2),
            "savings_rate": savings_rate,
        }

    # ------------------------------------------------------------------
    # get_category_breakdown
    # ------------------------------------------------------------------

    def get_category_breakdown(self, entry_type: str, month: str) -> dict:
        entries = [
            e for e in self._entries_for_month(month)
            if e.get("entry_type") == entry_type
        ]

        totals: dict[str, float] = defaultdict(float)
        for e in entries:
            totals[e.get("category", "other")] += e["amount"]

        grand_total = sum(totals.values())

        breakdown = [
            {
                "category": cat,
                "amount": round(amt, 2),
                "percentage": round(amt / grand_total * 100, 2) if grand_total else 0.0,
            }
            for cat, amt in sorted(totals.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "month": month,
            "entry_type": entry_type,
            "total": round(grand_total, 2),
            "breakdown": breakdown,
        }

    # ------------------------------------------------------------------
    # get_spending_trends
    # ------------------------------------------------------------------

    def get_spending_trends(self, months: int = 6) -> dict:
        monthly_data = []

        for offset in range(-(months - 1), 1):
            month = self._month_label(offset)
            summary = self.get_monthly_summary(month)
            monthly_data.append({
                "month": month,
                "income": summary["total_income"],
                "expenses": summary["total_expenses"],
                "savings": summary["net_savings"],
                "savings_rate": summary["savings_rate"],
            })

        return {
            "periods": months,
            "data": monthly_data,
        }

    # ------------------------------------------------------------------
    # get_budget_health_score
    # ------------------------------------------------------------------

    def get_budget_health_score(self) -> dict:
        current_month = self._month_label(0)
        summary = self.get_monthly_summary(current_month)

        savings_rate = summary["savings_rate"]
        total_income = summary["total_income"]
        total_expenses = summary["total_expenses"]

        # Savings rate score (0-40 pts): target >= 20%
        savings_score = min(40, savings_rate * 2)

        # Expense ratio score (0-40 pts): expenses should be <= 80% of income
        if total_income:
            expense_ratio = total_expenses / total_income
            expense_score = max(0.0, 40 - (expense_ratio - 0.8) * 100) if expense_ratio > 0.8 else 40.0
        else:
            expense_score = 0.0

        # Recurring expense score (0-20 pts): penalise if >50% of expenses are recurring
        recurring_entries = [
            e for e in self._entries_for_month(current_month)
            if e.get("is_recurring") and e.get("entry_type") == "expense"
        ]
        recurring_total = sum(e["amount"] for e in recurring_entries)
        recurring_ratio = recurring_total / total_expenses if total_expenses else 0
        recurring_score = max(0.0, 20 - (recurring_ratio - 0.5) * 40) if recurring_ratio > 0.5 else 20.0

        score = round(savings_score + expense_score + recurring_score)

        if score >= 80:
            grade, advice = "A", "Excellent financial health. Keep it up."
        elif score >= 60:
            grade, advice = "B", "Good financial health. Look for ways to grow savings."
        elif score >= 40:
            grade, advice = "C", "Fair financial health. Reduce discretionary expenses."
        else:
            grade, advice = "D", "Needs attention. Review recurring commitments and cut non-essentials."

        return {
            "score": score,
            "grade": grade,
            "advice": advice,
            "components": {
                "savings_rate_score": round(savings_score, 2),
                "expense_control_score": round(expense_score, 2),
                "recurring_expense_score": round(recurring_score, 2),
            },
        }

    # ------------------------------------------------------------------
    # detect_anomalies
    # ------------------------------------------------------------------

    def detect_anomalies(self) -> list[dict]:
        current_month = self._month_label(0)

        # Build 3-month historical averages per category
        historical: dict[str, list[float]] = defaultdict(list)
        for offset in range(-3, 0):
            month = self._month_label(offset)
            for e in self._entries_for_month(month):
                if e.get("entry_type") == "expense":
                    historical[e.get("category", "other")].append(e["amount"])

        averages: dict[str, float] = {
            cat: sum(vals) / len(vals) for cat, vals in historical.items() if vals
        }

        # Compare current month totals to averages
        current_totals: dict[str, float] = defaultdict(float)
        for e in self._entries_for_month(current_month):
            if e.get("entry_type") == "expense":
                current_totals[e.get("category", "other")] += e["amount"]

        anomalies = []
        for cat, total in current_totals.items():
            avg = averages.get(cat)
            if avg and total > avg * 1.5:
                anomalies.append({
                    "category": cat,
                    "current_amount": round(total, 2),
                    "average_amount": round(avg, 2),
                    "overspend_ratio": round(total / avg, 2),
                    "reason": f"Spending in '{cat}' is {round((total / avg - 1) * 100)}% above 3-month average.",
                })

        return sorted(anomalies, key=lambda x: x["overspend_ratio"], reverse=True)

    # ------------------------------------------------------------------
    # forecast_next_month
    # ------------------------------------------------------------------

    def forecast_next_month(self) -> dict:
        # Average the last 3 months
        income_vals, expense_vals, savings_vals = [], [], []

        for offset in range(-3, 0):
            month = self._month_label(offset)
            summary = self.get_monthly_summary(month)
            income_vals.append(summary["total_income"])
            expense_vals.append(summary["total_expenses"])
            savings_vals.append(summary["net_savings"])

        def avg(vals):
            non_zero = [v for v in vals if v > 0]
            return round(sum(non_zero) / len(non_zero), 2) if non_zero else 0.0

        predicted_income = avg(income_vals)
        predicted_expenses = avg(expense_vals)
        predicted_savings = round(predicted_income - predicted_expenses, 2)

        next_month = self._month_label(1)

        return {
            "forecast_month": next_month,
            "predicted_income": predicted_income,
            "predicted_expenses": predicted_expenses,
            "predicted_savings": predicted_savings,
            "confidence": "low" if len(self._all_entries()) < 10 else "medium",
        }

    # ------------------------------------------------------------------
    # get_recurring_expenses
    # ------------------------------------------------------------------

    def get_recurring_expenses(self) -> list[dict]:
        today = date.today()
        recurring = [
            e for e in self._all_entries()
            if e.get("is_recurring") and e.get("entry_type") == "expense"
        ]

        frequency_delta = {
            "daily": relativedelta(days=1),
            "weekly": relativedelta(weeks=1),
            "monthly": relativedelta(months=1),
            "yearly": relativedelta(years=1),
        }

        results = []
        for e in recurring:
            freq = e.get("recurring_frequency", "monthly")
            delta = frequency_delta.get(freq, relativedelta(months=1))
            try:
                last_date = date.fromisoformat(e.get("date", str(today)))
                next_due = last_date + delta
            except ValueError:
                next_due = today

            results.append({
                "id": e.get("id"),
                "title": e.get("title"),
                "amount": e.get("amount"),
                "category": e.get("category"),
                "frequency": freq,
                "next_due": str(next_due),
                "overdue": next_due < today,
            })

        return sorted(results, key=lambda x: x["next_due"])

    # ------------------------------------------------------------------
    # compare_with_goals
    # ------------------------------------------------------------------

    def compare_with_goals(self) -> dict:
        goals = self._all_goals()
        current_month = self._month_label(0)

        category_spending: dict[str, float] = defaultdict(float)
        category_income: dict[str, float] = defaultdict(float)

        for e in self._entries_for_month(current_month):
            if e.get("entry_type") == "expense":
                category_spending[e.get("category", "other")] += e["amount"]
            elif e.get("entry_type") == "income":
                category_income[e.get("category", "other")] += e["amount"]

        progress = []
        for g in goals:
            cat = g.get("category", "other")
            goal_type = g.get("goal_type")
            target = g.get("target_amount", 0)

            if goal_type == "expense_limit":
                current = category_spending.get(cat, 0.0)
                remaining = max(0.0, target - current)
                pct = round(current / target * 100, 2) if target else 0.0
                on_track = current <= target
            else:  # savings
                current = g.get("current_amount", 0.0)
                remaining = max(0.0, target - current)
                pct = round(current / target * 100, 2) if target else 0.0
                on_track = pct >= 50

            progress.append({
                "goal_id": g.get("id"),
                "goal_type": goal_type,
                "category": cat,
                "target_amount": target,
                "current_amount": round(current, 2),
                "remaining": round(remaining, 2),
                "progress_pct": pct,
                "on_track": on_track,
                "status": g.get("status", "on_track"),
            })

        return {
            "month": current_month,
            "goals_count": len(goals),
            "on_track": sum(1 for p in progress if p["on_track"]),
            "at_risk": sum(1 for p in progress if not p["on_track"]),
            "progress": progress,
        }
