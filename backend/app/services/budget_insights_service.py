from collections import defaultdict
from datetime import date
from dateutil.relativedelta import relativedelta


class BudgetInsightsService:
    def __init__(self, firestore_service):
        self.db = firestore_service

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _entries_for_month(self, month: str) -> list[dict]:
        return [
            e for e in self.db.list_collection("budget_entries")
            if e.get("date", "").startswith(month)
        ]

    def _month_label(self, offset: int) -> str:
        dt = date.today() + relativedelta(months=offset)
        return dt.strftime("%Y-%m")

    def _totals_by_category(self, month: str, entry_type: str) -> dict[str, float]:
        totals: dict[str, float] = defaultdict(float)
        for e in self._entries_for_month(month):
            if e.get("entry_type") == entry_type:
                totals[e.get("category", "other")] += e["amount"]
        return dict(totals)

    def _total(self, month: str, entry_type: str) -> float:
        return sum(
            e["amount"] for e in self._entries_for_month(month)
            if e.get("entry_type") == entry_type
        )

    def _resolve_month(self, month: str | None) -> str:
        if month and len(month) >= 7 and month[4] == "-":
            try:
                y = int(month[:4])
                m = int(month[5:7])
                if 1 <= m <= 12:
                    return f"{y:04d}-{m:02d}"
            except ValueError:
                pass
        return date.today().strftime("%Y-%m")

    def _shift_month_str(self, ym: str, delta: int) -> str:
        y = int(ym[:4])
        mo = int(ym[5:7])
        d = date(y, mo, 1) + relativedelta(months=delta)
        return d.strftime("%Y-%m")

    def _total_income(self, month: str) -> float:
        """Sum all money-in rows (income, gift, scholarship) for the dashboard."""
        total = 0.0
        for e in self._entries_for_month(month):
            et = str(e.get("entry_type", "")).lower()
            if et in ("income", "gift", "scholarship"):
                total += float(e.get("amount", 0))
        return total

    # ------------------------------------------------------------------
    # generate_insights
    # ------------------------------------------------------------------

    def generate_insights(self, month: str | None = None) -> list[dict]:
        insights = []
        current = self._resolve_month(month)
        previous = self._shift_month_str(current, -1)

        current_income = self._total_income(current)
        current_expenses = self._total(current, "expense")
        prev_expenses = self._total(previous, "expense")
        net_savings = current_income - current_expenses

        # Savings achievement
        if current_income > 0 and net_savings > 0:
            insights.append({
                "type": "success",
                "message": f"Great job! You saved ${net_savings:,.2f} this month.",
                "category": "savings",
            })
        elif net_savings < 0:
            insights.append({
                "type": "warning",
                "message": f"You spent ${abs(net_savings):,.2f} more than you earned this month.",
                "category": "savings",
            })

        # Month-over-month expense change
        if prev_expenses > 0:
            change_pct = (current_expenses - prev_expenses) / prev_expenses * 100
            if change_pct >= 20:
                insights.append({
                    "type": "warning",
                    "message": f"Your total spending is up {change_pct:.0f}% compared to last month.",
                    "category": "expenses",
                })
            elif change_pct <= -10:
                insights.append({
                    "type": "success",
                    "message": f"You reduced spending by {abs(change_pct):.0f}% vs last month. Keep it up!",
                    "category": "expenses",
                })

        # Category-level month-over-month changes
        current_cats = self._totals_by_category(current, "expense")
        prev_cats = self._totals_by_category(previous, "expense")

        for cat, amount in current_cats.items():
            prev_amount = prev_cats.get(cat, 0)
            if prev_amount > 0:
                change = (amount - prev_amount) / prev_amount * 100
                if change >= 30:
                    insights.append({
                        "type": "warning",
                        "message": f"You spent {change:.0f}% more on {cat} this month (${amount:,.2f} vs ${prev_amount:,.2f} last month).",
                        "category": cat,
                    })

        # Rent / housing as % of income
        housing_amount = current_cats.get("rent", 0) + current_cats.get("utilities", 0)
        if current_income > 0 and housing_amount > 0:
            housing_pct = housing_amount / current_income * 100
            if housing_pct > 35:
                insights.append({
                    "type": "warning",
                    "message": f"Housing costs are {housing_pct:.0f}% of your income. Financial guidelines suggest staying under 35%.",
                    "category": "rent",
                })

        # Savings rate
        if current_income > 0:
            savings_rate = net_savings / current_income * 100
            if savings_rate >= 20:
                insights.append({
                    "type": "success",
                    "message": f"Your savings rate is {savings_rate:.0f}% — above the recommended 20%. Excellent discipline!",
                    "category": "savings",
                })
            elif 0 < savings_rate < 10:
                insights.append({
                    "type": "info",
                    "message": f"Your savings rate is {savings_rate:.0f}%. Aim for at least 20% to build a healthy financial cushion.",
                    "category": "savings",
                })

        # Goal progress
        goals = self.db.list_collection("budget_goals")
        for g in goals:
            target = g.get("target_amount", 0)
            current_amt = g.get("current_amount", 0)
            if target > 0:
                pct = current_amt / target * 100
                label = g.get("category", "goal")
                if pct >= 100:
                    insights.append({
                        "type": "success",
                        "message": f"You've completed your {label} goal of ${target:,.2f}!",
                        "category": label,
                    })
                elif pct >= 75:
                    insights.append({
                        "type": "info",
                        "message": f"You're {pct:.0f}% of the way to your {label} goal. Almost there!",
                        "category": label,
                    })
                elif g.get("goal_type") == "expense_limit":
                    actual = current_cats.get(label, 0)
                    if actual > target:
                        insights.append({
                            "type": "warning",
                            "message": f"You've exceeded your {label} budget limit of ${target:,.2f} (spent ${actual:,.2f}).",
                            "category": label,
                        })
                    else:
                        insights.append({
                            "type": "info",
                            "message": f"You're on track with your {label} budget — ${target - actual:,.2f} remaining.",
                            "category": label,
                        })

        return insights

    # ------------------------------------------------------------------
    # get_recommendations
    # ------------------------------------------------------------------

    def get_recommendations(self, month: str | None = None) -> list[dict]:
        recommendations = []
        current = self._resolve_month(month)

        current_income = self._total_income(current)
        current_expenses = self._total(current, "expense")
        current_cats = self._totals_by_category(current, "expense")
        net_savings = current_income - current_expenses

        # Entertainment overspend
        entertainment = current_cats.get("entertainment", 0)
        if current_income > 0 and entertainment / current_income > 0.1:
            recommendations.append({
                "priority": "high",
                "category": "entertainment",
                "message": "Consider reducing entertainment expenses — they exceed 10% of your income.",
                "potential_saving": round(entertainment * 0.3, 2),
            })

        # Subscription detection (recurring + entertainment/utilities)
        recurring_entries = [
            e for e in self.db.list_collection("budget_entries")
            if e.get("is_recurring") and e.get("entry_type") == "expense"
            and e.get("category") in ("entertainment", "utilities", "other")
        ]
        recurring_total = sum(e["amount"] for e in recurring_entries)
        if recurring_total > 100:
            recommendations.append({
                "priority": "medium",
                "category": "subscriptions",
                "message": f"You have ${recurring_total:,.2f}/month in recurring charges. Review subscriptions you no longer use.",
                "potential_saving": round(recurring_total * 0.25, 2),
            })

        # Automatic savings transfer
        if current_income > 0 and net_savings / current_income < 0.15:
            target_saving = round(current_income * 0.20 - max(net_savings, 0), 2)
            if target_saving > 0:
                recommendations.append({
                    "priority": "high",
                    "category": "savings",
                    "message": f"Set up an automatic transfer of ${target_saving:,.2f}/month to reach a 20% savings rate.",
                    "potential_saving": target_saving,
                })

        # Food overspend
        food = current_cats.get("food", 0)
        if current_income > 0 and food / current_income > 0.15:
            saving = round(food * 0.2, 2)
            recommendations.append({
                "priority": "medium",
                "category": "food",
                "message": f"Food costs are above 15% of income. Meal prepping or cooking at home could save ~${saving:,.2f}/month.",
                "potential_saving": saving,
            })

        # Transportation overspend
        transport = current_cats.get("transportation", 0)
        if current_income > 0 and transport / current_income > 0.15:
            saving = round(transport * 0.2, 2)
            recommendations.append({
                "priority": "medium",
                "category": "transportation",
                "message": f"Transportation is above 15% of income. Consider carpooling or public transit to save ~${saving:,.2f}/month.",
                "potential_saving": saving,
            })

        # Emergency fund nudge
        goals = self.db.list_collection("budget_goals")
        has_savings_goal = any(g.get("goal_type") == "savings" for g in goals)
        if not has_savings_goal:
            recommendations.append({
                "priority": "medium",
                "category": "savings",
                "message": "You don't have a savings goal set. Create one to track progress toward an emergency fund.",
                "potential_saving": 0,
            })

        # No income this month
        if current_income == 0:
            recommendations.append({
                "priority": "info",
                "category": "income",
                "message": "No income recorded this month. Add income entries to get accurate insights.",
                "potential_saving": 0,
            })

        return sorted(recommendations, key=lambda r: {"high": 0, "medium": 1, "info": 2}.get(r["priority"], 3))
