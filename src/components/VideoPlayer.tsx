/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

'use client';

import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'next/navigation';
import { Script } from '@/types/ContentDetail';
import {
  useCreateBookmark,
  useFetchBookmarksByContendId,
} from '@/api/hooks/useBookmarks';
import useUserLoginStatus from '@/api/hooks/useUserLoginStatus';
import { Check, X, BookmarkPlus, MessageSquarePlus } from 'lucide-react';
import { convertTime } from '@/lib/convertTime';
import { findCurrentSubtitleIndex } from '@/lib/findCurrentSubtitleIndex';
import { useToast } from '@/hooks/use-toast';
import useThrottling from '@/lib/useThrottling';
import LogInOutButton from './LogInOutButton';
import ControlBar from './ControlBar';
import SubtitleOption from './SubtitleOption';
import { ReactScriptPlayer } from './ReactScriptPlayer';
import { LanguageCode } from '../types/Scripts';
import BookmarkMemoItem from './BookmarkMemoItem';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import Modal from './Modal';
import EmptyAlert from './EmptyAlert';

type Mode = 'line' | 'block';

interface VideoPlayerProps {
  videoUrl: string;
  scriptsData: Script[] | undefined;
}

function VideoPlayer({ videoUrl, scriptsData }: VideoPlayerProps) {
  const params = useParams();
  const contentId = Number(params.id);

  const playerRef = useRef<ReactPlayer | null>(null);

  const [mode, setMode] = useState<Mode>('line');
  const availableLanguages: LanguageCode[] = ['enScript', 'koScript'];
  const [selectedLanguages, setSelectedLanguages] =
    useState<LanguageCode[]>(availableLanguages);
  const [currentTime, setCurrentTime] = useState(0);
  const [mounted, setMounted] = useState(false); // 추가: 마운트 상태 확인
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [playbackRate, setPlayBackRate] = useState(1);

  //  북마크 메모
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<
    number | null
  >(null);

  const { data: isLoginData } = useUserLoginStatus();
  const isLogin = isLoginData?.data; // 로그인 상태 확인
  const [showLoginModal, setShowLoginModal] = useState(false); // 권한 없을때 로그인 모달

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const { data: bookmarkData } = useFetchBookmarksByContendId(contentId);
  const createBookmarkMutation = useCreateBookmark(contentId);

  const { toast } = useToast(); // 토스트 알림에 사용할 훅

  useEffect(() => {
    setMounted(true); // 컴포넌트가 클라이언트에서 마운트되었음을 표시
  }, []);

  const handleProgress = (state: { playedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(
        (playerRef.current.getCurrentTime() || 0) + seconds,
        'seconds',
      );
    }
  };

  const seekTo = (timeInSeconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timeInSeconds, 'seconds');
    }
  };

  const BasicControlBarProps = {
    handlePlayPause,
    handleVolumeChange,
    handleSeekForward: () => handleSeek(10),
    handleSeekBackward: () => handleSeek(-10),
    isPlaying,
    volume,
    setPlayBackRate,
  };

  const currentSubtitleIndex =
    findCurrentSubtitleIndex(scriptsData, currentTime) ?? 0;

  const handleBookmark = () => {
    // 로그인 권한 없으면 로그인 모달 띄우기
    if (!isLogin) {
      setShowLoginModal(true);
      return;
    }
    // 로그인 권한 있을때만 아래 실행
    if (currentSubtitleIndex !== null && currentSubtitleIndex !== undefined) {
      if (
        bookmarkData?.data.bookmarkList.some(
          (bookmark) => bookmark.sentenceIndex === currentSubtitleIndex,
        )
      ) {
        toast({
          title: '이미 해당 시간에 북마크가 존재합니다.',
          duration: 1000,
        });
      }
      createBookmarkMutation.mutate({
        sentenceIndex: currentSubtitleIndex,
      });
    }
  };

  const handleMemo = () => {
    // 로그인 권한 없으면 로그인 모달 띄우기
    if (!isLogin) {
      setShowLoginModal(true);
      return;
    }
    // 로그인 권한 있을때만 아래 실행
    if (
      bookmarkData?.data.bookmarkList.some(
        (bookmark) => bookmark.sentenceIndex === currentSubtitleIndex,
      )
    ) {
      toast({
        title: '이미 해당 시간에 북마크가 존재합니다.',
        description: '북마크 아래 메모영역에 메모를 추가해주세요.',
        duration: 1000,
      });
    }
    if (currentSubtitleIndex !== null && currentSubtitleIndex !== undefined) {
      setSelectedSentenceIndex(currentSubtitleIndex);
      setNewNoteText('');
      setIsAddingNote(true);
      setIsPlaying(false);
    }
  };

  const handleSaveNewNote = () => {
    if (selectedSentenceIndex !== null) {
      createBookmarkMutation.mutate({
        sentenceIndex: selectedSentenceIndex,
        description: newNoteText,
      });
      setIsAddingNote(false); // Close new note input
      setIsPlaying(true); // Resume video playback
    }
  };

  const handleCancelNewNote = () => {
    setIsAddingNote(false);
    setIsPlaying(true);
  };
  // thorottle 적용
  const throttledHandleBookmark = useThrottling({
    buttonClicked: handleBookmark,
  });
  const throttledHandleMemo = useThrottling({
    buttonClicked: handleMemo,
  });

  // 클라이언트에서만 렌더링되도록 조건부 렌더링
  if (!mounted) return null;

  return (
    <div className="container mx-auto py-5 grid grid-cols-3 gap-4">
      {/* 비디오 플레이어 */}
      <div className="col-span-2 space-y-4">
        <Card>
          <CardContent className="p-0 h-[400px] relative rounded-xl overflow-hidden">
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              playing={isPlaying}
              width="100%"
              height="100%"
              onPlay={() => setIsPlaying(true)}
              onStart={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onProgress={handleProgress}
              volume={volume}
              controls={false}
              playbackRate={playbackRate}
              progressInterval={100}
            />
            <ControlBar
              playerRef={playerRef}
              BasicControlBarProps={BasicControlBarProps}
            />
          </CardContent>
        </Card>

        {/* 보기모드, 언어 옵션 */}
        <SubtitleOption
          mode={mode}
          selectedLanguages={selectedLanguages}
          setMode={setMode}
          setSelectedLanguages={setSelectedLanguages}
        />

        {/* 자막 컨테이너 */}
        <ReactScriptPlayer
          mode={mode}
          subtitles={scriptsData || []}
          selectedLanguages={selectedLanguages}
          seekTo={seekTo}
          currentTime={currentTime}
          onClickSubtitle={(subtitle, index) => {
            console.log(subtitle, index);
          }}
          onSelectWord={(word, subtitle, index) => {
            console.log(word, subtitle, index);
          }}
          bookmarkedIndices={
            bookmarkData && bookmarkData?.data.bookmarkList.length > 0
              ? bookmarkData.data.bookmarkList.map(
                  (bookmark) => bookmark.sentenceIndex,
                )
              : []
          }
        />
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="로그인이 필요합니다."
          description="이 기능을 이용하려면 로그인이 필요해요! "
        >
          <div className="flex justify-center gap-4 mt-4">
            <LogInOutButton />
          </div>
        </Modal>
      )}

      {/* 북마크 메모 패널 */}
      <div className="col-span-1">
        <Card className="h-full flex flex-col justify-between p-4 bg-violet-100">
          <CardHeader className="p-0">
            <CardTitle className="text-xl">Bookmarks & Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[560px] mb-4 rounded-lg">
              {/* TODO(@smosco): 메모 컴포넌트랑 거의 동일 분리 해야함 */}
              {isAddingNote && selectedSentenceIndex !== null && (
                <div className="mb-4 p-2 bg-white rounded-lg">
                  <div className="flex flex-col justify-between items-start mb-2">
                    <Button
                      variant="secondary"
                      className="rounded-full h-6 px-3 bg-violet-100 text-violet-700 hover:bg-violet-200"
                    >
                      {scriptsData?.[selectedSentenceIndex]
                        ?.startTimeInSecond &&
                        convertTime(
                          scriptsData[selectedSentenceIndex].startTimeInSecond,
                        )}
                    </Button>
                    <p className="text-[14px] text-gray-600 mt-1">
                      {scriptsData?.[selectedSentenceIndex]?.enScript ||
                        '문장 없음'}
                    </p>
                  </div>
                  <div className="flex flex-col pl-4 border-l-2 border-purple-700">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="메모를 입력해주세요."
                      className="min-h-5 w-[180px] border-none outline-none p-0 mr-6 bg-transparent text-[14px] font-[500]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelNewNote}
                    >
                      <X className="h-4 w-4 mr-2" /> 취소
                    </Button>
                    <Button onClick={handleSaveNewNote} size="sm">
                      <Check className="h-4 w-4 mr-2" /> 저장
                    </Button>
                  </div>
                </div>
              )}
              {bookmarkData && bookmarkData.data.bookmarkList.length > 0
                ? bookmarkData.data.bookmarkList.map((bookmark) => {
                    const subtitle = scriptsData?.[bookmark.sentenceIndex];
                    return (
                      <BookmarkMemoItem
                        key={bookmark.bookmarkId}
                        bookmark={bookmark}
                        subtitle={subtitle}
                        seekTo={seekTo}
                      />
                    );
                  })
                : !selectedSentenceIndex && ( // 메모 저장이 안 되었어도 '메모추가' 버튼 누르는 순간부터 북마크가 없다는 메세지는 안 보여야함
                    <EmptyAlert alertDescription="북마크가 없습니다." />
                  )}
            </ScrollArea>
          </CardContent>
          <div className="flex flex-col gap-2 justify-between items-center lg:flex-row">
            <Button onClick={throttledHandleBookmark} className="w-full ">
              <BookmarkPlus size={20} className="mr-2" />
              북마크
            </Button>
            <Button onClick={throttledHandleMemo} className="w-full">
              <MessageSquarePlus size={20} className="mr-2" />
              메모 추가
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default VideoPlayer;
