CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Station_city_trgm_idx" ON "Station" USING GIN ("city" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_fullName_trgm_idx" ON "User" USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Charger_stationId_type_idx" ON "Charger" ("stationId", "type");
