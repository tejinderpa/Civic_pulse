-- =============================================================================
-- CivicPulse: Punjab demo reports (15 rows) with Unsplash images
-- Run in Supabase SQL Editor. Safe to re-run: deletes prior demo batch by title.
-- Visible to citizens (public SELECT) and authorities (admin dashboard).
-- =============================================================================

-- Optional: clear previous demo batch by distinctive titles
DELETE FROM public.reports
WHERE title IN (
  'Deep pothole on Madhya Marg Sector 17',
  'Overflowing garbage near Sarabha Nagar market',
  'Water main burst flooding Civil Lines road',
  'Street lights dark on Mall Road stretch',
  'Broken zebra crossing near DAV School',
  'Low water pressure in NIT campus hostels',
  'Oil spill near Bidhipur railway crossing',
  'Overloaded transformer sparking in Amanatpur',
  'Sewage overflow near Phagwara bus stand',
  'Illegal dumping behind Phase 7 industrial area',
  'Fallen tree blocking Sector 35 cycle track',
  'Damaged speed breaker on GT Road Patiala',
  'Open manhole without cover near Ranjit Avenue',
  'Park lights and benches vandalized in Sector 22',
  'Chronic waterlogging outside Focal Point market'
);

INSERT INTO public.reports (
  title,
  description,
  category,
  location,
  latitude,
  longitude,
  status,
  severity,
  priority_score,
  department,
  image_url,
  upvotes,
  created_at,
  resolved_at
) VALUES
(
  'Deep pothole on Madhya Marg Sector 17',
  'Large pothole near the Sector 17 plaza is expanding after rains. Cars are swerving into the bus lane; two-wheelers keep skidding. Needs urgent PWD patching.',
  'Road',
  'Madhya Marg, Sector 17, Chandigarh, Punjab',
  30.7415, 76.7781,
  'In Progress', 'High', 86, 'PWD (Roads)',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=900&q=80',
  48,
  now() - interval '2 days',
  null
),
(
  'Overflowing garbage near Sarabha Nagar market',
  'Community bins outside the market have not been cleared for 6 days. Strong odour and stray animals. Residents request immediate sanitation pickup.',
  'Garbage',
  'Sarabha Nagar Market, Ludhiana, Punjab',
  30.8912, 75.8465,
  'Submitted', 'Medium', 58, 'Municipal Sanitation',
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
  31,
  now() - interval '1 day',
  null
),
(
  'Water main burst flooding Civil Lines road',
  'Burst pipeline near Civil Lines is flooding the road and nearby shops. Water logging is knee-deep in spots. Critical — traffic blocked and risk of contamination.',
  'Water',
  'Civil Lines, Ludhiana, Punjab',
  30.9124, 75.8468,
  'Under Review', 'Critical', 96, 'Water & Sewerage Board',
  'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=900&q=80',
  92,
  now() - interval '5 hours',
  null
),
(
  'Street lights dark on Mall Road stretch',
  'Entire stretch of street lights between the railway station and bus stand is out. Area is pitch dark after 8pm and feels unsafe for pedestrians.',
  'Electricity',
  'Mall Road, Amritsar, Punjab',
  31.6340, 74.8723,
  'In Progress', 'High', 81, 'Electricity Department',
  'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=900&q=80',
  56,
  now() - interval '3 days',
  null
),
(
  'Broken zebra crossing near DAV School',
  'Pedestrian stripes near the school gate are almost invisible. Parents report near-misses during morning drop-off. High priority for child safety.',
  'Road',
  'Model Town, Jalandhar, Punjab',
  31.3256, 75.5792,
  'Submitted', 'High', 84, 'PWD (Roads)',
  'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=900&q=80',
  67,
  now() - interval '4 days',
  null
),
(
  'Low water pressure in NIT campus hostels',
  'Multiple hostels report very low water pressure during morning peak. Tanks empty by 9am. Please inspect supply line and booster pumps.',
  'Water',
  'NIT Jalandhar Campus, GT Road, Jalandhar, Punjab',
  31.3959, 75.5354,
  'Under Review', 'Medium', 52, 'Water & Sewerage Board',
  'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80',
  24,
  now() - interval '5 days',
  null
),
(
  'Oil spill near Bidhipur railway crossing',
  'Slippery oil patch on the road near the railway crossing. Several two-wheelers skidded today. Hazard for commuters during peak hours.',
  'Road',
  'Bidhipur Crossing, Jalandhar, Punjab',
  31.3728, 75.5182,
  'In Progress', 'High', 83, 'PWD (Roads)',
  'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=900&q=80',
  41,
  now() - interval '1 day 14 hours',
  null
),
(
  'Overloaded transformer sparking in Amanatpur',
  'Local transformer is making loud humming and occasional sparks in the evening. Residents fear a fire. Power cuts 4–5 times every night.',
  'Electricity',
  'Amanatpur, Jalandhar, Punjab',
  31.3542, 75.5421,
  'Submitted', 'Critical', 93, 'Electricity Department',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=80',
  78,
  now() - interval '8 hours',
  null
),
(
  'Sewage overflow near Phagwara bus stand',
  'Sewage is overflowing onto the road and footpath near the bus stand. Strong stench and health risk for passengers and shopkeepers.',
  'Water',
  'Bus Stand Road, Phagwara, Punjab',
  31.2240, 75.7708,
  'Under Review', 'High', 88, 'Water & Sewerage Board',
  'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=900&q=80',
  53,
  now() - interval '2 days 6 hours',
  null
),
(
  'Illegal dumping behind Phase 7 industrial area',
  'Construction debris and household waste dumped illegally behind warehouses. Fire risk and mosquitoes. Need cleanup and fencing.',
  'Garbage',
  'Industrial Area Phase 7, Mohali, Punjab',
  30.7046, 76.7179,
  'Submitted', 'Medium', 55, 'Municipal Sanitation',
  'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=900&q=80',
  19,
  now() - interval '6 days',
  null
),
(
  'Fallen tree blocking Sector 35 cycle track',
  'A large branch fell after last night wind and is blocking the cycle track and half the footpath. Needs parks crew with chainsaw.',
  'Environment',
  'Sector 35-B, Chandigarh, Punjab',
  30.7245, 76.7608,
  'Resolved', 'Medium', 48, 'Parks & Environment',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80',
  22,
  now() - interval '9 days',
  now() - interval '7 days'
),
(
  'Damaged speed breaker on GT Road Patiala',
  'Broken speed breaker near the university gate has sharp edges. Two-wheelers are getting punctures. Repair or repaint urgently.',
  'Road',
  'GT Road near Punjabi University, Patiala, Punjab',
  30.3580, 76.3844,
  'In Progress', 'High', 79, 'PWD (Roads)',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80',
  37,
  now() - interval '3 days 10 hours',
  null
),
(
  'Open manhole without cover near Ranjit Avenue',
  'Manhole cover missing on a residential street. Extremely dangerous at night for walkers and cyclists. Please place a temporary barrier immediately.',
  'Road',
  'Ranjit Avenue, Amritsar, Punjab',
  31.6372, 74.8605,
  'Submitted', 'Critical', 97, 'PWD (Roads)',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
  104,
  now() - interval '3 hours',
  null
),
(
  'Park lights and benches vandalized in Sector 22',
  'Public park benches broken and some lights smashed. Families avoid the park after sunset. Request repair and better night patrols.',
  'Environment',
  'Sector 22 Park, Chandigarh, Punjab',
  30.7338, 76.7792,
  'Under Review', 'Low', 32, 'Parks & Environment',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
  14,
  now() - interval '7 days',
  null
),
(
  'Chronic waterlogging outside Focal Point market',
  'Rainwater and drain overflow stay for days outside Focal Point shops. Slippery and mosquito breeding. Needs drain desilting and road camber fix.',
  'Water',
  'Focal Point, Ludhiana, Punjab',
  30.8805, 75.8579,
  'Submitted', 'High', 77, 'Water & Sewerage Board',
  'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80',
  45,
  now() - interval '2 days 18 hours',
  null
);

-- Verify
SELECT count(*) AS punjab_demo_count
FROM public.reports
WHERE location ILIKE '%Punjab%';
