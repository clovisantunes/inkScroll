import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMangaDetails, useMangaStatistics } from '../../hooks/useMangaDetails';
import styles from './styles.module.scss';

const Manga: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { manga, chapters, loading, error } = useMangaDetails(id || '');
  const { statistics } = useMangaStatistics(id || '');

  if (loading) {
    return (
      <div className={styles.mangaPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando mangá...</p>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className={styles.mangaPage}>
        <div className={styles.errorContainer}>
          <h2>Erro ao carregar mangá</h2>
          <p>{error || 'Mangá não encontrado'}</p>
          <Link to="/" className={styles.backButton}>
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  const title = manga.attributes.title.en || manga.attributes.title['pt-br'] || 'Sem título';
  const description = manga.attributes.description.en || manga.attributes.description['pt-br'] || 'Sem descrição disponível.';
  const genres = manga.attributes.tags?.filter((tag: any) => tag.attributes.group === 'genre') || [];
  const themes = manga.attributes.tags?.filter((tag: any) => tag.attributes.group === 'theme') || [];
  const status = manga.attributes.status;
  
  const author = manga.relationships?.find((rel: any) => rel.type === 'author');
  const artist = manga.relationships?.find((rel: any) => rel.type === 'artist');

  // Estatísticas
  const rating = statistics?.rating?.average?.toFixed(2) || 'N/A';
  const follows = statistics?.follows || 0;
  const comments = statistics?.comments?.repliesCount || 0;

  return (
    <div className={styles.mangaPage}>
      <div className={styles.mangaHeader}>
        <div className={styles.coverContainer}>
          <img 
            src={`https://mangadex.org/covers/${manga.id}/${getCoverFilename(manga)}`}
            alt={title}
            className={styles.cover}
            loading="lazy"
          />
          
          {/* Estatísticas */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{rating}</span>
              <span className={styles.statLabel}>Avaliação</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{follows.toLocaleString('pt-BR')}</span>
              <span className={styles.statLabel}>Seguidores</span>
            </div>
          </div>
        </div>
        
        <div className={styles.mangaInfo}>
          <h1 className={styles.title}>{title}</h1>
          
          <div className={styles.creators}>
            {author && (
              <div className={styles.creator}>
                <strong>Autor:</strong> {author.attributes?.name || 'Desconhecido'}
              </div>
            )}
            {artist && artist.id !== author?.id && (
              <div className={styles.creator}>
                <strong>Artista:</strong> {artist.attributes?.name || 'Desconhecido'}
              </div>
            )}
          </div>
          
          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <strong>Status:</strong> {getStatusText(status)}
            </div>
            <div className={styles.metadataItem}>
              <strong>Capítulos:</strong> {chapters.length}
            </div>
          </div>
          
          <div className={styles.tags}>
            {genres.length > 0 && (
              <div className={styles.tagGroup}>
                <strong>Gêneros:</strong>
                <div className={styles.tagList}>
                  {genres.map((tag: any) => (
                    <span key={tag.id} className={styles.tag}>
                      {tag.attributes.name.en}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {themes.length > 0 && (
              <div className={styles.tagGroup}>
                <strong>Temas:</strong>
                <div className={styles.tagList}>
                  {themes.map((tag: any) => (
                    <span key={tag.id} className={styles.tag}>
                      {tag.attributes.name.en}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mangaContent}>
        <div className={styles.descriptionSection}>
          <h2>Sinopse</h2>
          <div className={styles.description}>
            {cleanDescription(description)}
          </div>
        </div>

        <div className={styles.chaptersSection}>
          <div className={styles.sectionHeader}>
            <h2>Capítulos ({chapters.length})</h2>
            {chapters.length > 0 && (
              <div className={styles.chapterFilters}>
                <span>Ordenar por: </span>
                <select className={styles.filterSelect}>
                  <option value="desc">Mais recentes primeiro</option>
                  <option value="asc">Mais antigos primeiro</option>
                </select>
              </div>
            )}
          </div>
          
          {chapters.length === 0 ? (
            <div className={styles.noChapters}>
              <p>Nenhum capítulo disponível em PT-BR</p>
              <Link to="/" className={styles.browseLink}>
                Explorar outros mangás
              </Link>
            </div>
          ) : (
            <div className={styles.chaptersList}>
              {chapters.map((chapter: any) => (
                <ChapterItem 
                  key={chapter.id} 
                  chapter={chapter} 
                  mangaId={manga.id} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para item de capítulo
const ChapterItem: React.FC<{ chapter: any; mangaId: string }> = ({ chapter, mangaId }) => {
  const chapterNumber = chapter.attributes.chapter;
  const chapterTitle = chapter.attributes.title;
  const publishDate = new Date(chapter.attributes.publishAt);
  const scanlationGroup = chapter.relationships?.find((rel: any) => rel.type === "scanlation_group");

  // Verificar se é um capítulo novo (últimos 7 dias)
  const isNew = (Date.now() - publishDate.getTime()) < (7 * 24 * 60 * 60 * 1000);

  return (
    <div className={styles.chapterItem}>
      <Link to={`/manga/${mangaId}/chapter/${chapter.id}`} className={styles.chapterLink}>
        <div className={styles.chapterMain}>
          <div className={styles.chapterInfo}>
            <span className={styles.chapterNumber}>Capítulo {chapterNumber}</span>
            {chapterTitle && <span className={styles.chapterTitle}> - {chapterTitle}</span>}
            {isNew && <span className={styles.newBadge}>NOVO</span>}
          </div>
          
          <div className={styles.chapterMeta}>
            {scanlationGroup && (
              <span className={styles.scanlationGroup}>
                {scanlationGroup.attributes?.name}
              </span>
            )}
            <span className={styles.publishDate}>
              {publishDate.toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        
        <div className={styles.chapterArrow}>→</div>
      </Link>
    </div>
  );
};

// Helper functions
const getCoverFilename = (manga: any) => {
  const coverArt = manga.relationships?.find((rel: any) => rel.type === "cover_art");
  return coverArt?.attributes?.fileName || 'cover.jpg';
};

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'ongoing': '📖 Em andamento',
    'completed': '✅ Completo',
    'hiatus': '⏸️ Em hiato',
    'cancelled': '❌ Cancelado'
  };
  return statusMap[status] || status;
};

const cleanDescription = (description: string) => {
  return description
    .replace(/\[.*?\]/g, '')
    .replace(/<.*?>/g, '')
    .replace(/\n\s*\n/g, '\n\n') 
    .trim();
};

export default Manga;