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
    readableAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      name?: string;
      title?: {
        en?: string;
        'pt-br'?: string;
      };
      fileName?: string;
    };
  }>;
}

interface UseRecentChaptersResult {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  totalChapters: number;
}

// Hook PRINCIPAL - busca capítulos mais recentes
export const useRecentChapters = (limit: number = 25, offset: number = 0): UseRecentChaptersResult => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalChapters, setTotalChapters] = useState(0);

  useEffect(() => {
    const fetchRecentChapters = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/chapter', {
          params: {
            translatedLanguage: ['pt-br'],
            order: { 
              publishAt: 'desc', // MAIS NOVOS PRIMEIRO
            },
            includes: ['manga', 'scanlation_group', 'cover_art'],
            limit,
            offset,
            contentRating: ['safe', 'suggestive', 'erotica']
          }
        });

        const chaptersData = response.data.data;
        
        // Já vem ordenado da API, mas garantimos a ordem
        const sortedChapters = chaptersData.sort((a: Chapter, b: Chapter) => {
          return new Date(b.attributes.publishAt).getTime() - new Date(a.attributes.publishAt).getTime();
        });

        setChapters(sortedChapters);
        setTotalChapters(response.data.total || chaptersData.length);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Erro ao carregar capítulos');
        setLoading(false);
      }
    };

    fetchRecentChapters();
  }, [limit, offset]);

  return {
    chapters,
    loading,
    error,
    totalChapters
  };
};

// Hook para verificar se um capítulo é novo (últimos 7 dias)
export const useIsNewChapter = (publishDate: string): boolean => {
  const chapterDate = new Date(publishDate);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return chapterDate > sevenDaysAgo;
};