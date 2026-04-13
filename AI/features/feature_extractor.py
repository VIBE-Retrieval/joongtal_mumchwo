from __future__ import annotations

from pathlib import Path

import pandas as pd


OUTPUT_COLUMNS = [
    "student_id",
    "date",
    "achievement_mean_7d",
    "adaptation_mean_7d",
    "relationship_mean_7d",
    "total_delta_7d",
    "label",
]

FEATURE_COLUMNS = [
    "achievement_mean_7d",
    "adaptation_mean_7d",
    "relationship_mean_7d",
    "total_delta_7d",
]


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract process-ML input features from daily survey raw data.

    Input columns:
      student_id, survey_date, achievement_score, adaptation_score, relationship_score, label

    Output columns (fixed order):
      student_id, date, achievement_mean_7d, adaptation_mean_7d,
      relationship_mean_7d, total_delta_7d, label
    """
    required_cols = {
        "student_id",
        "survey_date",
        "achievement_score",
        "adaptation_score",
        "relationship_score",
        "label",
    }
    missing = required_cols.difference(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    working = df.copy()
    working["survey_date"] = pd.to_datetime(working["survey_date"])
    working = working.sort_values(["student_id", "survey_date"]).reset_index(drop=True)

    grouped = working.groupby("student_id", group_keys=False)

    working["achievement_mean_7d"] = grouped["achievement_score"].transform(
        lambda s: s.rolling(window=7, min_periods=7).mean()
    )
    working["adaptation_mean_7d"] = grouped["adaptation_score"].transform(
        lambda s: s.rolling(window=7, min_periods=7).mean()
    )
    working["relationship_mean_7d"] = grouped["relationship_score"].transform(
        lambda s: s.rolling(window=7, min_periods=7).mean()
    )

    working["_daily_avg"] = (
        working["achievement_score"]
        + working["adaptation_score"]
        + working["relationship_score"]
    ) / 3.0
    # total_delta_7d = daily_avg(last day in 7d window) - daily_avg(first day in 7d window), per student
    working["total_delta_7d"] = working["_daily_avg"] - working.groupby("student_id")[
        "_daily_avg"
    ].shift(6)

    feature_df = working.dropna(
        subset=[
            "achievement_mean_7d",
            "adaptation_mean_7d",
            "relationship_mean_7d",
            "total_delta_7d",
        ]
    ).copy()

    feature_df["date"] = feature_df["survey_date"].dt.strftime("%Y-%m-%d")
    feature_df = feature_df[OUTPUT_COLUMNS]

    # Assertions required by spec
    assert feature_df.columns.tolist() == OUTPUT_COLUMNS
    assert all(col in feature_df.columns for col in FEATURE_COLUMNS)
    assert feature_df["achievement_mean_7d"].between(1.0, 5.0).all()
    assert feature_df["total_delta_7d"].between(-4.0, 4.0).all()
    assert not feature_df.isna().any().any()
    assert set(feature_df["label"].unique()).issubset({0, 1})

    return feature_df


def main() -> None:
    input_path = Path("AI/data/daily_survey_dummy.csv")
    output_path = Path("AI/data/process_ml_features.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    raw_df = pd.read_csv(input_path)
    features_df = extract_features(raw_df)
    features_df.to_csv(output_path, index=False, encoding="utf-8")

    print(f"Saved: {output_path}")
    print(f"Rows: {len(features_df)}")
    print(f"Columns: {features_df.columns.tolist()}")


if __name__ == "__main__":
    main()
