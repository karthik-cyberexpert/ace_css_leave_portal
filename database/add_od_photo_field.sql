-- Add photo_path column to od_requests table for optional photo uploads
-- This migration adds support for photo attachments during OD request submission

ALTER TABLE od_requests 
ADD COLUMN photo_path VARCHAR(500) DEFAULT NULL COMMENT 'Path to uploaded photo file for OD request';
