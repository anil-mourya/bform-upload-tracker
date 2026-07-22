-- B-Form Upload Tracker - Initial Data
-- Insert 56 societies across 3 batches
-- Created: 2026-07-22

-- ============================================================================
-- INSERT BATCH 1: 33 Societies (168BF - 200BF)
-- ============================================================================
INSERT INTO bform_societies (customer_id, society_name, batch_type, status, contact_email, contact_phone)
VALUES
    ('168BF', 'Riverside Housing Society', 'batch_1', 'active', 'contact@riverside-hs.org', '022-12345601'),
    ('169BF', 'Greenfield Cooperative Society', 'batch_1', 'active', 'info@greenfield-coop.org', '022-12345602'),
    ('170BF', 'Palmtree Residents Association', 'batch_1', 'active', 'admin@palmtree-ra.org', '022-12345603'),
    ('171BF', 'Downtown Living Complex', 'batch_1', 'active', 'contact@downtown-lc.org', '022-12345604'),
    ('172BF', 'Sunnydale Housing Trust', 'batch_1', 'active', 'info@sunnydale-ht.org', '022-12345605'),
    ('173BF', 'Lakeside Community Association', 'batch_1', 'active', 'admin@lakeside-ca.org', '022-12345606'),
    ('174BF', 'Metropolitan Residents Forum', 'batch_1', 'active', 'contact@metro-rf.org', '022-12345607'),
    ('175BF', 'Hillside Cooperative Housing', 'batch_1', 'active', 'info@hillside-ch.org', '022-12345608'),
    ('176BF', 'Garden Valley Society', 'batch_1', 'active', 'admin@garden-valley.org', '022-12345609'),
    ('177BF', 'Central Park Residents', 'batch_1', 'active', 'contact@central-park.org', '022-12345610'),
    ('178BF', 'Ocean View Housing Society', 'batch_1', 'active', 'info@ocean-view.org', '022-12345611'),
    ('179BF', 'Forest Heights Community', 'batch_1', 'active', 'admin@forest-heights.org', '022-12345612'),
    ('180BF', 'Skyline Towers Association', 'batch_1', 'active', 'contact@skyline-towers.org', '022-12345613'),
    ('181BF', 'Peaceful Haven Housing', 'batch_1', 'active', 'info@peaceful-haven.org', '022-12345614'),
    ('182BF', 'Meadowbrook Society', 'batch_1', 'active', 'admin@meadowbrook.org', '022-12345615'),
    ('183BF', 'Westend Residents Forum', 'batch_1', 'active', 'contact@westend-rf.org', '022-12345616'),
    ('184BF', 'Heritage Housing Complex', 'batch_1', 'active', 'info@heritage-hc.org', '022-12345617'),
    ('185BF', 'Sunrise Valley Community', 'batch_1', 'active', 'admin@sunrise-valley.org', '022-12345618'),
    ('186BF', 'Parkside Housing Association', 'batch_1', 'active', 'contact@parkside-ha.org', '022-12345619'),
    ('187BF', 'Victorian Apartments Society', 'batch_1', 'active', 'info@victorian-apts.org', '022-12345620'),
    ('188BF', 'Seaside Residents Club', 'batch_1', 'active', 'admin@seaside-rc.org', '022-12345621'),
    ('189BF', 'Marketplace Housing Forum', 'batch_1', 'active', 'contact@marketplace-hf.org', '022-12345622'),
    ('190BF', 'Crescent Moon Society', 'batch_1', 'active', 'info@crescent-moon.org', '022-12345623'),
    ('191BF', 'Valley View Housing Trust', 'batch_1', 'active', 'admin@valley-view.org', '022-12345624'),
    ('192BF', 'Riverside Gardens Community', 'batch_1', 'active', 'contact@riverside-gardens.org', '022-12345625'),
    ('193BF', 'Northside Cooperative', 'batch_1', 'active', 'info@northside-coop.org', '022-12345626'),
    ('194BF', 'Eastgate Residents Association', 'batch_1', 'active', 'admin@eastgate-ra.org', '022-12345627'),
    ('195BF', 'Sunset Hills Housing', 'batch_1', 'active', 'contact@sunset-hills.org', '022-12345628'),
    ('196BF', 'Brookside Manor Society', 'batch_1', 'active', 'info@brookside-manor.org', '022-12345629'),
    ('197BF', 'Willowbrook Community', 'batch_1', 'active', 'admin@willowbrook.org', '022-12345630'),
    ('198BF', 'Ashford Apartments Forum', 'batch_1', 'active', 'contact@ashford-apts.org', '022-12345631'),
    ('199BF', 'Bluebell Housing Association', 'batch_1', 'active', 'info@bluebell-ha.org', '022-12345632'),
    ('200BF', 'Cambridge Gardens Cooperative', 'batch_1', 'active', 'admin@cambridge-gardens.org', '022-12345633');

-- ============================================================================
-- INSERT BATCH 2: 7 Societies (232BF - 238BF)
-- ============================================================================
INSERT INTO bform_societies (customer_id, society_name, batch_type, status, contact_email, contact_phone)
VALUES
    ('232BF', 'Diamond Tower Residents', 'batch_2', 'active', 'contact@diamond-tower.org', '022-12345701'),
    ('233BF', 'Emerald Heights Society', 'batch_2', 'active', 'info@emerald-heights.org', '022-12345702'),
    ('234BF', 'Fortuna Gardens Housing', 'batch_2', 'active', 'admin@fortuna-gardens.org', '022-12345703'),
    ('235BF', 'Golden Era Community', 'batch_2', 'active', 'contact@golden-era.org', '022-12345704'),
    ('236BF', 'Harmony Towers Association', 'batch_2', 'active', 'info@harmony-towers.org', '022-12345705'),
    ('237BF', 'Iris Springs Housing Trust', 'batch_2', 'active', 'admin@iris-springs.org', '022-12345706'),
    ('238BF', 'Jasmine Court Residents', 'batch_2', 'active', 'contact@jasmine-court.org', '022-12345707');

-- ============================================================================
-- INSERT BATCH 3: 16 Societies (250BF - 265BF)
-- ============================================================================
INSERT INTO bform_societies (customer_id, society_name, batch_type, status, contact_email, contact_phone)
VALUES
    ('250BF', 'Kingsway Housing Complex', 'batch_3', 'active', 'contact@kingsway-hc.org', '022-12345801'),
    ('251BF', 'Lunar Park Community', 'batch_3', 'active', 'info@lunar-park.org', '022-12345802'),
    ('252BF', 'Maple Leaf Residents', 'batch_3', 'active', 'admin@maple-leaf.org', '022-12345803'),
    ('253BF', 'Noble Towers Society', 'batch_3', 'active', 'contact@noble-towers.org', '022-12345804'),
    ('254BF', 'Orchid Gardens Association', 'batch_3', 'active', 'info@orchid-gardens.org', '022-12345805'),
    ('255BF', 'Premier Heights Housing', 'batch_3', 'active', 'admin@premier-heights.org', '022-12345806'),
    ('256BF', 'Quantum Towers Forum', 'batch_3', 'active', 'contact@quantum-towers.org', '022-12345807'),
    ('257BF', 'Royal Park Cooperative', 'batch_3', 'active', 'info@royal-park.org', '022-12345808'),
    ('258BF', 'Starlight Communities', 'batch_3', 'active', 'admin@starlight-comm.org', '022-12345809'),
    ('259BF', 'Topaz Tower Residents', 'batch_3', 'active', 'contact@topaz-tower.org', '022-12345810'),
    ('260BF', 'Unity Gardens Housing', 'batch_3', 'active', 'info@unity-gardens.org', '022-12345811'),
    ('261BF', 'Vintage Heights Society', 'batch_3', 'active', 'admin@vintage-heights.org', '022-12345812'),
    ('262BF', 'Windsor Court Community', 'batch_3', 'active', 'contact@windsor-court.org', '022-12345813'),
    ('263BF', 'Xenon Towers Association', 'batch_3', 'active', 'info@xenon-towers.org', '022-12345814'),
    ('264BF', 'Yellowstone Housing Trust', 'batch_3', 'active', 'admin@yellowstone-ht.org', '022-12345815'),
    ('265BF', 'Zenith Springs Residents', 'batch_3', 'active', 'contact@zenith-springs.org', '022-12345816');

-- ============================================================================
-- INSERT SAMPLE DATA for demonstration (current year and last year)
-- ============================================================================
INSERT INTO bform_uploads (
    customer_id,
    batch_type,
    year,
    period,
    file_name,
    file_path,
    file_size,
    upload_date,
    status,
    uploaded_by,
    number_of_forms,
    checksum
)
VALUES
    -- Batch 1 sample uploads for current year
    ('168BF', 'batch_1', 2026, 'Q1', 'Riverside_Q1_2026.pdf', '/uploads/batch1/168BF_Q1_2026.pdf', 1024000, CURRENT_TIMESTAMP - INTERVAL '30 days', 'completed', 'admin@riverside-hs.org', 45, 'abc123def456'),
    ('169BF', 'batch_1', 2026, 'Q1', 'Greenfield_Q1_2026.pdf', '/uploads/batch1/169BF_Q1_2026.pdf', 956800, CURRENT_TIMESTAMP - INTERVAL '25 days', 'completed', 'admin@greenfield-coop.org', 38, 'def789ghi012'),
    ('170BF', 'batch_1', 2026, 'Q1', 'Palmtree_Q1_2026.pdf', '/uploads/batch1/170BF_Q1_2026.pdf', 1102400, CURRENT_TIMESTAMP - INTERVAL '20 days', 'processing', 'admin@palmtree-ra.org', 52, NULL),
    ('171BF', 'batch_1', 2026, 'Q1', 'Downtown_Q1_2026.pdf', '/uploads/batch1/171BF_Q1_2026.pdf', 892000, CURRENT_TIMESTAMP - INTERVAL '15 days', 'pending', 'admin@downtown-lc.org', 0, NULL),
    ('172BF', 'batch_1', 2026, 'Q1', 'Sunnydale_Q1_2026.pdf', '/uploads/batch1/172BF_Q1_2026.pdf', 1245600, CURRENT_TIMESTAMP - INTERVAL '10 days', 'completed', 'admin@sunnydale-ht.org', 61, 'jkl345mno678'),

    -- Batch 2 sample uploads for current year
    ('232BF', 'batch_2', 2026, 'Q1', 'Diamond_Q1_2026.pdf', '/uploads/batch2/232BF_Q1_2026.pdf', 1078400, CURRENT_TIMESTAMP - INTERVAL '28 days', 'completed', 'contact@diamond-tower.org', 48, 'pqr901stu234'),
    ('233BF', 'batch_2', 2026, 'Q1', 'Emerald_Q1_2026.pdf', '/uploads/batch2/233BF_Q1_2026.pdf', 1156800, CURRENT_TIMESTAMP - INTERVAL '22 days', 'completed', 'info@emerald-heights.org', 55, 'vwx567yza890'),
    ('234BF', 'batch_2', 2026, 'Q1', 'Fortuna_Q1_2026.pdf', '/uploads/batch2/234BF_Q1_2026.pdf', 934000, CURRENT_TIMESTAMP - INTERVAL '18 days', 'rejected', 'admin@fortuna-gardens.org', 0, NULL),

    -- Batch 3 sample uploads for current year
    ('250BF', 'batch_3', 2026, 'Q1', 'Kingsway_Q1_2026.pdf', '/uploads/batch3/250BF_Q1_2026.pdf', 1312000, CURRENT_TIMESTAMP - INTERVAL '26 days', 'completed', 'contact@kingsway-hc.org', 67, 'bcd234efg567'),
    ('251BF', 'batch_3', 2026, 'Q1', 'Lunar_Q1_2026.pdf', '/uploads/batch3/251BF_Q1_2026.pdf', 1089600, CURRENT_TIMESTAMP - INTERVAL '21 days', 'completed', 'info@lunar-park.org', 50, 'hij890klm123'),
    ('252BF', 'batch_3', 2026, 'Q1', 'Maple_Q1_2026.pdf', '/uploads/batch3/252BF_Q1_2026.pdf', 1197600, CURRENT_TIMESTAMP - INTERVAL '16 days', 'processing', 'admin@maple-leaf.org', 58, NULL),
    ('253BF', 'batch_3', 2026, 'Q1', 'Noble_Q1_2026.pdf', '/uploads/batch3/253BF_Q1_2026.pdf', 1024800, CURRENT_TIMESTAMP - INTERVAL '12 days', 'pending', 'contact@noble-towers.org', 0, NULL);

-- ============================================================================
-- CREATE SAMPLE SUMMARY RECORDS
-- ============================================================================
INSERT INTO bform_upload_summary (
    year,
    period,
    total_uploads,
    completed_uploads,
    pending_uploads,
    processing_uploads,
    rejected_uploads,
    archived_uploads,
    total_file_size,
    total_forms,
    last_upload_date,
    batch_completion_rate
)
VALUES
    (2026, 'Q1', 12, 7, 2, 2, 1, 0, 13121600, 574, CURRENT_TIMESTAMP - INTERVAL '10 days', 58.33),
    (2025, 'Q1', 45, 42, 0, 0, 3, 0, 46809600, 2187, '2025-03-31'::timestamp, 93.33),
    (2025, 'Q2', 48, 47, 0, 0, 1, 0, 49971200, 2341, '2025-06-30'::timestamp, 97.92),
    (2025, 'Q3', 50, 50, 0, 0, 0, 0, 51609600, 2476, '2025-09-30'::timestamp, 100.00),
    (2025, 'Q4', 56, 56, 0, 0, 0, 0, 58060800, 2653, '2025-12-31'::timestamp, 100.00);

-- ============================================================================
-- INSERT SAMPLE HISTORY RECORDS
-- ============================================================================
INSERT INTO bform_upload_history (upload_id, previous_status, new_status, changed_by, change_reason)
SELECT
    id,
    'pending',
    'processing',
    'system@bform-tracker.local',
    'Automatic status update'
FROM bform_uploads
WHERE status = 'processing'
ORDER BY created_at DESC
LIMIT 2;

INSERT INTO bform_upload_history (upload_id, previous_status, new_status, changed_by, change_reason)
SELECT
    id,
    'processing',
    'completed',
    'system@bform-tracker.local',
    'File successfully processed'
FROM bform_uploads
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 5;

INSERT INTO bform_upload_history (upload_id, previous_status, new_status, changed_by, change_reason)
SELECT
    id,
    'processing',
    'rejected',
    'admin@bform-tracker.local',
    'File validation failed: Missing mandatory forms'
FROM bform_uploads
WHERE status = 'rejected'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- VERIFY DATA INSERTION
-- ============================================================================
SELECT
    'Total Societies' as metric,
    COUNT(*)::text as value
FROM bform_societies
UNION ALL
SELECT
    'Total Batch 1 Societies',
    COUNT(*)::text
FROM bform_societies
WHERE batch_type = 'batch_1'
UNION ALL
SELECT
    'Total Batch 2 Societies',
    COUNT(*)::text
FROM bform_societies
WHERE batch_type = 'batch_2'
UNION ALL
SELECT
    'Total Batch 3 Societies',
    COUNT(*)::text
FROM bform_societies
WHERE batch_type = 'batch_3'
UNION ALL
SELECT
    'Total Uploads',
    COUNT(*)::text
FROM bform_uploads
UNION ALL
SELECT
    'Total History Records',
    COUNT(*)::text
FROM bform_upload_history
UNION ALL
SELECT
    'Summary Records',
    COUNT(*)::text
FROM bform_upload_summary;
