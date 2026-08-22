"""Verify PostgreSQL connectivity."""

from app.database.session import check_database_connection


def main() -> None:
    if check_database_connection():
        print("Database connection successful.")
    else:
        raise SystemExit("Database connection failed.")


if __name__ == "__main__":
    main()
