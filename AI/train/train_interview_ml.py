from __future__ import annotations

from pathlib import Path
import sys

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from AI.utils.risk_utils import get_risk_level


RAW_FEATURE_COLUMNS = [
    "achievement_score",
    "achievement_problem_solving",
    "achievement_self_learning",
    "achievement_process_clarity",
    "adaptation_score",
    "adaptation_accepts_difficulty",
    "adaptation_persistence",
    "adaptation_strategy_variety",
    "relationship_score",
    "relationship_collaboration",
    "relationship_conflict_handling",
    "relationship_help_exchange",
]

ENGINEERED_FEATURE_COLUMNS = [
    "achievement_sub_mean",
    "adaptation_sub_mean",
    "relationship_sub_mean",
    "overall_interview_mean",
    "interview_balance_score",
]

FEATURE_COLUMNS = RAW_FEATURE_COLUMNS + ENGINEERED_FEATURE_COLUMNS
TARGET_COLUMN = "label"


def add_interview_features(df: pd.DataFrame) -> pd.DataFrame:
    required_cols = {"student_id", *RAW_FEATURE_COLUMNS, TARGET_COLUMN}
    missing_cols = required_cols.difference(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns: {sorted(missing_cols)}")

    out = df.copy()
    out["achievement_sub_mean"] = (
        out["achievement_problem_solving"]
        + out["achievement_self_learning"]
        + out["achievement_process_clarity"]
    ) / 3.0
    out["adaptation_sub_mean"] = (
        out["adaptation_accepts_difficulty"]
        + out["adaptation_persistence"]
        + out["adaptation_strategy_variety"]
    ) / 3.0
    out["relationship_sub_mean"] = (
        out["relationship_collaboration"]
        + out["relationship_conflict_handling"]
        + out["relationship_help_exchange"]
    ) / 3.0
    out["overall_interview_mean"] = (
        out["achievement_score"] + out["adaptation_score"] + out["relationship_score"]
    ) / 3.0
    out["interview_balance_score"] = out[
        ["achievement_score", "adaptation_score", "relationship_score"]
    ].std(axis=1, ddof=0)
    return out


def split_train_test_by_student(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    student_labels = df.groupby("student_id", as_index=False)[TARGET_COLUMN].nunique()
    if not (student_labels[TARGET_COLUMN] == 1).all():
        raise ValueError("Each student_id must have exactly one fixed label.")

    student_label_df = df.groupby("student_id", as_index=False)[TARGET_COLUMN].first()

    train_students, test_students = train_test_split(
        student_label_df["student_id"],
        test_size=0.2,
        random_state=42,
        stratify=student_label_df[TARGET_COLUMN],
    )

    train_df = df[df["student_id"].isin(train_students)].copy()
    test_df = df[df["student_id"].isin(test_students)].copy()

    assert len(train_df) == 240
    assert len(test_df) == 60
    return train_df, test_df


def train_and_evaluate(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    model_path: Path,
    scaler_path: Path,
) -> None:
    x_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN]
    x_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN]

    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(x_train_scaled, y_train)

    y_pred = model.predict(x_test_scaled)
    y_prob = model.predict_proba(x_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("=== Interview ML Test Metrics ===")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")

    test_probs = pd.DataFrame(
        {
            "student_id": test_df["student_id"].values,
            "actual_label": y_test.values,
            "dropout_risk_score": y_prob,
            "dropout_risk_level": [get_risk_level(float(v)) for v in y_prob],
        }
    ).sort_values("dropout_risk_score", ascending=False)
    print("\nTop 5 risk predictions on test:")
    print(test_probs.head(5).to_string(index=False))

    model_path.parent.mkdir(parents=True, exist_ok=True)
    scaler_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"\nSaved model : {model_path}")
    print(f"Saved scaler: {scaler_path}")


def main() -> None:
    base_dir = Path("AI")
    input_path = base_dir / "data" / "interview_assessment_dummy.csv"
    model_path = base_dir / "models" / "interview_ml_model.pkl"
    scaler_path = base_dir / "models" / "interview_ml_scaler.pkl"

    raw_df = pd.read_csv(input_path)
    full_df = add_interview_features(raw_df)
    train_df, test_df = split_train_test_by_student(full_df)
    train_and_evaluate(train_df, test_df, model_path, scaler_path)


if __name__ == "__main__":
    main()
