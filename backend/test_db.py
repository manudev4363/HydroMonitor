from sqlalchemy import text

from app.db.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connexion PostgreSQL réussie :", result.scalar())

except Exception as error:
    print("Erreur de connexion :", error)

finally:
    engine.dispose()