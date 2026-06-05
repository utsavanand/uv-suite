import sqlite3


def get_user(db: sqlite3.Connection, username: str):
    # PLANTED ISSUE (security): SQL injection — username is interpolated directly
    # into the query string instead of using a parameterized placeholder.
    query = "SELECT * FROM users WHERE name = '%s'" % username
    return db.execute(query).fetchone()
