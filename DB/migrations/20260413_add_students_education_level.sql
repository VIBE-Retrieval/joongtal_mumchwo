-- Add education_level column to students table.
-- Nullable for backward compatibility with existing rows.
-- Allowed values at application layer: 고졸 | 전문대졸 | 대졸 | 석사 | 기타

ALTER TABLE students
ADD COLUMN education_level VARCHAR(32) NULL DEFAULT '기타';

