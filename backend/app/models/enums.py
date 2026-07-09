import enum


class UserRole(str, enum.Enum):
    TEAM_MEMBER = "team_member"
    MANAGER = "manager"
    ADMIN = "admin"


class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    LATE = "late"