import React from 'react';
import { IssueCard, IssueCardProps } from '../ui/IssueCard';

const MOCK_ISSUES: IssueCardProps[] = [
  {
    id: '1',
    category: 'Road',
    status: 'In Progress',
    title: 'Hazardous pothole expanding on 5th Avenue',
    location: 'Downtown Main St.',
    upvotes: 142,
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
    timeAgo: '2 hours ago'
  },
  {
    id: '2',
    category: 'Garbage',
    status: 'Pending',
    title: 'Uncollected waste bins on Main & Elm',
    location: 'Central Park Overflow',
    upvotes: 89,
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
    timeAgo: '5 hours ago'
  },
  {
    id: '3',
    category: 'Water',
    status: 'Resolved',
    title: 'Burst pipe flooding local playground',
    location: 'Riverside Drive',
    upvotes: 256,
    imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=400',
    timeAgo: '1 day ago'
  },
  {
    id: '4',
    category: 'Electricity',
    status: 'In Progress',
    title: 'Streetlights failing on Oak Street',
    location: 'Tech Corridor',
    upvotes: 112,
    imageUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&q=80&w=400',
    timeAgo: '3 hours ago'
  },
];


export const FeaturedIssues = () => {
  return (
    <section className="py-24 bg-white border-y border-[#E2E8E4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A6B45] font-['Plus_Jakarta_Sans']">
          Recent Reports from Your City
        </h2>
        <p className="mt-4 text-xl text-gray-600 font-['DM_Sans']">See what your neighbors are prioritizing.</p>
      </div>
      
      {/* Hide scrollbar using standard CSS tailwind plugin approach, but since no tailwind config is edited yet, let's just use raw CSS class inline or a styled div */}
      <div className="w-full overflow-x-auto pb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Webkit scrollbar block */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scroll::-webkit-scrollbar {
            display: none;
          }
        `}} />
        <div className="flex gap-6 px-4 sm:px-6 lg:px-8 w-max hide-scroll max-w-[1400px] mx-auto md:mx-0 lg:ml-[calc((100vw-80rem)/2)] xl:ml-[calc((100vw-80rem)/2)]">
          {MOCK_ISSUES.map((issue, idx) => (
            <IssueCard key={idx} {...issue} />
          ))}
        </div>
      </div>
    </section>
  );
};
