# covers the optional "assign team members to projects" requirement

from sqlalchemy import Column, ForeignKey, Table

from app.models.base import Base

project_members = Table(
    "project_members",
    Base.metadata,
    Column("project_id", ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)
