# Process ML

## 1. 목적

과정 중 중도탈락 위험 예측

---

## 2. 구조

4 → 7 → 1

---

## 3. 입력

- achievement_mean_7d
- adaptation_mean_7d
- relationship_mean_7d
- total_delta_7d

---

## 4. 출력

- risk_score

---

## 5. 설정

- optimizer: Adam
- activation: sigmoid

---

## 6. 후처리

risk_level
risk_trend
