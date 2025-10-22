import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mangadex.org',
});

interface MangaDetails {
  id: string;
  attributes: {
    title: {
      en?: string;
      'pt-br'?: string;
      [key: string]: string | undefined;
    };
    description: {
      en?: string;
      'pt-br'?: string;
      [key: string]: string | undefined;
    };
    status: string;
    tags: Array<{
      id: string;
      attributes: {
        name: {
          en: string;
        };
        group: string;
      };
    }>;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      name?: string;
      fileName?: string;
    };
  }>;
}

interface Chapter {
  id: string;
  attributes: {
    chapter: string;
    title: string | null;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      name?: string;
    };
  }>;
}

interface UseMangaDetailsResult {
  manga: MangaDetails | null;
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
}

export const useMangaDetails = (mangaId: string): UseMangaDetailsResult => {
  const [manga, setManga] = useState<MangaDetails | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mangaId) {
      setError('ID do mangá não fornecido');
      setLoading(false);
      return;
    }

    const fetchMangaData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar informações do mangá
        const [mangaRes, chaptersRes] = await Promise.all([
          api.get(`/manga/${mangaId}?includes[]=author&includes[]=artist&includes[]=cover_art`),
          api.get(`/manga/${mangaId}/feed`, {
            params: {
              translatedLanguage: ['pt-br'],
              order: { chapter: 'desc' },
              limit: 500,
              includes: ['scanlation_group']
            }
          })
        ]);

        const mangaData = mangaRes.data.data;
        setManga(mangaData);

        // Filtrar apenas capítulos em português e remover duplicatas
        const ptBrChapters = chaptersRes.data.data.filter((chapter: Chapter) => 
          chapter.attributes.translatedLanguage === 'pt-br'
        );

        // Remover capítulos duplicados (mesmo número de capítulo)
        const uniqueChapters = removeDuplicateChapters(ptBrChapters);
        setChapters(uniqueChapters);

        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Erro ao carregar mangá');
        setLoading(false);
      }
    };

    fetchMangaData();
  }, [mangaId]);

  return {
    manga,
    chapters,
    loading,
    error
  };
};

// Função para remover capítulos duplicados (mantém o mais recente)
const removeDuplicateChapters = (chapters: Chapter[]): Chapter[] => {
  const chapterMap = new Map<string, Chapter>();

  chapters.forEach(chapter => {
    const chapterNumber = chapter.attributes.chapter;
    const existingChapter = chapterMap.get(chapterNumber);

    if (!existingChapter || new Date(chapter.attributes.publishAt) > new Date(existingChapter.attributes.publishAt)) {
      chapterMap.set(chapterNumber, chapter);
    }
  });

  return Array.from(chapterMap.values()).sort((a, b) => 
    parseFloat(b.attributes.chapter) - parseFloat(a.attributes.chapter)
  );
};

// Hook para buscar apenas estatísticas do mangá (opcional)
export const useMangaStatistics = (mangaId: string) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mangaId) {
      setLoading(false);
      return;
    }

    const fetchStatistics = async () => {
      try {
        const response = await api.get(`/statistics/manga/${mangaId}`);
        setStatistics(response.data.statistics[mangaId]);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Erro ao carregar estatísticas');
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [mangaId]);

  return { statistics, loading, error };
};