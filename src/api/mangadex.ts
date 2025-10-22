import axios from "axios";

const api = axios.create({
  baseURL: "https://api.mangadex.org",
});

// Buscar mangás com capítulos RECENTES em PT-BR
export const getRecentMangasPTBR = async (limit: number = 20) => {
  try {
    // Primeiro, busca os capítulos mais recentes em PT-BR
    const chaptersRes = await api.get(
      `/chapter?translatedLanguage[]=pt-br&order[publishAt]=desc&limit=100&includes[]=manga`
    );
    
    const recentChapters = chaptersRes.data.data;
    
    if (recentChapters.length === 0) return [];
    
    // Extrai IDs únicos dos mangás dos capítulos recentes
    const mangaIds = new Set<string>();
    const chaptersByManga: { [key: string]: any[] } = {};
    
    recentChapters.forEach((chapter: any) => {
      const mangaId = chapter.relationships.find(
        (rel: any) => rel.type === "manga"
      )?.id;
      
      if (mangaId) {
        mangaIds.add(mangaId);
        
        if (!chaptersByManga[mangaId]) {
          chaptersByManga[mangaId] = [];
        }
        
        // Limita a 5 capítulos por mangá para não sobrecarregar
        if (chaptersByManga[mangaId].length < 5) {
          chaptersByManga[mangaId].push(chapter);
        }
      }
    });
    
    // Converte Set para Array e limita o número de mangás
    const uniqueMangaIds = Array.from(mangaIds).slice(0, limit);
    
    if (uniqueMangaIds.length === 0) return [];
    
    // Busca informações detalhadas dos mangás
    const mangaRes = await api.get(
      `/manga?ids[]=${uniqueMangaIds.join('&ids[]=')}&includes[]=cover_art&limit=${limit}`
    );
    
    const mangas = mangaRes.data.data;
    
    // Combina mangás com seus capítulos recentes
    return mangas.map((manga: any) => ({
      ...manga,
      recentChaptersPTBR: chaptersByManga[manga.id] || []
    }));
    
  } catch (error) {
    console.error("Erro ao buscar mangás recentes PT-BR:", error);
    return [];
  }
};

// Buscar mangás populares (mantido para compatibilidade)
export const getPopularMangasPTBR = async (limit: number = 20) => {
  try {
    const res = await api.get(
      `/manga?limit=${limit}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`
    );
    
    const mangas = res.data.data;
    
    if (mangas.length === 0) return [];
    
    const mangasWithChapters = [];
    
    for (const manga of mangas) {
      const chapters = await getChaptersPTBR(manga.id);
      if (chapters.length > 0) {
        mangasWithChapters.push({
          ...manga,
          chaptersPTBR: chapters
        });
        
        if (mangasWithChapters.length >= limit) break;
      }
    }
    
    return mangasWithChapters;
      
  } catch (error) {
    console.error("Erro ao buscar mangás populares PT-BR:", error);
    return [];
  }
};

// Buscar por título com capítulos recentes
export const searchMangasWithRecentChapters = async (title: string, limit: number = 20) => {
  try {
    // Busca mangás pelo título
    const mangaRes = await api.get(
      `/manga?title=${encodeURIComponent(title)}&limit=${limit}&includes[]=cover_art`
    );
    
    const mangas = mangaRes.data.data;
    
    if (mangas.length === 0) return [];
    
    const mangasWithRecentChapters = [];
    
    for (const manga of mangas) {
      // Busca os capítulos mais recentes deste mangá em PT-BR
      const chaptersRes = await api.get(
        `/chapter?manga=${manga.id}&translatedLanguage[]=pt-br&order[publishAt]=desc&limit=5`
      );
      
      const recentChapters = chaptersRes.data.data;
      
      if (recentChapters.length > 0) {
        mangasWithRecentChapters.push({
          ...manga,
          recentChaptersPTBR: recentChapters
        });
      }
    }
    
    return mangasWithRecentChapters;
    
  } catch (error) {
    console.error("Erro ao buscar mangás por título:", error);
    return [];
  }
};

// Funções auxiliares (mantidas)
export const getChaptersPTBR = async (mangaId: string) => {
  const res = await api.get(
    `/chapter?manga=${mangaId}&translatedLanguage[]=pt-br&limit=100`
  );
  return res.data.data;
};

export const getChapterPages = async (chapterId: string) => {
  const res = await api.get(`/at-home/server/${chapterId}`);
  return res.data;
};

export const getMangaById = async (mangaId: string) => {
  const res = await api.get(`/manga/${mangaId}?includes[]=cover_art&includes[]=author`);
  return res.data.data;
};

export const getMangaChaptersPTBR = async (mangaId: string) => {
  const res = await api.get(
    `/chapter?manga=${mangaId}&translatedLanguage[]=pt-br&order[chapter]=asc&limit=500`
  );
  return res.data.data;
};

// Buscar últimos capítulos lançados em PT-BR (timeline)
export const getRecentChaptersTimeline = async (limit: number = 50) => {
  try {
    const res = await api.get(
      `/chapter?translatedLanguage[]=pt-br&order[publishAt]=desc&limit=${limit}&includes[]=manga&includes[]=scanlation_group`
    );
    
    return res.data.data;
    
  } catch (error) {
    console.error("Erro ao buscar timeline de capítulos:", error);
    return [];
  }
};

export default api;