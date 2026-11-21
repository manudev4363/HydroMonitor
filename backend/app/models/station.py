
from sqlalchemy import Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    river: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    site_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    municipality_code: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True
    )

    municipality: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    is_active: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True
    )

    observations: Mapped[list["Observation"]] = relationship(
        back_populates="station"
    )
