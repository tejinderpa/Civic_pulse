/**
 * Punjab-region demo civic reports for analytics + maps.
 * Shared by mock data, SQL seed, and admin seed-demo API.
 *
 * Images: Unsplash (already allowlisted in next.config).
 */

export type DemoReportSeed = {
  /** Stable id for mock mode; DB inserts generate UUIDs */
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  priority_score: number;
  department: string;
  image_url: string;
  upvotes: number;
  /** Days ago for created_at relative timestamps */
  days_ago: number;
  hours_offset?: number;
  duplicate_of?: string | null;
};

/** 15 civic reports across major Punjab cities. */
export const PUNJAB_DEMO_REPORTS: DemoReportSeed[] = [
  {
    id: 'demo-pb-01',
    title: 'Deep pothole on Madhya Marg Sector 17',
    description:
      'Large pothole near the Sector 17 plaza is expanding after rains. Cars are swerving into the bus lane; two-wheelers keep skidding. Needs urgent PWD patching.',
    category: 'Road',
    location: 'Madhya Marg, Sector 17, Chandigarh, Punjab',
    latitude: 30.7415,
    longitude: 76.7781,
    status: 'In Progress',
    severity: 'High',
    priority_score: 86,
    department: 'PWD (Roads)',
    image_url:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=900&q=80',
    upvotes: 48,
    days_ago: 2,
  },
  {
    id: 'demo-pb-02',
    title: 'Overflowing garbage near Sarabha Nagar market',
    description:
      'Community bins outside the market have not been cleared for 6 days. Strong odour and stray animals. Residents request immediate sanitation pickup.',
    category: 'Garbage',
    location: 'Sarabha Nagar Market, Ludhiana, Punjab',
    latitude: 30.8912,
    longitude: 75.8465,
    status: 'Submitted',
    severity: 'Medium',
    priority_score: 58,
    department: 'Municipal Sanitation',
    image_url:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80',
    upvotes: 31,
    days_ago: 1,
  },
  {
    id: 'demo-pb-03',
    title: 'Water main burst flooding Civil Lines road',
    description:
      'Burst pipeline near Civil Lines is flooding the road and nearby shops. Water logging is knee-deep in spots. Critical — traffic blocked and risk of contamination.',
    category: 'Water',
    location: 'Civil Lines, Ludhiana, Punjab',
    latitude: 30.9124,
    longitude: 75.8468,
    status: 'Under Review',
    severity: 'Critical',
    priority_score: 96,
    department: 'Water & Sewerage Board',
    image_url:
      'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=900&q=80',
    upvotes: 92,
    days_ago: 0,
    hours_offset: 5,
  },
  {
    id: 'demo-pb-04',
    title: 'Street lights dark on Mall Road stretch',
    description:
      'Entire stretch of street lights between the railway station and bus stand is out. Area is pitch dark after 8pm and feels unsafe for pedestrians.',
    category: 'Electricity',
    location: 'Mall Road, Amritsar, Punjab',
    latitude: 31.6340,
    longitude: 74.8723,
    status: 'In Progress',
    severity: 'High',
    priority_score: 81,
    department: 'Electricity Department',
    image_url:
      'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=900&q=80',
    upvotes: 56,
    days_ago: 3,
  },
  {
    id: 'demo-pb-05',
    title: 'Broken zebra crossing near DAV School',
    description:
      'Pedestrian stripes near the school gate are almost invisible. Parents report near-misses during morning drop-off. High priority for child safety.',
    category: 'Road',
    location: 'Model Town, Jalandhar, Punjab',
    latitude: 31.3256,
    longitude: 75.5792,
    status: 'Submitted',
    severity: 'High',
    priority_score: 84,
    department: 'PWD (Roads)',
    image_url:
      'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=900&q=80',
    upvotes: 67,
    days_ago: 4,
  },
  {
    id: 'demo-pb-06',
    title: 'Low water pressure in NIT campus hostels',
    description:
      'Multiple hostels report very low water pressure during morning peak. Tanks empty by 9am. Please inspect supply line and booster pumps.',
    category: 'Water',
    location: 'NIT Jalandhar Campus, GT Road, Jalandhar, Punjab',
    latitude: 31.3959,
    longitude: 75.5354,
    status: 'Under Review',
    severity: 'Medium',
    priority_score: 52,
    department: 'Water & Sewerage Board',
    image_url:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80',
    upvotes: 24,
    days_ago: 5,
  },
  {
    id: 'demo-pb-07',
    title: 'Oil spill near Bidhipur railway crossing',
    description:
      'Slippery oil patch on the road near the railway crossing. Several two-wheelers skidded today. Hazard for commuters during peak hours.',
    category: 'Road',
    location: 'Bidhipur Crossing, Jalandhar, Punjab',
    latitude: 31.3728,
    longitude: 75.5182,
    status: 'In Progress',
    severity: 'High',
    priority_score: 83,
    department: 'PWD (Roads)',
    image_url:
      'https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=900&q=80',
    upvotes: 41,
    days_ago: 1,
    hours_offset: 14,
  },
  {
    id: 'demo-pb-08',
    title: 'Overloaded transformer sparking in Amanatpur',
    description:
      'Local transformer is making loud humming and occasional sparks in the evening. Residents fear a fire. Power cuts 4–5 times every night.',
    category: 'Electricity',
    location: 'Amanatpur, Jalandhar, Punjab',
    latitude: 31.3542,
    longitude: 75.5421,
    status: 'Submitted',
    severity: 'Critical',
    priority_score: 93,
    department: 'Electricity Department',
    image_url:
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=80',
    upvotes: 78,
    days_ago: 0,
    hours_offset: 8,
  },
  {
    id: 'demo-pb-09',
    title: 'Sewage overflow near Phagwara bus stand',
    description:
      'Sewage is overflowing onto the road and footpath near the bus stand. Strong stench and health risk for passengers and shopkeepers.',
    category: 'Water',
    location: 'Bus Stand Road, Phagwara, Punjab',
    latitude: 31.2240,
    longitude: 75.7708,
    status: 'Under Review',
    severity: 'High',
    priority_score: 88,
    department: 'Water & Sewerage Board',
    image_url:
      'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=900&q=80',
    upvotes: 53,
    days_ago: 2,
    hours_offset: 6,
  },
  {
    id: 'demo-pb-10',
    title: 'Illegal dumping behind Phase 7 industrial area',
    description:
      'Construction debris and household waste dumped illegally behind warehouses. Fire risk and mosquitoes. Need cleanup and fencing.',
    category: 'Garbage',
    location: 'Industrial Area Phase 7, Mohali, Punjab',
    latitude: 30.7046,
    longitude: 76.7179,
    status: 'Submitted',
    severity: 'Medium',
    priority_score: 55,
    department: 'Municipal Sanitation',
    image_url:
      'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=900&q=80',
    upvotes: 19,
    days_ago: 6,
  },
  {
    id: 'demo-pb-11',
    title: 'Fallen tree blocking Sector 35 cycle track',
    description:
      'A large branch fell after last night’s wind and is blocking the cycle track and half the footpath. Needs parks crew with chainsaw.',
    category: 'Environment',
    location: 'Sector 35-B, Chandigarh, Punjab',
    latitude: 30.7245,
    longitude: 76.7608,
    status: 'Resolved',
    severity: 'Medium',
    priority_score: 48,
    department: 'Parks & Environment',
    image_url:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80',
    upvotes: 22,
    days_ago: 9,
  },
  {
    id: 'demo-pb-12',
    title: 'Damaged speed breaker on GT Road Patiala',
    description:
      'Broken speed breaker near the university gate has sharp edges. Two-wheelers are getting punctures. Repair or repaint urgently.',
    category: 'Road',
    location: 'GT Road near Punjabi University, Patiala, Punjab',
    latitude: 30.3580,
    longitude: 76.3844,
    status: 'In Progress',
    severity: 'High',
    priority_score: 79,
    department: 'PWD (Roads)',
    image_url:
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80',
    upvotes: 37,
    days_ago: 3,
    hours_offset: 10,
  },
  {
    id: 'demo-pb-13',
    title: 'Open manhole without cover near Ranjit Avenue',
    description:
      'Manhole cover missing on a residential street. Extremely dangerous at night for walkers and cyclists. Please place a temporary barrier immediately.',
    category: 'Road',
    location: 'Ranjit Avenue, Amritsar, Punjab',
    latitude: 31.6372,
    longitude: 74.8605,
    status: 'Submitted',
    severity: 'Critical',
    priority_score: 97,
    department: 'PWD (Roads)',
    image_url:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
    upvotes: 104,
    days_ago: 0,
    hours_offset: 3,
  },
  {
    id: 'demo-pb-14',
    title: 'Park lights and benches vandalized in Sector 22',
    description:
      'Public park benches broken and some lights smashed. Families avoid the park after sunset. Request repair and better night patrols.',
    category: 'Environment',
    location: 'Sector 22 Park, Chandigarh, Punjab',
    latitude: 30.7338,
    longitude: 76.7792,
    status: 'Under Review',
    severity: 'Low',
    priority_score: 32,
    department: 'Parks & Environment',
    image_url:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    upvotes: 14,
    days_ago: 7,
  },
  {
    id: 'demo-pb-15',
    title: 'Chronic waterlogging outside Focal Point market',
    description:
      'Rainwater and drain overflow stay for days outside Focal Point shops. Slippery and mosquito breeding. Needs drain desilting and road camber fix.',
    category: 'Water',
    location: 'Focal Point, Ludhiana, Punjab',
    latitude: 30.8805,
    longitude: 75.8579,
    status: 'Submitted',
    severity: 'High',
    priority_score: 77,
    department: 'Water & Sewerage Board',
    image_url:
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=900&q=80',
    upvotes: 45,
    days_ago: 2,
    hours_offset: 18,
  },
];

/** Convert seed row → DB/cache-friendly report shape */
export function demoReportToRow(
  seed: DemoReportSeed,
  opts?: { userId?: string | null; fixedIds?: boolean }
): Record<string, unknown> {
  const hours = (seed.days_ago || 0) * 24 + (seed.hours_offset || 0);
  const created = new Date(Date.now() - hours * 60 * 60 * 1000);

  const row: Record<string, unknown> = {
    title: seed.title,
    description: seed.description,
    category: seed.category,
    location: seed.location,
    latitude: seed.latitude,
    longitude: seed.longitude,
    status: seed.status,
    severity: seed.severity,
    priority_score: seed.priority_score,
    department: seed.department,
    image_url: seed.image_url,
    upvotes: seed.upvotes,
    created_at: created.toISOString(),
    duplicate_of: seed.duplicate_of ?? null,
    task_force_id: null,
    resolved_at:
      seed.status === 'Resolved'
        ? new Date(created.getTime() + 36 * 60 * 60 * 1000).toISOString()
        : null,
  };

  if (opts?.fixedIds !== false) {
    row.id = seed.id;
  }
  if (opts?.userId) {
    row.user_id = opts.userId;
  }

  return row;
}

export function buildPunjabDemoRows(opts?: {
  userId?: string | null;
  fixedIds?: boolean;
}): Record<string, unknown>[] {
  return PUNJAB_DEMO_REPORTS.map((s) => demoReportToRow(s, opts));
}
