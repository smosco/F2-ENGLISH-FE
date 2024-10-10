'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import VideoPlayer from '@/components/VideoPlayer';

export default function DetailListeningPage() {
  return (
    <div className="flex">
      <div className="flex flex-col flex-1 gap-5 mx-auto p-5 pb-16 max-w-[800px]">
        <div>
          <Badge>카테고리</Badge>
          {/* <div className="font-bold text-2xl mt-2 mb-4">{Data.title}</div> */}
          <div className="text-sm flex justify-end w-full">조회수</div>
        </div>
        <Separator />
        <VideoPlayer />;
      </div>
    </div>
  );
}
