# DB

## 개요

데이터베이스 스키마, 마이그레이션, 쿼리 최적화 디렉토리

## 구조

데이터베이스 설정, 마이그레이션 스크립트, 쿼리 최적화, 인덱싱 전략 등이 포함됩니다.

## 주요 항목

- [ ] 스키마 정의
- [ ] 마이그레이션 스크립트
- [ ] 쿼리 최적화
- [ ] 지원 스크립트
- [ ] 백업 전략
- [ ] 복구 절차

## 담당 에이전트

Database Agent (AGENTS/db-agent.md)

## 관련 문서

- [Database Documentation](../Docs/db/)
- [Architecture Documentation](../Docs/architecture/)

## Manual Migration

- File: `DB/migrations/20260413_add_students_education_level.sql`
- Purpose: add `students.education_level` (nullable, default `"기타"`)
- Apply this SQL to existing databases before deploying backend changes.
