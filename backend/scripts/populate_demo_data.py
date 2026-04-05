"""
Populate the in-memory FirestoreService with realistic demo budget data.

Usage (from backend/):
    python -m scripts.populate_demo_data

The script imports the live singleton from app.core.dependencies, so the
data is available immediately in the same process.  Start uvicorn *after*
importing this module, or call populate() from your app startup for demos.
"""

from datetime import date
from dateutil.relativedelta import relativedelta
from uuid import uuid4

from app.core.dependencies import firestore_service


def _months_ago(n: int, day: int = 1) -> str:
    dt = date.today() + relativedelta(months=-n, day=day)
    return str(dt)


def _entry(
    title: str,
    amount: float,
    entry_type: str,
    category: str,
    entry_date: str,
    is_recurring: bool = False,
    recurring_frequency: str | None = None,
    notes: str | None = None,
) -> dict:
    return {
        "id": str(uuid4()),
        "title": title,
        "amount": amount,
        "entry_type": entry_type,
        "category": category,
        "date": entry_date,
        "is_recurring": is_recurring,
        "recurring_frequency": recurring_frequency,
        "notes": notes,
        "created_at": str(date.today()),
    }


def populate() -> None:
    entries = []

    # ------------------------------------------------------------------ #
    # 3 months ago
    # ------------------------------------------------------------------ #
    m3 = lambda day: _months_ago(3, day)  # noqa: E731

    entries += [
        # Income
        _entry("Monthly Salary",        3200.00, "income",  "salary",         m3(1),  True,  "monthly"),
        _entry("Freelance Project",       450.00, "income",  "other",          m3(12), False, None, "Logo design contract"),

        # Recurring expenses
        _entry("Rent",                  1200.00, "expense", "rent",            m3(1),  True,  "monthly"),
        _entry("Electric & Gas",         145.00, "expense", "utilities",       m3(3),  True,  "monthly"),
        _entry("Internet",                55.00, "expense", "utilities",       m3(3),  True,  "monthly"),
        _entry("Health Insurance",        80.00, "expense", "healthcare",      m3(5),  True,  "monthly"),

        # Variable expenses
        _entry("Grocery Run — Trader Joe's", 210.00, "expense", "food",        m3(4),  False),
        _entry("Grocery Run — Costco",       145.00, "expense", "food",        m3(14), False),
        _entry("Grocery Run — Safeway",       95.00, "expense", "food",        m3(24), False),
        _entry("Uber / Lyft rides",          115.00, "expense", "transportation", m3(8),  False),
        _entry("Gas",                         62.00, "expense", "transportation", m3(18), False),
        _entry("Dinner — Cheesecake Factory", 68.00, "expense", "food",        m3(10), False),
        _entry("Coffee & Lunches",            84.00, "expense", "food",        m3(20), False),
        _entry("Netflix + Spotify",           28.00, "expense", "entertainment", m3(5), True, "monthly"),
        _entry("Movie night",                 35.00, "expense", "entertainment", m3(16), False),
        _entry("Online Course — Udemy",      500.00, "expense", "education",   m3(2),  False, None, "Full-stack dev bootcamp"),
    ]

    # ------------------------------------------------------------------ #
    # 2 months ago
    # ------------------------------------------------------------------ #
    m2 = lambda day: _months_ago(2, day)  # noqa: E731

    entries += [
        # Income
        _entry("Monthly Salary",        3200.00, "income",  "salary",          m2(1),  True,  "monthly"),
        _entry("Investment Dividend",    120.00, "income",  "other",           m2(15), False, None, "Index fund dividend"),

        # Recurring expenses
        _entry("Rent",                  1200.00, "expense", "rent",            m2(1),  True,  "monthly"),
        _entry("Electric & Gas",         138.00, "expense", "utilities",       m2(3),  True,  "monthly"),
        _entry("Internet",                55.00, "expense", "utilities",       m2(3),  True,  "monthly"),
        _entry("Health Insurance",        80.00, "expense", "healthcare",      m2(5),  True,  "monthly"),

        # Variable expenses
        _entry("Grocery Run — Trader Joe's", 195.00, "expense", "food",        m2(5),  False),
        _entry("Grocery Run — Whole Foods",  160.00, "expense", "food",        m2(18), False),
        _entry("Grocery Run — Safeway",      110.00, "expense", "food",        m2(26), False),
        _entry("Bus pass",                    65.00, "expense", "transportation", m2(1), True, "monthly"),
        _entry("Uber rides",                  88.00, "expense", "transportation", m2(12), False),
        _entry("Dinner — Thai Palace",        52.00, "expense", "food",        m2(9),  False),
        _entry("Brunch outing",               74.00, "expense", "food",        m2(22), False),
        _entry("Netflix + Spotify",           28.00, "expense", "entertainment", m2(5), True, "monthly"),
        _entry("Concert tickets",            110.00, "expense", "entertainment", m2(19), False),
        _entry("Doctor visit co-pay",         40.00, "expense", "healthcare",  m2(11), False),
    ]

    # ------------------------------------------------------------------ #
    # Last month
    # ------------------------------------------------------------------ #
    m1 = lambda day: _months_ago(1, day)  # noqa: E731

    entries += [
        # Income
        _entry("Monthly Salary",        3200.00, "income",  "salary",          m1(1),  True,  "monthly"),
        _entry("Freelance — web update",  300.00, "income",  "other",           m1(8),  False),
        _entry("Investment Dividend",     135.00, "income",  "other",           m1(15), False, None, "Index fund dividend"),

        # Recurring expenses
        _entry("Rent",                  1200.00, "expense", "rent",            m1(1),  True,  "monthly"),
        _entry("Electric & Gas",         152.00, "expense", "utilities",       m1(3),  True,  "monthly"),
        _entry("Internet",                55.00, "expense", "utilities",       m1(3),  True,  "monthly"),
        _entry("Health Insurance",        80.00, "expense", "healthcare",      m1(5),  True,  "monthly"),

        # Variable expenses
        _entry("Grocery Run — Trader Joe's", 220.00, "expense", "food",        m1(3),  False),
        _entry("Grocery Run — Costco",       175.00, "expense", "food",        m1(15), False),
        _entry("Grocery Run — Safeway",       88.00, "expense", "food",        m1(27), False),
        _entry("Bus pass",                    65.00, "expense", "transportation", m1(1), True, "monthly"),
        _entry("Uber rides",                  72.00, "expense", "transportation", m1(20), False),
        _entry("Dinner — Sushi place",        90.00, "expense", "food",        m1(7),  False),
        _entry("Coffee & Lunches",            96.00, "expense", "food",        m1(17), False),
        _entry("Netflix + Spotify",           28.00, "expense", "entertainment", m1(5), True, "monthly"),
        _entry("Video game",                  60.00, "expense", "entertainment", m1(12), False),
        _entry("Gym membership",              45.00, "expense", "healthcare",  m1(1),  True,  "monthly"),
    ]

    # ------------------------------------------------------------------ #
    # Current month (partial)
    # ------------------------------------------------------------------ #
    today = str(date.today())
    m0 = lambda day: _months_ago(0, day)  # noqa: E731

    entries += [
        _entry("Monthly Salary",        3200.00, "income",  "salary",          m0(1),  True,  "monthly"),
        _entry("Rent",                  1200.00, "expense", "rent",            m0(1),  True,  "monthly"),
        _entry("Electric & Gas",         141.00, "expense", "utilities",       m0(3),  True,  "monthly"),
        _entry("Internet",                55.00, "expense", "utilities",       m0(3),  True,  "monthly"),
        _entry("Health Insurance",        80.00, "expense", "healthcare",      m0(5),  True,  "monthly"),
        _entry("Grocery Run",            185.00, "expense", "food",            m0(4),  False),
        _entry("Netflix + Spotify",       28.00, "expense", "entertainment",   m0(5),  True,  "monthly"),
        _entry("Gym membership",          45.00, "expense", "healthcare",      m0(1),  True,  "monthly"),
        _entry("Bus pass",                65.00, "expense", "transportation",  m0(1),  True,  "monthly"),
    ]

    for entry in entries:
        firestore_service.create("budget_entries", entry)

    # ------------------------------------------------------------------ #
    # Budget goals
    # ------------------------------------------------------------------ #
    end_of_year = f"{date.today().year}-12-31"
    goals = [
        {
            "id": str(uuid4()),
            "goal_type": "savings",
            "category": "savings",
            "target_amount": 5000.00,
            "current_amount": 1200.00,
            "deadline": end_of_year,
            "status": "on_track",
        },
        {
            "id": str(uuid4()),
            "goal_type": "expense_limit",
            "category": "food",
            "target_amount": 600.00,
            "current_amount": 0.0,
            "deadline": end_of_year,
            "status": "on_track",
        },
        {
            "id": str(uuid4()),
            "goal_type": "expense_limit",
            "category": "entertainment",
            "target_amount": 150.00,
            "current_amount": 0.0,
            "deadline": end_of_year,
            "status": "on_track",
        },
    ]

    for goal in goals:
        firestore_service.create("budget_goals", goal)

    total_entries = len(entries)
    total_goals = len(goals)
    print(f"Demo data loaded: {total_entries} budget entries, {total_goals} goals.")


if __name__ == "__main__":
    populate()
    print("Done.")
