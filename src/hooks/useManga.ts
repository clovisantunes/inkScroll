import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mangadex.org',
});

// Hook para busca de mangás COM CAPÍTULOS RECENTES
export const useSearchMangas = (title?: string) => {
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchMangas = async () => {
      if (!title || title.trim() === '') {
        setMangas([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Busca mangás
        const searchResponse = await api.get('/manga', {
          params: {
            title: title,
            availableTranslatedLanguage: ['pt-br'],
            includes: ['cover_art', 'author'],
            limit: 25,
            contentRating: ['safe', 'suggestive', 'erotica'],
            order: { relevance: 'desc' }
          }
        });

        const mangasData = searchResponse.data.data;

        // Para cada mangá, busca os 3 capítulos mais recentes
        const mangasWithChapters = await Promise.all(
          mangasData.map(async (manga: any) => {
            try {
              const chaptersResponse = await api.get(`/manga/${manga.id}/feed`, {
                params: {
                  translatedLanguage: ['pt-br'],
                  order: { chapter: 'desc' },
                  limit: 3,
                  includes: ['scanlation_group']
                }
              });

              return {
                ...manga,
                recentChaptersPTBR: chaptersResponse.data.data.slice(0, 3)
              };
            } catch (error) {
              return {
                ...manga,
                recentChaptersPTBR: []
              };
            }
          })
        );

        setMangas(mangasWithChapters);
      } catch (err: any) {
        setError('Erro ao buscar mangás');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMangas, 500);
    return () => clearTimeout(timeoutId);
  }, [title]);

  return { mangas, loading, error };
};

// Hook para mangás populares/recentes (para a Home)
export const useRecentMangasPTBR = (limit: number = 100) => { // Aumentei para 100
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Busca mangás mais recentes (com capítulos recentes)
        const response = await api.get('/manga', {
          params: {
            availableTranslatedLanguage: ['pt-br'],
            includes: ['cover_art', 'author'],
            limit: limit,
            contentRating: ['safe', 'suggestive', 'erotica'],
            order: { latestUploadedChapter: 'desc' } // Ordena por capítulo mais recente
          }
        });

        const mangasData = response.data.data;

        // Busca capítulos recentes para cada mangá
        const mangasWithChapters = await Promise.all(
          mangasData.map(async (manga: any) => {
            try {
              const chaptersResponse = await api.get(`/manga/${manga.id}/feed`, {
                params: {
                  translatedLanguage: ['pt-br'],
                  order: { chapter: 'desc' },
                  limit: 3, // Apenas os 3 capítulos mais recentes
                  includes: ['scanlation_group']
                }
              });

              return {
                ...manga,
                recentChaptersPTBR: chaptersResponse.data.data.slice(0, 3)
              };
            } catch (error) {
              return {
                ...manga,
                recentChaptersPTBR: []
              };
            }
          })
        );

        setMangas(mangasWithChapters);
      } catch (err) {
        setError('Erro ao carregar mangás recentes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMangas();
  }, [limit]);

  return { mangas, loading, error };
};