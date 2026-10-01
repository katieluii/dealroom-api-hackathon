-- Fictional partners are configured as opted in for the team-view demonstration.
-- Real-user defaults remain private; this migration cannot match real firm/user IDs.
UPDATE "User" SET "shareWithFirm" = 1
WHERE "firmId" = 'mock-a' AND "id" IN ('mock-a-p1', 'mock-a-p2', 'mock-a-p3')
AND "email" IN ('mock-a-alex@example.test', 'mock-a-sam@example.test', 'mock-a-jo@example.test');
