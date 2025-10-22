import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mangadex.org',
});

interface Chapter {
  id: string;
  attributes: {
    chapter: string;
    title: string | null;
    publishAt: string;
  };
  relationships: any[];
}

interface PagesData {
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

interface UseChapterResult {
  chapter: Chapter | null;
  pages: PagesData | null;
  loading: boolean;
  error: string | null;
  adjacentChapters: {
    prev: string | null;
    next: string | null;
  };
}

export const useChapter = (chapterId: string | undefined, mangaId: string | undefined): UseChapterResult => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<PagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjacentChapters, setAdjacentChapters] = useState<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null
  });

  useEffect(() => {
    if (!chapterId) {
      setError('ID do capítulo não fornecido');
      setLoading(false);
      return;
    }

    const fetchChapterData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar informações do capítulo
        const chapterRes = await api.get(`/chapter/${chapterId}?includes[]=manga&includes[]=scanlation_group`);
        const chapterData = chapterRes.data.data;
        setChapter(chapterData);

        // Buscar páginas do capítulo
        const pagesRes = await api.get(`/at-home/server/${chapterId}`);
        setPages(pagesRes.data);

        // Buscar capítulos adjacentes se tiver mangaId
        if (mangaId) {
          await fetchAdjacentChapters(mangaId, chapterId);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Erro ao carregar capítulo');
        setLoading(false);
      }
    };

    const fetchAdjacentChapters = async (mangaId: string, currentChapterId: string) => {
      try {
        const response = await api.get(`/manga/${mangaId}/feed`, {
          params: {
            translatedLanguage: ['pt-br'],
            order: { chapter: 'asc' },
            limit: 500,
            includes: ['scanlation_group']
          }
        });

        const chapters = response.data.data;
        const currentIndex = chapters.findIndex((ch: Chapter) => ch.id === currentChapterId);

        setAdjacentChapters({
          prev: currentIndex > 0 ? chapters[currentIndex - 1].id : null,
          next: currentIndex < chapters.length - 1 ? chapters[currentIndex + 1].id : null
        });
      } catch (error) {
        console.error('Erro ao buscar capítulos adjacentes:', error);
      }
    };

    fetchChapterData();
  }, [chapterId, mangaId]);

  return {
    chapter,
    pages,
    loading,
    error,
    adjacentChapters
  };
};

// Hook para buscar apenas informações do capítulo (mais leve)
export const useChapterInfo = (chapterId: string | undefined) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
      setLoading(false);
      return;
    }

    const fetchChapterInfo = async () => {
      try {
        const response = await api.get(`/chapter/${chapterId}?includes[]=manga&includes[]=scanlation_group`);
        setChapter(response.data.data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Erro ao carregar informações do capítulo');
        setLoading(false);
      }
    };

    fetchChapterInfo();
  }, [chapterId]);

  return { chapter, loading, error };
};