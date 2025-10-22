import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecentMangasPTBR } from '../../hooks/useManga';
import { useIsNewChapter } from '../../hooks/useRecentChapters';
import styles from './styles.module.scss';

const ITEMS_PER_PAGE = 24; // 24 mangás por página (bom para grid)

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Hook para mangás recentes COM PAGINAÇÃO
  const { mangas: allMangas, loading, error } = useRecentMangasPTBR(100); // Busca 100 e faz paginação local

  // Reset página quando search mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filtra mangás baseado na busca
  const filteredMangas = searchTerm 
    ? allMangas.filter(manga => {
        const title = manga.attributes.title.en || manga.attributes.title['pt-br'] || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : allMangas;

  // Paginação
  const totalPages = Math.ceil(filteredMangas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMangas = filteredMangas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handlers de paginação
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  return (
    <div className={styles.home}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar mangás em PT-BR..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando mangás...</div>
      ) : error ? (
        <div className={styles.error}>Erro: {error}</div>
      ) : (
        <>
          <div className={styles.sectionHeader}>
            <h1>Mangás Recentes</h1>
            <p>Mangás com os capítulos mais recentes em português</p>
            <div className={styles.resultsInfo}>
              {searchTerm ? (
                <>
                  {filteredMangas.length} resultado(s) para "{searchTerm}"
                </>
              ) : (
                <>
                  Mostrando {paginatedMangas.length} de {filteredMangas.length} mangás
                  {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
                </>
              )}
            </div>
          </div>

          {paginatedMangas.length === 0 ? (
            <div className={styles.noResults}>
              {searchTerm ? 'Nenhum mangá encontrado' : 'Nenhum mangá disponível'}
            </div>
          ) : (
            <>
              <div className={styles.mangaGrid}>
                {paginatedMangas.map(manga => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onNext={nextPage}
                  onPrev={prevPage}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// COMPONENTE MangaCard - CAPAS COM 3 ÚLTIMOS CAPÍTULOS
const MangaCard: React.FC<{ manga: any }> = ({ manga }) => {
  const title = manga.attributes.title.en || manga.attributes.title['pt-br'] || 'Sem título';
  const recentChapters = manga.recentChaptersPTBR || [];
  
  // Verifica se tem capítulo novo (últimos 7 dias)
  const hasNewChapter = recentChapters.some((chapter: any) => {
    const chapterDate = new Date(chapter.attributes.publishAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return chapterDate > sevenDaysAgo;
  });

  return (
    <div className={styles.mangaCard}>
      <Link to={`/manga/${manga.id}`} className={styles.coverLink}>
        <div className={styles.coverContainer}>
          <img 
            src={`https://mangadex.org/covers/${manga.id}/${getCoverFilename(manga)}`}
            alt={title}
            className={styles.cover}
          />
          {hasNewChapter && <div className={styles.newBadge}>NOVO</div>}
        </div>
      </Link>
      
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        
        {recentChapters.length > 0 ? (
          <div className={styles.recentChapters}>
            <span className={styles.recentLabel}>Últimos capítulos:</span>
            {recentChapters.map((chapter: any) => (
              <ChapterLink 
                key={chapter.id} 
                chapter={chapter} 
                mangaId={manga.id}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noChapters}>Nenhum capítulo em PT-BR</div>
        )}
      </div>
    </div>
  );
};

// COMPONENTE ChapterLink - para os capítulos dentro do MangaCard
const ChapterLink: React.FC<{ chapter: any; mangaId: string }> = ({ chapter, mangaId }) => {
  const isNew = useIsNewChapter(chapter.attributes.publishAt);
  
  return (
    <Link 
      to={`/manga/${mangaId}/chapter/${chapter.id}`}
      className={styles.chapterLink}
    >
      <div className={styles.chapterItem}>
        <span className={styles.chapterText}>
          Cap. {chapter.attributes.chapter}
        </span>
        {isNew && <span className={styles.chapterNewBadge}>NEW</span>}
      </div>
    </Link>
  );
};

// COMPONENTE DE PAGINAÇÃO
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ currentPage, totalPages, onPageChange, onNext, onPrev }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className={styles.pagination}>
      <button 
        className={styles.paginationButton}
        onClick={onPrev}
        disabled={currentPage === 1}
      >
        ← Anterior
      </button>
      
      {getPageNumbers().map(page => (
        <button
          key={page}
          className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      
      <button 
        className={styles.paginationButton}
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Próxima →
      </button>
      
      <span className={styles.pageInfo}>
        Página {currentPage} de {totalPages}
      </span>
    </div>
  );
};

const getCoverFilename = (manga: any) => {
  const coverArt = manga.relationships.find((rel: any) => rel.type === "cover_art");
  return coverArt?.attributes?.fileName || 'cover.jpg';
};

export default Home;