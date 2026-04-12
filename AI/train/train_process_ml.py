from __future__ import annotations

from pathlib import Path
import sys

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from AI.utils.risk_utils import get_risk_level, get_risk_trend


FEATURE_COLUMNS = [
    "achievement_mean_7d",
    "adaptation_mean_7d",
    "relationship_mean_7d",
    "total_delta_7d",
]
TARGET_COLUMN = "label"
SPLIT_SAVE_COLUMNS = FEATURE_COLUMNS + [TARGET_COLUMN]


def split_train_test_by_student(
    df: pd.DataFrame,
    train_csv_path: Path,
    test_csv_path: Path,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    required_cols = {"student_id", *FEATURE_COLUMNS, TARGET_COLUMN}
    missing_cols = required_cols.difference(df.columns)
    if missing_cols:
        raise ValueError(f"Missing required columns: {sorted(missing_cols)}")

    student_labels = (
        df.groupby("student_id", as_index=False)[TARGET_COLUMN].nunique()
    )
    if not (student_labels[TARGET_COLUMN] == 1).all():
        raise ValueError("Each student_id must have exactly one fixed label.")

    student_label_df = (
        df.groupby("student_id", as_index=False)[TARGET_COLUMN].first()
    )

    train_students, test_students = train_test_split(
        student_label_df["student_id"],
        test_size=0.2,
        random_state=42,
        stratify=student_label_df[TARGET_COLUMN],
    )

    train_df = df[df["student_id"].isin(train_students)].copy()
    test_df = df[df["student_id"].isin(test_students)].copy()

    # Save only required training columns
    train_out = train_df[SPLIT_SAVE_COLUMNS].reset_index(drop=True)
    test_out = test_df[SPLIT_SAVE_COLUMNS].reset_index(drop=True)

    train_csv_path.parent.mkdir(parents=True, exist_ok=True)
    test_csv_path.parent.mkdir(parents=True, exist_ok=True)
    train_out.to_csv(train_csv_path, index=False, encoding="utf-8")
    test_out.to_csv(test_csv_path, index=False, encoding="utf-8")

    # Split validation
    train_unique = set(train_df["student_id"].unique())
    test_unique = set(test_df["student_id"].unique())
    assert len(train_unique) == 160
    assert len(test_unique) == 40
    assert train_unique.isdisjoint(test_unique)
    assert (
        student_label_df[student_label_df["student_id"].isin(train_unique)][
            TARGET_COLUMN
        ].value_counts().to_dict()
        == {0: 80, 1: 80}
    )
    assert (
        student_label_df[student_label_df["student_id"].isin(test_unique)][
            TARGET_COLUMN
        ].value_counts().to_dict()
        == {0: 20, 1: 20}
    )

    return train_out, test_out


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

    model = MLPClassifier(
        hidden_layer_sizes=(7,),
        activation="logistic",
        solver="adam",
        max_iter=1000,
        random_state=42,
    )
    model.fit(x_train_scaled, y_train)

    y_pred = model.predict(x_test_scaled)
    y_prob = model.predict_proba(x_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("=== Process ML Test Metrics ===")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"ROC-AUC  : {roc_auc:.4f}")

    model_path.parent.mkdir(parents=True, exist_ok=True)
    scaler_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Saved model : {model_path}")
    print(f"Saved scaler: {scaler_path}")


def main() -> None:
    base_dir = Path("AI")
    input_path = base_dir / "data" / "process_ml_features.csv"
    train_path = base_dir / "data" / "train.csv"
    test_path = base_dir / "data" / "test.csv"
    model_path = base_dir / "models" / "process_ml_model.pkl"
    scaler_path = base_dir / "models" / "process_ml_scaler.pkl"

    df = pd.read_csv(input_path)
    train_df, test_df = split_train_test_by_student(df, train_path, test_path)
    print(f"Saved train split: {train_path} ({len(train_df)} rows)")
    print(f"Saved test split : {test_path} ({len(test_df)} rows)")

    train_and_evaluate(train_df, test_df, model_path, scaler_path)


if __name__ == "__main__":
    main()
