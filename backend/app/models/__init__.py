from app.database import Base, engine

# Import all model classes so SQLAlchemy knows about them
from app.models.user import User
from app.models.scholarship import Scholarship
#from app.models.application import Application
#from app.models.reviewer import Reviewer

# Create tables in the database if they don't exist yet
Base.metadata.create_all(bind=engine)
