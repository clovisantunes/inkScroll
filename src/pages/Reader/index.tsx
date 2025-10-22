import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useChapter } from '../../hooks/useChapter';
import styles from './styles.module.scss';

const Reader: React.FC = () => {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const [useDataSaver, setUseDataSaver] = useState(false);
  
  const { 
    chapter, 
    pages, 
    loading, 
    error, 
    adjacentChapters 
  } = useChapter(chapterId, mangaId);

  const navigate = useNavigate();

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousPage();
      else if (e.key === 'ArrowRight') goToNextPage();
      else if (e.key === 'Home') goToFirstPage();
      else if (e.key === 'End') goToLastPage();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, pages]);

  // Reset para primeira página quando o capítulo mudar
  useEffect(() => {
    setCurrentPage(0);
  }, [chapterId]);

  const goToNextPage = () => {
    if (pages?.chapter?.data && currentPage < pages.chapter.data.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (adjacentChapters.next) {
      // Vai para o próximo capítulo automaticamente
      navigate(`/manga/${mangaId}/chapter/${adjacentChapters.next}`);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (adjacentChapters.prev) {
      // Vai para o capítulo anterior automaticamente
      navigate(`/manga/${mangaId}/chapter/${adjacentChapters.prev}`);
      // Define para a última página do capítulo anterior
      setTimeout(() => setCurrentPage(getLastPageNumber() - 1), 100);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(0);
  };

  const goToLastPage = () => {
    if (pages?.chapter?.data) {
      setCurrentPage(pages.chapter.data.length - 1);
    }
  };

  const getLastPageNumber = () => {
    return pages?.chapter?.data?.length || 0;
  };

  const handlePageSelect = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const toggleDataSaver = () => {
    setUseDataSaver(!useDataSaver);
  };

  if (loading) {
    return (
      <div className={styles.readerPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando capítulo...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter || !pages) {
    return (
      <div className={styles.readerPage}>
        <div className={styles.errorContainer}>
          <h2>Erro ao carregar capítulo</h2>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <Link to={`/manga/${mangaId}`} className={styles.backButton}>
              ← Voltar para o mangá
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className={styles.retryButton}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPageData = useDataSaver 
    ? pages.chapter.dataSaver[currentPage] 
    : pages.chapter.data[currentPage];
  
  const pageUrl = `${pages.baseUrl}/data${useDataSaver ? '-saver' : ''}/${pages.chapter.hash}/${currentPageData}`;

  const manga = chapter.relationships.find((rel: any) => rel.type === "manga");
  const scanlationGroup = chapter.relationships.find((rel: any) => rel.type === "scanlation_group");

  return (
    <div className={styles.readerPage}>
      {/* Header */}
      <div className={styles.readerHeader}>
        <div className={styles.headerLeft}>
          <Link to={`/manga/${mangaId}`} className={styles.backButton}>
            ← Voltar ao Mangá
          </Link>
        </div>

        <div className={styles.chapterInfo}>
          <h1 className={styles.mangaTitle}>
            {manga?.attributes?.title?.en || manga?.attributes?.title?.['pt-br'] || 'Mangá'}
          </h1>
          <div className={styles.chapterDetails}>
            <span className={styles.chapterNumber}>Capítulo {chapter.attributes.chapter}</span>
            {chapter.attributes.title && (
              <span className={styles.chapterTitle}> - {chapter.attributes.title}</span>
            )}
            {scanlationGroup?.attributes?.name && (
              <span className={styles.scanlationGroup}> • {scanlationGroup.attributes.name}</span>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          <button 
            onClick={toggleDataSaver}
            className={`${styles.dataSaverButton} ${useDataSaver ? styles.active : ''}`}
            title={useDataSaver ? "Modo normal (maior qualidade)" : "Modo economia de dados"}
          >
            {useDataSaver ? 'HD' : 'SD'}
          </button>
          <div className={styles.pageInfo}>
            Página {currentPage + 1} de {pages.chapter.data.length}
          </div>
        </div>
      </div>

      {/* Leitor */}
      <div className={styles.readerContainer}>
        <button
          className={styles.navButton}
          onClick={goToPreviousPage}
          disabled={currentPage === 0 && !adjacentChapters.prev}
          title="Página anterior (Seta Esquerda)"
        >
          ‹
        </button>

        <div className={styles.pageContainer}>
          <img
            src={pageUrl}
            alt={`Página ${currentPage + 1}`}
            className={styles.mangaPage}
            onClick={goToNextPage}
            onError={(e) => {
              // Fallback para data-saver se a imagem normal falhar
              if (!useDataSaver) {
                const fallbackUrl = `${pages.baseUrl}/data-saver/${pages.chapter.hash}/${pages.chapter.dataSaver[currentPage]}`;
                e.currentTarget.src = fallbackUrl;
              }
            }}
          />
        </div>

        <button
          className={styles.navButton}
          onClick={goToNextPage}
          disabled={currentPage === pages.chapter.data.length - 1 && !adjacentChapters.next}
          title="Próxima página (Seta Direita)"
        >
          ›
        </button>
      </div>

      {/* Controles */}
      <div className={styles.readerControls}>
        <div className={styles.controlGroup}>
          <button
            className={styles.controlButton}
            onClick={goToPreviousPage}
            disabled={currentPage === 0 && !adjacentChapters.prev}
          >
            {adjacentChapters.prev ? 'Cap. Anterior' : 'Página Anterior'}
          </button>

          <button
            className={styles.controlButton}
            onClick={goToFirstPage}
            disabled={currentPage === 0}
          >
            Primeira
          </button>
        </div>

        <div className={styles.pageSelectorContainer}>
          <select
            value={currentPage}
            onChange={(e) => handlePageSelect(Number(e.target.value))}
            className={styles.pageSelector}
          >
            {pages.chapter.data.map((_: any, index: number) => (
              <option key={index} value={index}>
                Página {index + 1}
              </option>
            ))}
          </select>
          <span className={styles.pageCount}>/ {pages.chapter.data.length}</span>
        </div>

        <div className={styles.controlGroup}>
          <button
            className={styles.controlButton}
            onClick={goToLastPage}
            disabled={currentPage === pages.chapter.data.length - 1}
          >
            Última
          </button>

          <button
            className={styles.controlButton}
            onClick={goToNextPage}
            disabled={currentPage === pages.chapter.data.length - 1 && !adjacentChapters.next}
          >
            {adjacentChapters.next ? 'Próx. Cap.' : 'Próxima Página'}
          </button>
        </div>
      </div>

      {/* Navegação entre capítulos */}
      {(adjacentChapters.prev || adjacentChapters.next) && (
        <div className={styles.adjacentChapters}>
          {adjacentChapters.prev && (
            <Link 
              to={`/manga/${mangaId}/chapter/${adjacentChapters.prev}`}
              className={styles.adjacentButton}
            >
              ← Capítulo Anterior
            </Link>
          )}
          
          {adjacentChapters.next && (
            <Link 
              to={`/manga/${mangaId}/chapter/${adjacentChapters.next}`}
              className={styles.adjacentButton}
            >
              Próximo Capítulo →
            </Link>
          )}
        </div>
      )}

      {/* Dicas de navegação */}
      <div className={styles.navigationHint}>
        <p>
          <strong>Dicas de navegação:</strong> Use as setas ← → do teclado para navegar entre páginas. 
          Pressione <kbd>Home</kbd> para ir para a primeira página ou <kbd>End</kbd> para a última.
        </p>
      </div>
    </div>
  );
};

export default Reader;