'use client';

import ListeningPreviewCard from '@/components/ListeningPreviewCard';
import { useListeningContents } from '@/api/hooks/usePreview';
import ContentTypeFilter from '@/components/ContentTypeFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyAlert from '@/components/EmptyAlert';

function ListeningPage() {
  const {
    data: listeningContents,
    isLoading,
    isError,
    error,
  } = useListeningContents();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <p className="text-red-500">에러가 발생했습니다: {error.message}</p>;
  }

  if (!listeningContents || listeningContents.data.contents.length === 0) {
    return <EmptyAlert alertDescription="북마크가 없습니다." />;
  }

  return (
    <main>
      <ContentTypeFilter />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-7 mt-8">
        {listeningContents.data.contents.map((content) => (
          <ListeningPreviewCard key={content.contentId} data={content} />
        ))}
      </div>
    </main>
  );
}

export default ListeningPage;
