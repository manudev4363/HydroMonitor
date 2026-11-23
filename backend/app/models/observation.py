
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    String,
    Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UniqueConstraint

from app.db.base import Base


class Observation(Base):
    __tablename__ = "observations"

    __table_args__ = (
        UniqueConstraint(
            "station_id",
            "timestamp",
            "measurement_type",
            name="uq_observation_station_timestamp_type"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    station_id: Mapped[int] = mapped_column(
        ForeignKey("stations.id"),
        nullable=False,
        index=True
    )

    site_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )

    result: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    unit: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    measurement_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=False
    )

    method: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    qualification: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    station: Mapped["Station"] = relationship(
        back_populates="observations"
    )
